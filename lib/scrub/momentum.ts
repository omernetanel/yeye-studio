/**
 * IS THE PAGE MOVING UNDER A THUMB'S MOMENTUM - and nothing else?
 *
 * A story section on a phone stops a throw at the line of its next moment (see
 * stepped-playhead.ts), and the whole of that depends on telling a throw apart
 * from everything else that scrolls the page:
 *
 * - A finger still on the glass is the reader in control. It is never stopped:
 *   a page halting under the thumb is the thing this must never do.
 * - A wheel is a desk, where the scroll comes in small steps the hand already
 *   controls. Nothing to stop.
 * - The menu's own travel to a section, and the placement of a page arriving at
 *   a hash, are the site moving itself. Stopping those would strand a reader
 *   who asked to go somewhere halfway there. The first is a smooth scroll Lenis
 *   is running; the second is a single jump - see the owner's check on both.
 *
 * What is left is the glide after a finger lifts. It lasts about three seconds
 * at most on iOS, and that is the window in which a scroll counts as momentum.
 */

const MOMENTUM_WINDOW_MS = 3000;

let installed = false;
let touching = false;
let touchDriven = false;
let lastTouchEnd = Number.NEGATIVE_INFINITY;

/** Starts listening. Idempotent: every section that asks shares one set of listeners. */
export function trackTouch() {
  if (installed) return;
  installed = true;
  const options = { passive: true, capture: true } as const;
  window.addEventListener(
    "touchstart",
    () => {
      touching = true;
      touchDriven = true;
    },
    options
  );
  const lift = (event: TouchEvent) => {
    if (event.touches.length > 0) return;
    touching = false;
    lastTouchEnd = performance.now();
  };
  window.addEventListener("touchend", lift, options);
  window.addEventListener("touchcancel", lift, options);
  window.addEventListener(
    "wheel",
    () => {
      touchDriven = false;
    },
    options
  );
}

/** Whether the scroll right now is a thumb's glide after it lifted. */
export function isMomentum() {
  return touchDriven && !touching && performance.now() - lastTouchEnd < MOMENTUM_WINDOW_MS;
}

/**
 * Ends a glide and leaves the page at `y`.
 *
 * Taking the page's overflow away for a frame is what iOS actually listens to:
 * a scroll it is carrying on its own momentum ignores a plain scrollTo and
 * glides on from wherever it was put. Hidden, there is nothing to glide; given
 * back a frame later, the page is simply at rest where it was stopped. Inside a
 * pinned panel none of this is visible - the only thing the reader sees is that
 * the throw brought them to the next moment.
 */
export function stopMomentumAt(y: number) {
  const root = document.documentElement;
  const previous = root.style.overflow;
  root.style.overflow = "hidden";
  window.scrollTo(0, y);
  requestAnimationFrame(() => {
    root.style.overflow = previous;
  });
}
