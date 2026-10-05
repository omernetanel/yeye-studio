"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { animate, motion, useMotionValue, useSpring, useTransform, useVelocity } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { cn } from "@/lib/utils";
import "./SquishSwitch.css";

/**
 * A switch whose thumb is soft: it lengthens with its own speed as it crosses
 * the track and narrows to keep its area, so a flick reads as something with
 * weight rather than a dot changing sides.
 *
 * A TypeScript port of SquishSwitch from React Bits (THIRD_PARTY_NOTICES.md).
 * What changed on the way in:
 * - Controlled only. The uncontrolled mode, the built-in label and the disabled
 *   state are gone - the one place this is used owns its state and prints its
 *   own words beside it.
 * - The motion library is framer-motion, which the site already ships, rather
 *   than a second copy of the same functions under another name.
 * - Reduced motion is the site's own answer (the system's setting or the
 *   accessibility panel), not the library's.
 * - No colour is written here. The four it needs are props, and the caller
 *   passes the site's tokens.
 *
 * It is a real switch: role="switch" with aria-checked, a tap, a drag past the
 * middle, or Space and Enter from the keyboard. `label` is its accessible name
 * and is required - a switch with no name tells a screen reader nothing.
 */

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const FLOW_SPRING = { stiffness: 320, damping: 40, mass: 0.6 };
const SWELL_SPRING = { stiffness: 520, damping: 34, mass: 0.6 };
// How far the thumb may lengthen, and the speed (px/s) at which it gets there.
const MAX_STRETCH = 0.4;
const STRETCH_SPEED = 600;
// How far a press may wander and still be a tap, in px. A finger is less exact.
const TAP_SLOP = { fine: 4, coarse: 8 };

interface Grip {
  id: number;
  /** Where on the thumb it was taken hold of; null until the first move. */
  grab: number | null;
  moved: boolean;
  startX: number;
  onAtPress: boolean;
  slop: number;
}

interface SquishSwitchProps {
  checked: boolean;
  /** A tap, a drag past the middle, or a key. */
  onChange: (checked: boolean) => void;
  /** The switch's accessible name. */
  label: string;
  /** The track while off, and while on. Any CSS colour - pass a token. */
  trackColor: string;
  trackOnColor: string;
  /** The thumb while off, and while on. */
  thumbColor: string;
  thumbOnColor: string;
  /** Track size in px. The thumb and its inset follow from the height. */
  width?: number;
  height?: number;
  /** Stiffness of the settle spring, 0 to 100. Low is lazy, high is snappy. */
  speed?: number;
  /** How much the thumb lengthens with speed, 0 to 100. */
  stretch?: number;
  /** The thumb swells to this under a mouse. */
  hoverScale?: number;
  /** The colour cross-fade, in ms. */
  colorDuration?: number;
  className?: string;
  id?: string;
}

