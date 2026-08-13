/**
 * The balloon simulation. Pure arithmetic — it never touches the DOM, never
 * reads the clock and never asks what the scroll position is. It is handed a
 * world and a timestep and it advances the bodies. Everything that knows about
 * the page lives in the component that drives it.
 *
 * These are FOIL BALLOONS, not balls, and the difference is most of the file:
 * they are light, so air drag reaches terminal velocity almost at once and the
 * fall reads as slow rather than as a drop; they do not roll, they slide and
 * rock; and they never spin, because one of them has a logo printed on it and
 * the other has a face.
 */

export type Rect = { left: number; top: number; right: number; bottom: number };

export type Balloon = {
  /** Centre, in viewport pixels. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Collider radius. The art is round and fills its square, so this is half
      the rendered width. */
  r: number;
  /** Degrees off vertical, and how fast that is changing. */
  tilt: number;
  tiltVelocity: number;
  /** 0 is furthest, 1 is nearest. Scales gravity, so far ones fall slower —
      the channel that actually sells depth, more than size or z-order do. */
  depth: number;
  /** Painted above the copy, and the only ones the impact line can touch: a
      balloon drawn behind the text cannot be seen to bounce off it. */
  front: boolean;
  /** Which of the two images. */
  type: number;
  /** Which way this one leans when the page is scrolled, so they jostle
      against each other rather than all drifting as a block. */
  swayPhase: number;
  /** Whether the world is solid for this one — floor underfoot, walls at the
      sides. Almost none of them are: the rest fall straight through the bottom
      of the black and out of the simulation. A heap of seventeen is a pile of
      props, where two left sitting under the line that just knocked them about
      is the evidence that it happened. */
  contained: boolean;
  released: boolean;
  alive: boolean;
  /** Sitting on the floor as of the last step. A body in contact travels WITH
      the surface it is on, which is the difference between a heap that belongs
      to the section and one that happens to be near the bottom of the screen. */
  resting: boolean;
};

export type World = {
  /** Both the right-hand wall and the culling edge. Nothing leaves: a balloon
      thrown off the impact line bounces back in off the side of the screen and
      keeps whatever is left of its energy in the new direction, so all fifteen
      end up in the heap at the bottom of the black. */
  width: number;
  /** Viewport y the balloons come to rest on: the section's bottom edge, and
      only ever that. The screen's bottom is not a floor — it is the edge of
      what is visible, and a body resting on it would be left standing on a
      void the moment the page scrolled. */
  floorY: number;
  /** How fast that floor is itself moving, in px/s. A floor rising into a
      resting balloon has to lift it, not slide through it. */
  floorVelocity: number;
  /** The impact line, in viewport coordinates: ONE RECT PER LINE OF TEXT, not
      the paragraph's box. The box runs the full width of the column, so most of
      it is empty black to the left of a right-aligned line — and a balloon
      landing out there sits on nothing at all. Two lines of different lengths
      also means a balloon can fall through the gap beside the shorter one,
      which is only true if each is its own collider.

      Null while the line is still arriving: a collider measured off a box that
      is mid-animation moves every frame, and that reads as the balloon
      juddering rather than as a collision. */
  wall: Rect[] | null;
  wallVelocity: number;
  /** Raw scroll velocity in px/s, signed. Not a force — the gains that turn it
      into one live below, because what scrolling does to a balloon depends
      entirely on whether that balloon is resting or still in the air. */
  sway: number;
};

// A quarter of the pull a solid ball of this size would feel. Together with the
// drag below this puts terminal velocity around 210px/s, so a balloon takes
// something over three seconds to cross a laptop screen. At twice that they
// read as painted rocks: the slowness IS the lightness, there is no other cue.
const GRAVITY = 520;
// Terminal velocity is GRAVITY / DRAG. Pulled back from the very light setting
// it started at: these want to read as balls that happen to be balloon-shaped,
// with real weight behind a bounce, not as something drifting down on the air.
const DRAG = 1.9;
const RESTITUTION = 0.72;
const FLOOR_FRICTION = 2;
// Below this, a bounce is not worth having — it becomes a rest instead, which
// is what stops a balloon buzzing against the floor forever. Deliberately low:
// a foil balloon does not land, it touches down and lifts two or three more
// times, each smaller than the last, and that decay is most of what sells it.
const REST_SPEED = 12;

// The rock. A spring back to upright with heavy damping, hard-limited, so the
// logo and the face are always the right way up.
const TILT_LIMIT = 12;
const TILT_SPRING = 44;
const TILT_DAMPING = 5.4;
const TILT_PER_IMPACT = 26;

