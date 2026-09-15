/**
 * A clip played by the scroll position — as a sequence of still frames drawn to
 * a canvas, not as a <video> whose currentTime is set.
 *
 * WHY NOT THE VIDEO. Scrubbing means holding a video paused and moving its
 * clock on every scroll tick. Chrome, Edge and Firefox repaint a paused, seeked
 * video faithfully; Safari on iPhone and iPad does not. It will not buffer ahead
 * without a play, it does not reliably present the frame a seek lands on, and in
 * Low Power Mode it refuses to play at all. None of that is controllable from a
 * page. On a real iPhone the paper sat on whatever frame matched the scroll
 * position at load — the crumpled ball from the top, a blank sheet from further
 * down — and never moved again.
 *
 * Frames drawn to a canvas depend on none of it, which is why Apple's own
 * scroll-driven product pages are built this way. The engine is the same on
 * every device, so there is one path to keep correct instead of two.
 *
 * The files are the clip's own frames at its own frame rate and resolution — see
 * where each section declares its sequence for the exact command that made them.
 */

export interface FrameSequence {
  /** URL of frame `index`, 0-based. */
  frameUrl: (index: number) => string;
  frameCount: number;
  /** Every frame's intrinsic size — the canvas fits it the way object-fit:
   * contain would, centred, so this replaces a contained video exactly. */
  width: number;
  height: number;
}

// Downloads run this many at a time. Enough to fill a connection quickly over
// HTTP/2 without starving the rest of the page of it.
const LOAD_CONCURRENCY = 6;

// COARSE TO FINE. The first pass fetches every 16th frame, and each pass after
// it halves the gaps. A reader who reaches the section before the download is
// done gets a clip that already moves the whole way through — at a lower frame
// rate for a moment — instead of one that is smooth up to some point and frozen
// past it.
const PASS_STEPS = [16, 8, 4, 2, 1];

// Frames beside the one on screen that are fetched ahead of the queue, so the
// neighbourhood a finger is about to scroll into is always the sharpest part.
const PRIORITY_RADIUS = 8;

// How many frames are held DECODED at once, and how many on each side of the
// current one are decoded ahead of need.
//
// This is the number that keeps an iPhone from killing the tab. A decoded frame
// is width × height × 4 bytes — 8MB at 1920×1080, 3.7MB at 720×1280 — so a whole
// clip held decoded is several gigabytes. The compressed files are kept instead
// (a few megabytes in all), and only this small window around the reader's
// position is ever turned into pixels; anything further is released.
const DECODED_CAPACITY = 12;
const DECODE_RADIUS = 4;

// Canvas resolution ceiling. The frames carry no more detail than the clip did,
// and a 3x backing on a phone would triple the memory and the cost of every draw
// for nothing the eye can find.
const MAX_CANVAS_DPR = 2;

// Loading starts when the canvas is within a screen and a half of the viewport:
// early enough that the first frames are in before the section arrives, late
// enough that a visitor who never scrolls that far never downloads them.
const LOAD_ROOT_MARGIN = "150% 0px";

type Drawable = ImageBitmap | HTMLImageElement;