export default function SquishSwitch({
  checked,
  onChange,
  label,
  trackColor,
  trackOnColor,
  thumbColor,
  thumbOnColor,
  width = 76,
  height = 38,
  speed = 50,
  stretch = 36,
  hoverScale = 1.035,
  colorDuration = 320,
  className,
  id,
}: SquishSwitchProps) {
  const reduce = usePrefersReducedMotion();
  const inset = Math.max(3, Math.round(height * 0.11));
  const thumb = height - inset * 2;
  const min = inset;
  const max = width - inset - thumb;
  const mid = (min + max) / 2;

  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLSpanElement>(null);
  const grip = useRef<Grip | null>(null);
  // The pointer handlers outlive the render they were made in, and a drag can
  // cross the middle more than once before React has rendered the first
  // crossing - so the state they compare against is kept here.
  const onRef = useRef(checked);
  useLayoutEffect(() => {
    onRef.current = checked;
  }, [checked]);
  // A pointer release is followed by a click. The release has already decided;
  // this lets the click that belongs to it pass without deciding again.
  const skipClick = useRef(false);
  const autoId = useId();

  const x = useMotionValue(checked ? max : min);
  const flow = useSpring(useVelocity(x), FLOW_SPRING);
  const swell = useSpring(1, SWELL_SPRING);
  const gain = reduce ? 0 : clamp(stretch, 0, 100) / 100;
  const stretchOf = (velocity: number) => 1 + Math.min(MAX_STRETCH, Math.abs(velocity) / STRETCH_SPEED) * gain;
  const scaleX = useTransform([flow, swell], ([velocity, hover]: number[]) => stretchOf(velocity) * hover);
  const scaleY = useTransform([flow, swell], ([velocity, hover]: number[]) => hover / stretchOf(velocity));

  const commit = (next: boolean) => {
    if (next === onRef.current) return;
    onRef.current = next;
    onChange(next);
  };

  // The thumb settles on its side whenever nobody is holding it.
  useEffect(() => {
    if (dragging) return;
    const target = checked ? max : min;
    if (reduce) {
      x.jump(target);
      return;
    }
    const controls = animate(x, target, {
      type: "spring",
      stiffness: 170 - (50 - clamp(speed, 0, 100)) * 1.1,
      damping: 21.5,
      mass: 0.9,
      restDelta: 0.001,
      restSpeed: 0.01,
    });
    return () => controls.stop();
  }, [checked, dragging, min, max, speed, reduce, x]);

  /** A pointer's place along the track, in the track's own unscaled pixels. */
  const localX = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const scale = rect.width / (track.offsetWidth || rect.width) || 1;
    return (clientX - rect.left) / scale;
  };

  const down = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (grip.current || event.button !== 0) return;
    grip.current = {
      id: event.pointerId,
      grab: null,
      moved: false,
      startX: event.clientX,
      onAtPress: onRef.current,
      slop: event.pointerType === "touch" ? TAP_SLOP.coarse : TAP_SLOP.fine,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const move = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const held = grip.current;
    if (!held || held.id !== event.pointerId) return;
    const at = localX(event.clientX);
    if (held.grab === null) {
      held.grab = at - x.get();
      return;
    }
    if (!held.moved && Math.abs(event.clientX - held.startX) > held.slop) held.moved = true;
    if (!held.moved) return;
    const next = clamp(at - held.grab, min, max);
    x.set(next);
    commit(next > mid);
  };

  const release = (button: HTMLButtonElement, pointerId: number, cancelled: boolean) => {
    const held = grip.current;
    if (!held || held.id !== pointerId) return;
    grip.current = null;
    if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
    // Cancelled: back to where it was when it was taken hold of. A press that
    // never moved is a tap, and a tap toggles.
    if (cancelled) commit(held.onAtPress);
    else if (!held.moved) commit(!onRef.current);
    skipClick.current = true;
    setTimeout(() => {
      skipClick.current = false;
    }, 0);
    setDragging(false);
  };

  // Reached by the keyboard, and by a pointer whose release did not get here.
  const click = () => {
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    commit(!onRef.current);
  };

  return (
    <button
      id={id ?? autoId}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cn("squish-switch", className)}
      data-on={checked ? "" : undefined}
      data-held={dragging ? "" : undefined}
      style={
        {
          "--ss-w": `${width}px`,
          "--ss-h": `${height}px`,
          "--ss-inset": `${inset}px`,
          "--ss-thumb": `${thumb}px`,
          "--ss-track": trackColor,
          "--ss-track-on": trackOnColor,
          "--ss-thumb-color": thumbColor,
          "--ss-thumb-on": thumbOnColor,
          "--ss-fade": `${colorDuration}ms`,
        } as CSSProperties
      }
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={(event) => release(event.currentTarget, event.pointerId, false)}
      onPointerCancel={(event) => release(event.currentTarget, event.pointerId, true)}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") swell.set(hoverScale);
      }}
      onPointerLeave={() => swell.set(1)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && grip.current) release(event.currentTarget, grip.current.id, true);
      }}
      onClick={click}
    >
      <span ref={trackRef} className="squish-switch__track">
        <motion.span className="squish-switch__thumb" aria-hidden="true" style={{ x, scaleX, scaleY }} />
      </span>
    </button>
  );
}