// How many times the heap is relaxed per step. Three is enough for fifteen
// bodies and cheap; one is visibly not enough.
const RELAXATION_PASSES = 3;

// What scrolling does to the heap. This is a SHAKE, not a shove: the jolt is
// mostly upward, so a resting balloon hops in place and drifts a little as it
// comes down, and only balloons that are actually touching the floor feel it.
//
// It used to be a steady sideways acceleration applied to everything, which
// meant that scrolling slid the whole row across the screen for as long as the
// wheel turned. Nothing light behaves that way — you cannot push a balloon
// along the ground by walking past it.
const HOP_PER_SCROLL = 0.85;
const DRIFT_PER_SCROLL = 0.22;
// Below this the page is drifting to a stop under Lenis, not being scrolled,
// and the heap should be still.
const SCROLL_DEADZONE = 45;
// Distance from the floor still counted as resting on it.
const CONTACT_SLOP = 2;

// Sideways acceleration applied to anything sitting on the impact line, aimed
// at whichever end is nearer. The line is a shelf a balloon can land flat on,
// and the closing panel holds it still for over a screen of scroll, so without
// this they park on it. Deliberately weak: it should walk a balloon off the end
// over several bounces, not sweep it off on the first contact. The bouncing is
// the point of the line — the shed is only there so the bouncing ends.
const WALL_SHED = 85;


// Depth's effect on the fall. Not applied to drag as well: scaling both leaves
// terminal velocity unchanged, and terminal velocity is the thing the eye
// reads as distance.
function pull(depth: number) {
  return 0.58 + 0.42 * depth;
}

function clamp(value: number, low: number, high: number) {
  return Math.min(high, Math.max(low, value));
}

/** Advance the world by one fixed timestep. */
export function stepBalloons(balloons: Balloon[], dt: number, world: World) {
  for (const b of balloons) {
    if (!b.released || !b.alive) continue;

    const lift = pull(b.depth);
    b.vy += GRAVITY * lift * dt;

    // The shake, and only for the ones on the ground. A balloon still falling
    // is not touching anything the page can transmit through.
    const shake = Math.abs(world.sway) > SCROLL_DEADZONE ? world.sway : 0;
    if (shake !== 0 && b.y >= world.floorY - b.r - CONTACT_SLOP) {
      b.vy -= HOP_PER_SCROLL * Math.abs(shake) * lift * dt;
      b.vx += DRIFT_PER_SCROLL * shake * b.swayPhase * lift * dt;
    }

    b.vx -= b.vx * DRAG * dt;
    b.vy -= b.vy * DRAG * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (world.wall && b.front) {
      for (const rect of world.wall) hitWall(b, rect, world.wallVelocity, dt);
    }
    if (b.contained) {
      hitFloor(b, world.floorY, world.floorVelocity, dt);
      hitSides(b, world.width);
    } else if (b.y - b.r > world.floorY) {
      // Through the bottom of the black and gone. Nothing is faded out: the
      // layer is clipped to the section, so the last of it is hidden by the
      // edge it falls past rather than dissolving in mid-air.
      b.alive = false;
    }

    b.tiltVelocity += (-TILT_SPRING * b.tilt - TILT_DAMPING * b.tiltVelocity) * dt;
    b.tilt += b.tiltVelocity * dt;
    if (b.tilt > TILT_LIMIT || b.tilt < -TILT_LIMIT) {
      b.tilt = clamp(b.tilt, -TILT_LIMIT, TILT_LIMIT);
      b.tiltVelocity = 0;
    }
  }

  // Several passes, not one. A single pass separates each pair in isolation and
  // immediately pushes half of them back into their other neighbour, which in a
  // heap this size never converges — the pile shivers instead of settling.
  for (let pass = 0; pass < RELAXATION_PASSES; pass += 1) resolveContacts(balloons);
}

function hitSides(b: Balloon, width: number) {
  if (b.x - b.r < 0) {
    b.x = b.r;
    if (b.vx < 0) {
      b.vx = -b.vx * (Math.abs(b.vx) > REST_SPEED ? RESTITUTION : 0);
      b.tiltVelocity -= TILT_PER_IMPACT;
    }
  } else if (b.x + b.r > width) {
    b.x = width - b.r;
    if (b.vx > 0) {
      b.vx = -b.vx * (b.vx > REST_SPEED ? RESTITUTION : 0);
      b.tiltVelocity += TILT_PER_IMPACT;
    }
  }
}