async function decodeFrame(blob: Blob): Promise<Drawable> {
  // createImageBitmap decodes off the main thread, so a frame arriving mid-
  // scroll costs the scroll nothing. It exists in every browser since Safari 15;
  // the image path below covers the phones that predate it.
  if (typeof createImageBitmap === "function") return createImageBitmap(blob);
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function releaseFrame(frame: Drawable) {
  // An ImageBitmap's pixels are freed only on close(); leaving it to garbage
  // collection is exactly how a window of twelve frames grows into hundreds.
  if ("close" in frame) frame.close();
}

export class ScrollFrames {
  private readonly context: CanvasRenderingContext2D;
  private readonly blobs: (Blob | null)[];
  private readonly inFlight = new Set<number>();
  // Frames that could not be fetched or decoded. They are never asked for again:
  // without this, a bad file would be re-fetched every time the reader scrolled
  // near it, for as long as the page was open. Their neighbours stand in.
  private readonly failed = new Set<number>();
  private readonly decoded = new Map<number, Drawable>();
  private readonly decoding = new Set<number>();
  private readonly abort = new AbortController();
  private readonly resizeObserver: ResizeObserver;
  private readonly loadObserver: IntersectionObserver;
  private queue: number[] = [];
  private queueCursor = 0;
  private target = 0;
  private drawnIndex = -1;
  private disposed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly sequence: FrameSequence
  ) {
    this.context = canvas.getContext("2d")!;
    this.blobs = new Array<Blob | null>(sequence.frameCount).fill(null);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);

    this.loadObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) this.startLoading();
      },
      { rootMargin: LOAD_ROOT_MARGIN }
    );
    this.loadObserver.observe(canvas);

    this.resize();
  }

  /** Show frame `index` — or, until it has arrived, the nearest one that has. */
  show(index: number) {
    if (this.disposed) return;
    const target = Math.min(this.sequence.frameCount - 1, Math.max(0, Math.round(index)));
    // Most scroll events land on the frame that is already showing. There is
    // nothing to fetch, decode or draw then, so return before any of the
    // searches below run.
    if (target === this.target && target === this.drawnIndex) return;
    this.target = target;
    this.decodeAround(target);
    this.draw();
  }

  dispose() {
    this.disposed = true;
    this.abort.abort();
    this.resizeObserver.disconnect();
    this.loadObserver.disconnect();
    for (const frame of this.decoded.values()) releaseFrame(frame);
    this.decoded.clear();
  }

  private startLoading() {
    this.loadObserver.disconnect();
    if (this.queue.length) return;

    const seen = new Set<number>();
    const enqueue = (index: number) => {
      if (seen.has(index)) return;
      seen.add(index);
      this.queue.push(index);
    };
    const last = this.sequence.frameCount - 1;
    enqueue(this.target);
    for (const step of PASS_STEPS) {
      for (let index = 0; index <= last; index += step) enqueue(index);
    }
    enqueue(last);

    for (let worker = 0; worker < LOAD_CONCURRENCY; worker++) void this.runWorker();
  }

  /** Not here yet, not on its way, and not given up on. */
  private needsFetch(index: number) {
    return !this.blobs[index] && !this.inFlight.has(index) && !this.failed.has(index);
  }

  /** The next frame to fetch: the reader's neighbourhood first, then the queue. */
  private nextToFetch(): number | null {
    for (let offset = 0; offset <= PRIORITY_RADIUS; offset++) {
      for (const index of [this.target + offset, this.target - offset]) {
        if (index >= 0 && index < this.sequence.frameCount && this.needsFetch(index)) return index;
      }
    }
    while (this.queueCursor < this.queue.length) {
      const index = this.queue[this.queueCursor++];
      if (this.needsFetch(index)) return index;
    }
    return null;
  }

  private async runWorker() {
    for (let index = this.nextToFetch(); index !== null && !this.disposed; index = this.nextToFetch()) {
      this.inFlight.add(index);
      try {
        const response = await fetch(this.sequence.frameUrl(index), { signal: this.abort.signal });
        // A frame that fails is given up on rather than retried: its neighbours
        // stand in for it, which is invisible, and a retry loop on a dead
        // connection is not.
        if (response.ok) this.blobs[index] = await response.blob();
        else this.failed.add(index);
      } catch {
        if (this.disposed) return;
        this.failed.add(index);
      } finally {
        this.inFlight.delete(index);
      }
      if (this.blobs[index] && Math.abs(index - this.target) <= DECODE_RADIUS + 1) {
        this.decodeAround(this.target);
      }
    }
  }

  /** Decode the frames nearest `center` that have arrived, and let go of far ones. */
  private decodeAround(center: number) {
    // The nearest ARRIVED frame, which is the one that will be drawn — searched
    // outward, because early in the load the target itself is often not in yet.
    let nearest = -1;
    for (let offset = 0; offset < this.sequence.frameCount; offset++) {
      if (this.blobs[center + offset]) {
        nearest = center + offset;
        break;
      }
      if (this.blobs[center - offset]) {
        nearest = center - offset;
        break;
      }
    }
    if (nearest === -1) return;

    this.decode(nearest);
    for (let offset = 1; offset <= DECODE_RADIUS; offset++) {
      this.decode(center + offset);
      this.decode(center - offset);
    }
  }

  private decode(index: number) {
    const blob = this.blobs[index];
    if (!blob || this.decoded.has(index) || this.decoding.has(index)) return;
    this.decoding.add(index);
    decodeFrame(blob)
      .then((frame) => {
        if (this.disposed) {
          releaseFrame(frame);
          return;
        }
        this.decoded.set(index, frame);
        this.evict();
        this.draw();
      })
      .catch(() => {
        // An undecodable file is treated like a failed fetch: dropped, never
        // asked for again, and stood in for by its neighbours.
        this.blobs[index] = null;
        this.failed.add(index);
      })
      .finally(() => {
        this.decoding.delete(index);
      });
  }

  private evict() {
    while (this.decoded.size > DECODED_CAPACITY) {
      let farthest = -1;
      for (const index of this.decoded.keys()) {
        if (farthest === -1 || Math.abs(index - this.target) > Math.abs(farthest - this.target)) farthest = index;
      }
      releaseFrame(this.decoded.get(farthest)!);
      this.decoded.delete(farthest);
      if (farthest === this.drawnIndex) this.drawnIndex = -1;
    }
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_CANVAS_DPR);
    // clientWidth, not getBoundingClientRect: the sections scale and shift this
    // element with CSS transforms, and the backing store belongs to its layout
    // box, exactly as a video's decoded frame did.
    const width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width === width && this.canvas.height === height) return;
    // Resizing clears the canvas, so whatever was on it has to be drawn again.
    this.canvas.width = width;
    this.canvas.height = height;
    this.drawnIndex = -1;
    this.draw();
  }

  private draw() {
    // The decoded frame nearest the target. Normally the target itself; while
    // the load is still filling in, its closest neighbour.
    let index = -1;
    for (let offset = 0; offset < this.sequence.frameCount; offset++) {
      if (this.decoded.has(this.target + offset)) {
        index = this.target + offset;
        break;
      }
      if (this.decoded.has(this.target - offset)) {
        index = this.target - offset;
        break;
      }
    }
    if (index === -1 || index === this.drawnIndex) return;

    const { width: canvasWidth, height: canvasHeight } = this.canvas;
    const scale = Math.min(canvasWidth / this.sequence.width, canvasHeight / this.sequence.height);
    const drawWidth = this.sequence.width * scale;
    const drawHeight = this.sequence.height * scale;
    this.context.clearRect(0, 0, canvasWidth, canvasHeight);
    this.context.imageSmoothingQuality = "high";
    this.context.drawImage(
      this.decoded.get(index)!,
      (canvasWidth - drawWidth) / 2,
      (canvasHeight - drawHeight) / 2,
      drawWidth,
      drawHeight
    );
    this.drawnIndex = index;
  }
}
