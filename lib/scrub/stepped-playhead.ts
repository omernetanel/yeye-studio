/**
 * THE SCROLL PICKS THE MOMENT, A CLOCK PLAYS IT.
 *
 * A scrubbed section maps every pixel of scroll to a moment of its animation,
 * and on a desk that is exactly right: a wheel moves in small steps and the hand
 * sets the pace. On a phone it is exactly wrong, because a thumb does not scroll,
 * it throws. The throw and the momentum after it decide where the page stops,
 * not the reader, so a scrubbed paper opened at the speed of the flick, ran the
 * stages past in a blur, and came to rest wherever the momentum died - a sheet
 * half open, a stage mid-swap, a ball half turned into a plane.
 *
 * So on a phone the scroll no longer drives the animation's time. It only picks
 * which STEP the reader is on - a moment that was designed to be looked at - and
 * the playhead travels there on its own clock, at a pace set here rather than by
 * the thumb:
 *
 * - A slow scroll crosses one line, and that one transition plays.
 * - A throw crosses three, and all three play in order, a little faster because
 *   they are queued, but never skipped and never shown half done.
 * - Scrolling back crosses the lines the other way and the same frames play in
 *   reverse. Changing your mind halfway turns the playhead round from wherever
 *   it is, so nothing jumps.
 *
 * The scroll itself is never touched: no snapping, no captured gestures, no
 * momentum of our own. The page stops exactly where the reader lets it go.
 *
 * Before the first step there is a FREE stretch, where the scroll drives the
 * progress directly, pixel for pixel - for a section whose opening is something
 * to read rather than something to watch.
 *
 * THE PLAYHEAD LIVES IN ONE SPACE. -1 is the top of the free stretch, 0 is its
 * end and the first anchor, and 1, 2, 3... are the steps. Keeping the free
 * stretch on the same line as the steps is what lets a reader scroll up out of
 * stage three and see the playhead travel all the way back into the list on the
 * same smooth curve, instead of arriving at the end of the list and jumping to
 * wherever their thumb already is.
 *
 * Knows nothing about any section: it is handed a progress space and the
 * anchors in it, and it hands back a progress to render.
 */

export interface SteppedPlayheadOptions {
  /**
   * Scroll travel, in screens, that stays finger-driven before the first step.
   * Zero for a section that is stepped from its first pixel.
   */
  freeScreens: number;
  /**
   * The rest states, in the section's own progress space, in order. The first
   * is where the free stretch ends, and every one after it is a moment the
   * reader can be left looking at.
   */
  anchors: readonly number[];
  /**
   * Seconds each transition takes at its own pace: `durations[k]` is the move
   * from `anchors[k]` to `anchors[k + 1]`, so there is one fewer than anchors.
   */
  durations: readonly number[];
  /** Scroll travel, in screens, that picks one step. */
  stepScreens: number;
  /**
   * Scroll travel, in screens, after the last step's line and before the
   * section lets go of the screen - room for the last transition to be seen
   * before the page moves on.
   */
  tailScreens: number;
  /** Called with the progress to show, every time it changes. */
  render: (progress: number) => void;
}

/**
 * How far past a line the scroll has to go before the step changes, and back
 * again before it changes back, in screens. Without it a thumb resting on a line
 * sets the playhead flapping between two moments.
 */
const HYSTERESIS_SCREENS = 0.08;

/**
 * How much faster the playhead may go when it is several steps behind. A throw
 * that crosses four lines still shows all four transitions, but not at a pace
 * that has the reader waiting ten seconds for the page to catch up with them.
 */
const MAX_HURRY = 2.2;

/**
 * The pace back through the free stretch, for the whole of it, when the
 * playhead is returning from the steps rather than following the thumb.
 */
const FREE_RETURN_SECONDS = 0.6;

// Below these the playhead is at its target and the loop stops, so nothing runs
// on a phone that is only sitting there.
const SETTLED_DISTANCE = 0.0005;
const SETTLED_SPEED = 0.002;

/**
 * The whole scroll travel a section needs, in screens: the free stretch, one
 * step's worth of scroll between each pair of lines, and the tail after the
 * last one. A function of the options alone, so a section can size itself on
 * the server before any playhead exists - and from the same arithmetic the
 * playhead uses, rather than a second copy of it that could drift.
 */