function hitFloor(b: Balloon, floorY: number, floorVelocity: number, dt: number) {
  const rest = floorY - b.r;

  // The floor is the section's bottom edge, so scrolling moves it. When it
  // drops away — scrolling back up the page — a balloon already sitting on it
  // is carried down with it rather than left hanging while gravity slowly
  // catches up. Without this the heap detaches on the way back up and appears
  // to stay pinned to the bottom of the screen while the section slides out
  // from under it.
  if (b.resting && b.y < rest && floorVelocity > 0) {
    b.y = Math.min(rest, b.y + floorVelocity * dt);
  }

  if (b.y <= rest) {
    b.resting = b.y > rest - CONTACT_SLOP;
    return;
  }

  b.y = rest;
  b.resting = true;
  // Measured against the floor rather than against the page. When the section's
  // bottom edge rises into a balloon that is already at rest, the balloon is
  // not moving but the floor is, and it is that difference that throws it.
  const approach = b.vy - floorVelocity;
  if (approach > REST_SPEED) {
    b.vy = floorVelocity - approach * RESTITUTION;
    b.tiltVelocity += (b.vx / b.r) * TILT_PER_IMPACT;
  } else {
    b.vy = floorVelocity;
  }
  b.vx -= b.vx * FLOOR_FRICTION * dt;
}

function hitWall(b: Balloon, wall: Rect, wallVelocity: number, dt: number) {
  // Nearest point on the line's box to the balloon's centre. Where that point
  // is decides everything the brief asked for without any of it being special
  // cased: land on the top face and the normal points up, so it bounces; catch
  // the end of the line and the normal points sideways, so it is thrown off.
  const nearX = clamp(b.x, wall.left, wall.right);
  const nearY = clamp(b.y, wall.top, wall.bottom);
  let dx = b.x - nearX;
  let dy = b.y - nearY;
  let distance = Math.hypot(dx, dy);
  if (distance >= b.r) return;

  // Dead centre: no direction to separate along, so pick up.
  if (distance === 0) {
    dx = 0;
    dy = -1;
    distance = 1;
  }
  const nx = dx / distance;
  const ny = dy / distance;

  b.x = nearX + nx * b.r;
  b.y = nearY + ny * b.r;

  // Nothing settles on the line. Landing square on the top face leaves a
  // balloon with nowhere to go, and because the closing panel is pinned for
  // over a screen of scroll it then sits there in mid-air for a long time —
  // three of them in a row, parked on a shelf that is not drawn. A steady push
  // out towards the nearer end walks it off within a second or so, which is
  // also what a real balloon does on a surface that thin.
  // Weighted by how square-on the contact is: full push when sitting on the top
  // face, none at all on a side hit, which is already leaving.
  const middle = (wall.left + wall.right) / 2;
  b.vx += (b.x < middle ? -WALL_SHED : WALL_SHED) * Math.abs(ny) * dt;

  const approach = b.vx * nx + (b.vy - wallVelocity) * ny;
  if (approach >= 0) return;

  const impulse = (1 + RESTITUTION) * approach;
  b.vx -= impulse * nx;
  b.vy -= impulse * ny;
  b.tiltVelocity += (-impulse * ny * nx) / b.r * TILT_PER_IMPACT;
}

function resolveContacts(balloons: Balloon[]) {
  for (let i = 0; i < balloons.length; i += 1) {
    const a = balloons[i];
    if (!a.released || !a.alive) continue;

    for (let j = i + 1; j < balloons.length; j += 1) {
      const b = balloons[j];
      if (!b.released || !b.alive) continue;
      // Only within a depth band. Two balloons drawn at different distances
      // that collide because they cross on screen would look like a mistake.
      if (Math.abs(a.depth - b.depth) > 0.25) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const overlap = a.r + b.r - Math.hypot(dx, dy);
      if (overlap <= 0) continue;

      const distance = Math.hypot(dx, dy) || 1;
      const nx = dx / distance;
      const ny = dy / distance;

      const push = overlap / 2;
      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;

      const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (approach >= 0) continue;

      // Equal mass, so the exchange is symmetric. A slow contact is settled
      // dead rather than bounced: two balloons resting against each other in a
      // heap must stop trading the last of the energy back and forth.
      const bounce = -approach > REST_SPEED ? RESTITUTION : 0;
      const impulse = ((1 + bounce) * approach) / 2;
      a.vx += impulse * nx;
      a.vy += impulse * ny;
      b.vx -= impulse * nx;
      b.vy -= impulse * ny;
      a.tiltVelocity -= (impulse * nx) / a.r * TILT_PER_IMPACT;
      b.tiltVelocity += (impulse * nx) / b.r * TILT_PER_IMPACT;
    }
  }
}
