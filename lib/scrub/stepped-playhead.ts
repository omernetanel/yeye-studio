/**
 * A PINNED STORY ON A PHONE: THE READER DECIDES WHEN, THE DESIGN DECIDES WHAT.
 *
 * A scrubbed section maps every pixel of scroll to a moment of its animation,
 * and on a desk that is exactly right: a wheel moves in small steps and the hand
 * sets the pace. On a phone it is exactly wrong, because a thumb does not scroll,
 * it throws. The throw and the momentum after it decide where the page stops,
 * and a section built from real footage - a paper on a white ground - has
 * frames in the middle of every movement that mean nothing on their own: half a
 * crumple, a ball half turned into a plane, an empty sheet between two stages.
 *
 * So the story is a row of REST STATES - frames that were designed to be looked
 * at - joined by transitions of two kinds:
 *
 * - SCRUB, where the finger drives it pixel for pixel, as it always did. Used
 *   only where every frame in between is itself a good frame: the ball with the
 *   services on it, the plane flying off.
 * - PLAY, where crossing a line in the scroll plays the transition on its own
 *   clock, at a pace set here, and it only ever comes to rest at one end or the
 *   other. A reader who swipes on while it plays makes it finish faster; one who
 *   swipes back plays it back. Either way the screen is never left standing on
 *   a frame nobody designed.
 *
 * AND A THROW NEVER CARRIES THROUGH A LINE. When momentum - never a finger -
 * crosses the line of a played transition, the owner is asked to stop the page
 * just past it. The panel is pinned, so nothing visible moves when that happens:
 * the only thing the reader sees is that one throw brought them to the next
 * moment, and it played. Without it one throw ran three moments together and
 * left the pin before the clock had started, which is exactly what it did on a
 * real phone.
 *
 * Knows nothing about any section: it is handed a progress space and the rest
 * states in it, and it hands back a progress to render.
 */

export type Transition =
  | {
      kind: "scrub";
      /** Scroll travel, in screens, the finger takes to run it. */
      screens: number;
    }
  | {
      kind: "play";
      /**
       * Scroll travel, in screens, from its line to the next one - the room the
       * rest state it arrives at is shown in.
       */
      screens: number;
      /** How long it takes to play, in seconds, at its own pace. */
      seconds: number;
    };

export interface StoryOptions {
  /**
   * The rest states, in the section's own progress space, in order. One more
   * than there are transitions: `transitions[k]` runs from `anchors[k]` to
   * `anchors[k + 1]`.
   */
  anchors: readonly number[];
  transitions: readonly Transition[];
  /** Called with the progress to show, every time it changes. */
  render: (progress: number) => void;
  /**
   * Called when momentum has crossed a played transition's line, with where to
   * stop the page, in screens from where the section pins. The owner knows
   * where the section sits on the page; this only knows the lines.
   */
  brake?: (screens: number) => void;
}

/**
 * How far past a line the scroll has to go before a transition plays, and back
 * again before it plays back, in screens. Without it a thumb resting on a line
 * sets the story flapping between two moments.
 */
const MARGIN_SCREENS = 0.08;

/**
 * Where a braked throw is stopped, in screens past the line - beyond the
 * margin, so the stop itself is on the side that plays the transition.
 */
const BRAKE_PAST_SCREENS = 0.18;

/**
 * The most one scroll event moves the page under momentum, in screens. A glide
 * arrives as many small readings; a single reading of a screen or more is the
 * page being put somewhere - a link to a hash, a restored position on the way
 * back - and is never braked, or the reader would be stopped halfway to where
 * they asked to go.
 */
const MAX_GLIDE_READING_SCREENS = 1;

/**
 * How much faster a transition runs when the reader swipes on while it plays,
 * and how much faster the ones on the way are when several are queued. It never
 * skips; it hurries. The last one in a queue is the exception - it plays at its
 * own pace, because it is the one the reader arrives at and actually watches.
 */
