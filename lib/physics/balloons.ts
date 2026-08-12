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
  released: boolean;
  alive: boolean;
};

export type World = {
  width: number;
  /** Viewport y the balloons come to rest on — the lower of the screen's
      bottom edge and the section's, so they never leave the black. */
  floorY: number;
  /** How fast that floor is itself moving, in px/s. A floor rising into a
      resting balloon has to lift it, not slide through it. */
  floorVelocity: number;
  /** The impact line, in viewport coordinates. Null while it is still arriving
      — a collider measured off a box that is mid-animation moves every frame,
      and that reads as the balloon juddering rather than as a collision. */
  wall: Rect | null;
  wallVelocity: number;
  /** Sideways nudge from scrolling, px/s². */
  sway: number;
};

// Roughly 40% of the pull a solid ball of this size would feel.
const GRAVITY = 760;
// High, and the whole reason these read as light: terminal velocity is
// GRAVITY / DRAG, so they stop accelerating about a third of a second in.
const DRAG = 1.9;
const RESTITUTION = 0.5;
const FLOOR_FRICTION = 2.6;
// Below this, a bounce is not worth having — it becomes a rest instead, which
// is what stops a balloon buzzing against the floor forever.
const REST_SPEED = 30;

// The rock. A spring back to upright with heavy damping, hard-limited, so the
// logo and the face are always the right way up.
const TILT_LIMIT = 12;
const TILT_SPRING = 44;
const TILT_DAMPING = 5.4;
const TILT_PER_IMPACT = 26;

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
    b.vx += world.sway * b.swayPhase * lift * dt;
    b.vx -= b.vx * DRAG * dt;
    b.vy -= b.vy * DRAG * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (world.wall && b.front) hitWall(b, world.wall, world.wallVelocity);
    hitFloor(b, world.floorY, world.floorVelocity, dt);

    // Off the side is gone for good. There are no side walls by design: a
    // balloon knocked sideways off the impact line leaves and does not come
    // back. Nothing culls vertically, because they start above the screen.
    if (b.x + b.r < 0 || b.x - b.r > world.width) b.alive = false;

    b.tiltVelocity += (-TILT_SPRING * b.tilt - TILT_DAMPING * b.tiltVelocity) * dt;
    b.tilt += b.tiltVelocity * dt;
    if (b.tilt > TILT_LIMIT || b.tilt < -TILT_LIMIT) {
      b.tilt = clamp(b.tilt, -TILT_LIMIT, TILT_LIMIT);
      b.tiltVelocity = 0;
    }
  }

  resolveContacts(balloons);
}

function hitFloor(b: Balloon, floorY: number, floorVelocity: number, dt: number) {
  const rest = floorY - b.r;
  if (b.y <= rest) return;

  b.y = rest;
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

function hitWall(b: Balloon, wall: Rect, wallVelocity: number) {
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

      // Equal mass, so the exchange is symmetric.
      const impulse = ((1 + RESTITUTION) * approach) / 2;
      a.vx += impulse * nx;
      a.vy += impulse * ny;
      b.vx -= impulse * nx;
      b.vy -= impulse * ny;
      a.tiltVelocity -= (impulse * nx) / a.r * TILT_PER_IMPACT;
      b.tiltVelocity += (impulse * nx) / b.r * TILT_PER_IMPACT;
    }
  }
}