export function travelScreensFor(options: Omit<SteppedPlayheadOptions, "render">) {
  return options.freeScreens + (options.anchors.length - 2) * options.stepScreens + options.tailScreens;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * A critically damped approach to a moving target - the same curve game engines
 * use for a camera following something, and for the same reason: it starts
 * gently, never overshoots, and can be pointed somewhere new mid-move without a
 * jerk, which is exactly what a reader changing their mind needs.
 * `smoothTime` is roughly how long it takes to arrive; `maxSpeed` caps a long run.
 */
function smoothDamp(
  current: number,
  target: number,
  velocity: number,
  smoothTime: number,
  maxSpeed: number,
  dt: number
): [number, number] {
  const time = Math.max(0.0001, smoothTime);
  const omega = 2 / time;
  const x = omega * dt;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const maxChange = maxSpeed * time;
  const change = clamp(current - target, -maxChange, maxChange);
  const clampedTarget = current - change;
  const temp = (velocity + omega * change) * dt;
  let nextVelocity = (velocity - omega * temp) * decay;
  let next = clampedTarget + (change + temp) * decay;
  // Never past the real target, whichever side it is on.
  if (target - current > 0 === next > target) {
    next = target;
    nextVelocity = 0;
  }
  return [next, nextVelocity];
}

export class SteppedPlayhead {
  private readonly options: SteppedPlayheadOptions;
  private readonly lastStep: number;

  /** Where the playhead is: -1 to 0 across the free stretch, then 1, 2, 3... */
  private position = -1;
  private velocity = 0;
  private target = -1;
  /** The last whole step the scroll picked, which the hysteresis is measured from. */
  private step = 0;
  private placed = false;

  private frame: number | null = null;
  private lastTime = 0;

  constructor(options: SteppedPlayheadOptions) {
    this.options = options;
    this.lastStep = options.anchors.length - 1;
  }

  /** See travelScreensFor. */
  get travelScreens() {
    return travelScreensFor(this.options);
  }

  /**
   * The reader's scroll position inside the section, in screens from where it
   * pins. Called on every scroll event; cheap, and only starts the clock when
   * there is somewhere new to go.
   */
  setScroll(screens: number) {
    const { freeScreens, stepScreens } = this.options;

    // Off the end: the section is letting go of the screen, so it leaves in its
    // final state rather than mid-transition with the page moving under it.
    if (screens >= this.travelScreens) {
      this.place(this.lastStep);
      return;
    }

    if (screens < freeScreens) {
      this.step = 0;
      this.target = -1 + clamp(screens / Math.max(freeScreens, 0.0001), 0, 1);
      // The free stretch belongs to the finger - but only once the playhead is
      // in it and not still on its way back from the steps.
      if (this.position <= 0 && this.frame === null) {
        this.place(this.target);
        return;
      }
    } else {
      // Which line the scroll is past, with a margin either side of each so a
      // thumb resting on one does not flip the step back and forth.
      //
      // The line into step k sits at k - 1: the first one right where the free
      // stretch ends. Half a step later, as it first was, left a strip of
      // scroll after the list had gone in which nothing happened at all - the
      // very "a lot of scrolling before it opens" this exists to end.
      const raw = (screens - freeScreens) / stepScreens;
      const margin = HYSTERESIS_SCREENS / stepScreens;
      while (this.step < this.lastStep && raw > this.step + margin) this.step += 1;
      while (this.step > 0 && raw < this.step - 1 - margin) this.step -= 1;
      this.target = this.step;
    }

    // Arriving on the page already inside the section - a reload, a link - is
    // not a transition anyone asked to watch. The first reading is placed.
    if (!this.placed) {
      this.place(this.target);
      return;
    }
    this.run();
  }

  /** Stops the clock. The section is going away. */
  dispose() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  private place(position: number) {
    this.dispose();
    this.placed = true;
    this.target = position;
    this.position = position;
    this.velocity = 0;
    if (position >= 0) this.step = Math.round(position);
    this.options.render(this.progressAt(position));
  }

  private run() {
    if (this.frame !== null) return;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    // Capped, so a tab that was in the background does not come back and cover
    // the whole distance in one frame.
    const dt = Math.min(0.05, Math.max(0, (now - this.lastTime) / 1000));
    this.lastTime = now;

    const gap = this.target - this.position;
    if (Math.abs(gap) < SETTLED_DISTANCE && Math.abs(this.velocity) < SETTLED_SPEED) {
      this.position = this.target;
      this.velocity = 0;
      this.frame = null;
      this.options.render(this.progressAt(this.position));
      return;
    }

    // The pace of the stretch the playhead is in, in the direction it is going:
    // moving back from stage three into stage two plays at stage two's pace.
    const ahead = gap > 0 ? this.position + SETTLED_DISTANCE : this.position - SETTLED_DISTANCE;
    const duration =
      ahead < 0
        ? FREE_RETURN_SECONDS
        : (this.options.durations[clamp(gap > 0 ? Math.floor(ahead) : Math.ceil(ahead) - 1, 0, this.lastStep - 1)] ?? 1);
    const hurry = clamp(Math.abs(gap), 1, MAX_HURRY);
    // One step in `duration` seconds. The smooth time is a fraction of that
    // because the damped curve spends its last stretch arriving gently, and
    // over a whole step that should still add up to roughly the stated pace.
    [this.position, this.velocity] = smoothDamp(
      this.position,
      this.target,
      this.velocity,
      (duration * 0.42) / hurry,
      (1.6 * hurry) / duration,
      dt
    );

    this.options.render(this.progressAt(this.position));
    this.frame = requestAnimationFrame(this.tick);
  };

  /**
   * Progress for a playhead position. Across the free stretch it is the
   * thumb's own share of the way to the first anchor; between steps it is
   * linear between the two anchors - not eased, because inside a transition
   * the clip should play at the speed it was filmed, and the easing is already
   * in how the playhead moves.
   */
  private progressAt(position: number) {
    const { anchors } = this.options;
    if (position < 0) return anchors[0] * clamp(position + 1, 0, 1);
    const p = clamp(position, 0, this.lastStep);
    const k = Math.min(Math.floor(p), this.lastStep - 1);
    return anchors[k] + (anchors[k + 1] - anchors[k]) * (p - k);
  }
}