// 1.6, down from 2.4: at that a reader who kept swiping saw every moment at
// more than twice its pace, and the whole story ran.
const HURRY = 1.6;

/**
 * The pace at which the playhead catches up with the finger in a scrubbed
 * stretch, per whole transition. The finger takes over as soon as it has.
 */
const SCRUB_CATCH_UP_SECONDS = 0.35;

/** No move is quicker than this, however short: a snap reads as a glitch. */
const MIN_MOVE_SECONDS = 0.12;

/**
 * The whole scroll travel a story needs, in screens. A function of the options
 * alone, so a section can size itself on the server before any playhead exists
 * - and from the same arithmetic the playhead uses.
 */
export function travelScreensFor(options: Pick<StoryOptions, "transitions">) {
  return options.transitions.reduce((total, transition) => total + transition.screens, 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * ONE MOVE, AS A CUBIC CURVE WITH AN EXACT DURATION.
 *
 * It starts at the playhead's current speed and arrives at rest, which is what
 * makes it both predictable and smooth: a transition set to 2.8 seconds takes
 * 2.8 seconds, and a reader changing their mind mid-move starts a new curve
 * from wherever the old one had got to, at the speed it was going - no jerk.
 *
 * It replaced a damped follower that had neither property: its long tail made a
 * 2.8 second transition take more than three, and the speed it built up
 * catching the finger carried straight into the next transition, which is how
 * the paper once opened in a fifth of a second.
 */
interface Move {
  from: number;
  to: number;
  /** The starting slope, in position units over the whole move. */
  tangent: number;
  start: number;
  duration: number;
}

/** Position and velocity (per second) a move has at `now`. */
function sampleMove(move: Move, now: number): [number, number, boolean] {
  const u = clamp((now - move.start) / (move.duration * 1000), 0, 1);
  const u2 = u * u;
  const u3 = u2 * u;
  const { from, to, tangent } = move;
  const position = (2 * u3 - 3 * u2 + 1) * from + (u3 - 2 * u2 + u) * tangent + (-2 * u3 + 3 * u2) * to;
  const slope = (6 * u2 - 6 * u) * from + (3 * u2 - 4 * u + 1) * tangent + (-6 * u2 + 6 * u) * to;
  return [position, slope / move.duration, u >= 1];
}

export class SteppedPlayhead {
  private readonly options: StoryOptions;
  private readonly last: number;
  /** Where each transition's line is, in screens from where the section pins. */
  private readonly starts: number[];
  private readonly total: number;

  /** The playhead, in rest states: 2 is anchors[2], 2.5 is halfway to anchors[3]. */
  private position = 0;
  private velocity = 0;
  private target = 0;
  /** Which played transitions the scroll is past, kept per line for the margin. */
  private readonly passed: boolean[];
  /** Whether the reader has swiped on during the current move. Sticky until it ends. */
  private hurry = false;
  private lastScreens: number | null = null;
  private placed = false;

  private move: Move | null = null;
  private frame: number | null = null;

  constructor(options: StoryOptions) {
    if (options.anchors.length !== options.transitions.length + 1) {
      throw new Error("A story needs exactly one more rest state than transitions.");
    }
    this.options = options;
    this.last = options.transitions.length;
    this.starts = [];
    let at = 0;
    for (const transition of options.transitions) {
      this.starts.push(at);
      at += transition.screens;
    }
    this.total = at;
    this.passed = options.transitions.map(() => false);
  }

  /**
   * The reader's scroll position inside the section, in screens from where it
   * pins, and whether the page is moving under its own momentum rather than a
   * finger. Called on every scroll event; cheap, and only starts the clock when
   * there is somewhere new to go.
   */
  setScroll(screens: number, momentum: boolean) {
    const previous = this.lastScreens;
    let at = screens;

    // A throw stops at the first line it crossed, and the rest of this reading
    // is taken from where it stopped rather than from where it was heading.
    if (
      momentum &&
      previous !== null &&
      this.options.brake &&
      Math.abs(screens - previous) < MAX_GLIDE_READING_SCREENS
    ) {
      const stop = this.brakeStop(previous, screens);
      if (stop !== null) {
        at = stop;
        this.options.brake(stop);
      }
    }

    // Swiping on while a transition plays, in the direction it is playing, is
    // the reader saying "yes, go on": it finishes faster rather than making
    // them wait. Sticky for the rest of the move, so the pace does not flicker
    // between fast and slow with every small scroll event.
    const swipedOn =
      this.move !== null &&
      previous !== null &&
      Math.abs(at - previous) > 0.005 &&
      at > previous === this.move.to > this.move.from;
    this.lastScreens = at;

    // Off the end: the section is letting go of the screen, so it leaves in its
    // final state rather than mid-transition with the page moving under it.
    if (at >= this.total) {
      this.place(this.last);
      return;
    }

    const target = this.targetFor(at);

    // Arriving on the page already inside the section - a reload, a link - is
    // not a transition anyone asked to watch. The first reading is placed, and
    // so is any single reading of a screen or more: that is the page being put
    // somewhere (the menu jumps), and whoever used the menu asked for what is
    // there, not for the moments on the way.
    const jumped = previous !== null && Math.abs(at - previous) >= MAX_GLIDE_READING_SCREENS;
    if (!this.placed || jumped) {
      this.place(target);
      return;
    }

    // Inside a scrubbed stretch, the finger drives it directly - once the
    // playhead is in that stretch and not still on its way from somewhere else.
    const band = Math.min(Math.floor(target), this.last - 1);
    const scrubbing = this.options.transitions[band]?.kind === "scrub";
    if (scrubbing && this.move === null && this.position >= band && this.position <= band + 1) {
      this.place(target);
      return;
    }

    const retarget = target !== this.target;
    this.target = target;
    if (swipedOn && !this.hurry) {
      this.hurry = true;
      this.startMove();
    } else if (retarget || this.move === null) {
      this.startMove();
    }
  }

  /** Stops the clock. The section is going away. */
  dispose() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.move = null;
  }

  /**
   * Where a throw from `from` to `to` should stop, or null if it crossed no
   * played line. The first line it crossed, in the direction it was going.
   *
   * Inclusive at the stop itself, and that matters: the momentum does not end
   * the instant the page is told to stop, and the next reading it produces
   * starts exactly where the last one was stopped. Exclusive, that reading was
   * "not crossing" and the throw sailed on through the line it had just been
   * stopped at; inclusive, the stop is asserted again until the momentum is
   * spent. A finger is never braked, so this cannot hold a reader in place.
   */
  private brakeStop(from: number, to: number): number | null {
    if (to > from) {
      for (let k = 0; k < this.last; k++) {
        if (this.options.transitions[k].kind !== "play") continue;
        const stop = this.starts[k] + BRAKE_PAST_SCREENS;
        if (from <= stop && to > stop) return stop;
      }
    } else if (to < from) {
      for (let k = this.last - 1; k >= 0; k--) {
        if (this.options.transitions[k].kind !== "play") continue;
        const stop = this.starts[k] - BRAKE_PAST_SCREENS;
        if (from >= stop && to < stop) return stop;
      }
    }
    return null;
  }

  /**
   * The rest state, or the point between two, that a scroll position asks for.
   * Continuous across a scrubbed stretch; a whole number across a played one,
   * decided by which side of its line the scroll is on - with the margin, so a
   * line is passed a little beyond it and un-passed a little before it.
   */
  private targetFor(screens: number) {
    let target = 0;
    for (let k = 0; k < this.last; k++) {
      const transition = this.options.transitions[k];
      const line = this.starts[k];
      if (transition.kind === "play") {
        this.passed[k] = this.passed[k] ? screens > line - MARGIN_SCREENS : screens > line + MARGIN_SCREENS;
        if (this.passed[k]) target = k + 1;
      } else if (screens > line) {
        target = Math.max(target, k + clamp((screens - line) / transition.screens, 0, 1));
      }
    }
    return target;
  }

  private place(position: number) {
    this.dispose();
    this.placed = true;
    this.target = position;
    this.position = position;
    this.velocity = 0;
    this.hurry = false;
    this.options.render(this.progressAt(position));
  }

  /**
   * A new move from wherever the playhead is now, at the speed it is going, to
   * the current target. Called when the target changes and when the reader
   * swipes on; a move already under way is picked up mid-curve, not restarted.
   */
  private startMove() {
    const now = performance.now();
    if (this.move) [this.position, this.velocity] = sampleMove(this.move, now);

    const from = this.position;
    const to = this.target;
    const distance = to - from;
    if (Math.abs(distance) < 1e-6) {
      this.move = null;
      this.hurry = false;
      return;
    }
    if (this.velocity === 0 || Math.sign(this.velocity) !== Math.sign(distance)) this.hurry = false;

    const duration = Math.max(MIN_MOVE_SECONDS, this.secondsBetween(from, to));
    // The starting slope is the speed it already has, held within what keeps
    // the curve from overshooting its end: a slope beyond three times the
    // distance bends past the target and back. Against the direction of the
    // move - a change of mind - it may carry on a little the way it was going
    // before it turns, which is what a real thing in motion does.
    let tangent = this.velocity * duration;
    tangent =
      Math.sign(tangent) === Math.sign(distance)
        ? Math.sign(distance) * Math.min(Math.abs(tangent), 3 * Math.abs(distance))
        : clamp(tangent, -Math.abs(distance), Math.abs(distance));

    this.move = { from, to, tangent, start: now, duration };
    if (this.frame === null) this.frame = requestAnimationFrame(this.tick);
  }

  /**
   * How long the way from `from` to `to` takes: each transition crossed at its
   * own pace, in proportion to how much of it is covered. The ones on the way
   * are hurried; the one it ends in plays at its own pace, unless the reader
   * has swiped on, in which case everything hurries.
   */
  private secondsBetween(from: number, to: number) {
    const low = Math.min(from, to);
    const high = Math.max(from, to);
    // The transition the move ends in, in the direction it is going.
    const final = to > from ? Math.ceil(to) - 1 : Math.floor(to);
    let seconds = 0;
    for (let k = Math.max(0, Math.floor(low)); k < Math.min(this.last, Math.ceil(high)); k++) {
      const covered = Math.min(high, k + 1) - Math.max(low, k);
      if (covered <= 0) continue;
      const transition = this.options.transitions[k];
      const pace = transition.kind === "play" ? transition.seconds : SCRUB_CATCH_UP_SECONDS;
      const speed = this.hurry || k !== final ? HURRY : 1;
      seconds += (covered * pace) / speed;
    }
    return seconds;
  }

  private tick = (now: number) => {
    const move = this.move;
    if (!move) {
      this.frame = null;
      return;
    }
    const [position, velocity, done] = sampleMove(move, now);
    this.position = done ? move.to : position;
    this.velocity = done ? 0 : velocity;
    this.options.render(this.progressAt(this.position));
    if (done) {
      this.move = null;
      this.hurry = false;
      this.frame = null;
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  /**
   * Progress for a playhead position, linear between the two rest states it
   * sits between. Linear, not eased: inside a transition the footage should
   * play at the speed it was filmed, and the easing is already in how the
   * playhead moves.
   */
  private progressAt(position: number) {
    const { anchors } = this.options;
    const p = clamp(position, 0, this.last);
    const k = Math.min(Math.floor(p), this.last - 1);
    return anchors[k] + (anchors[k + 1] - anchors[k]) * (p - k);
  }
}
