"use client";

import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsMobile } from "@/lib/use-mobile";

const VIDEO_SRC = "/videos/hearmeoutbgvid.mp4";
const ROOM_SRC = "/images/bghearmeout.png";

// The showroom plate, and the screen cut-out measured out of its own alpha
// channel rather than eyeballed: a solid transparent rectangle at
// x 2235..4472, y 1248..2400. Everything below is expressed in this image's
// own pixel space, which is what lets the whole scene move as one rigid
// composition — the video is pinned to this rect and never animated
// separately, so scrolling only ever changes one scale and one offset.
const ROOM_W = 6688;
const ROOM_H = 3764;
const SCREEN_X = 2235;
const SCREEN_Y = 1248;
const SCREEN_W = 2237;
const SCREEN_H = 1152;

const SCREEN_CX = SCREEN_X + SCREEN_W / 2;
const SCREEN_CY = SCREEN_Y + SCREEN_H / 2;

// The clip is never reframed to suit the plate. The plate is a placeholder and
// its cut-out happens to be 1.94:1, so the clip keeps its true 16:9 and is
// fitted inside that cut-out by height and centred; the leftover strip on
// either side simply becomes more black bezel. Nothing is cropped at any zoom
// level. When the plate is replaced with one whose screen is a real 16:9,
// these numbers collapse to the cut-out itself with no side strip left.
const VIDEO_H = SCREEN_H;
const VIDEO_W = SCREEN_H * (16 / 9);

// Plasma-style bezel, in the same image space, so it scales with everything
// else instead of staying a fixed number of screen pixels.
const BEZEL = 26;

// Scroll length of the pinned run, on top of the section's own first screen.
const PIN_VH = 220;

// A beat after the pull-back finishes where the panel is still pinned but
// nothing moves, so the finished room gets to sit still before the page
// carries on into the process section instead of the zoom running straight
// out of the pin. Roughly two notches of a mouse wheel.
const HOLD_VH = 35;

// The floating logo's fixed spot. The clip is the only dark thing in this
// section, and it shrinks away from the corner as the zoom pulls back, so the
// logo has to flip from light to dark partway through — mirrored from
// Navbar's own LOGO_CENTER_Y_PX.
const LOGO_X_PX = 66;
const LOGO_Y_PX = 40;

// Where in the pinned range the zoom is finished. Past this the mapping below
// clamps, which is what makes the tail a genuine hold rather than a slower
// continuation of the move.
const ZOOM_END = PIN_VH / (PIN_VH + HOLD_VH);

// The contact block clears out over the first slice of the pin, and the zoom
// only starts once it has: pulling the scene back while the form is still
// legible reads as two things happening at once rather than one.
const FORM_FADE_END = 0.34;
const ZOOM_START = 0.38;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  const t = clamp01((value - inMin) / (inMax - inMin));
  return outMin + t * (outMax - outMin);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(t: number) {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

// Input is styled for light sections — black text on a near-white fill — which
// is invisible sitting on the footage. Overridden here rather than in the
// shared component so nothing else on the site shifts.
const DARK_INPUT =
  "border-white/25 bg-white/10 text-white placeholder:text-white/55 backdrop-blur-sm focus:border-white";

function ContactForm() {
  const [form, setForm] = useState({ from_name: "", phone: "", reply_to: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.from_name || !form.reply_to) return;

    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_name: form.from_name,
          reply_to: form.reply_to,
          project_type: "לא צוין",
          business_description: form.phone
            ? `פנייה מהירה מהעמוד הראשי. טלפון ליצירת קשר: ${form.phone}`
            : "פנייה מהירה מהעמוד הראשי",
        }),
      });
      if (!response.ok) throw new Error("contact request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  // No card or panel — the footage is the backdrop, so the block sits straight
  // on it and leans on light type for contrast.
  return (
    <div className="mx-auto w-full max-w-[720px] px-6 text-center">
      <h3 className="font-display text-3xl leading-snug font-bold text-white md:text-[38px]">
        לא חייבים לדעת בדיוק מה רוצים כדי להתחיל.
      </h3>
      <p className="mt-4 font-body text-[16px] leading-[1.7] text-white/70">
        תשאירו כמה פרטים ואחזור אליכם תוך יום עסקים אחד. בלי מכירות, בלי התחייבות.
      </p>

      {status === "success" ? (
        <p className="mt-8 font-body text-[16px] text-white/70">קיבלתי, תודה! אחזור אליך בהקדם.</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            type="text"
            placeholder="שם מלא"
            className={DARK_INPUT}
            value={form.from_name}
            onChange={(e) => setForm({ ...form, from_name: e.target.value })}
            required
          />
          <Input type="tel" placeholder="טלפון" className={DARK_INPUT} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input
            type="email"
            placeholder="דוא״ל"
            className={DARK_INPUT}
            value={form.reply_to}
            onChange={(e) => setForm({ ...form, reply_to: e.target.value })}
            required
          />
          <Button
            type="submit"
            disabled={status === "sending"}
            showArrow={false}
            className="!border-white !bg-none !bg-white !text-black !shadow-none justify-center !py-3"
          >
            {status === "sending" ? "שולח..." : "בואו נדבר"}
          </Button>
        </form>
      )}
    </div>
  );
}

function StageVideo() {
  return (
    <video
      aria-hidden="true"
      tabIndex={-1}
      muted
      playsInline
      loop
      autoPlay
      preload="auto"
      disablePictureInPicture
      // Its box is built at the clip's own 16:9, so nothing is ever cropped
      // or letterboxed here — the frame is shown whole at every zoom level.
      className="h-full w-full object-cover"
    >
      <source src={VIDEO_SRC} type="video/mp4" />
    </video>
  );
}

/**
 * The contact stage between the paper-ball section and the process section.
 *
 * The whole thing is one composition in the room image's pixel space: the
 * showroom plate, and the clip locked into the screen cut-out on top of it.
 * Scroll never moves those two relative to each other — it only drives a
 * single scale and offset applied to the pair, so the effect is a genuine
 * zoom out of a scene that was always assembled that way, not two elements
 * animating toward each other.
 *
 * At the start the scale is whatever makes the screen exactly fill the
 * viewport's width, with its top edge at the top of the panel, so the clip
 * simply reads as the section's backdrop with the contact block on it. The
 * clip plays on its own clock throughout — NOT scrubbed by scroll, unlike the
 * paper sequence. At the end the scale is whatever makes the whole plate fit
 * the viewport. Everything between is interpolated, anchored on the screen's
 * own centre so the zoom pulls back from the footage rather than drifting.
 *
 * Pinned with a sticky panel plus arithmetic on the raw scrollY — the same
 * approach the services and process panels use, since ScrollTrigger's easing
 * compounds badly with the site's Lenis smooth scroll.
 */
export default function ContactStage() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const skipPin = prefersReducedMotion || isMobile;

  const wrapperRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const pinStartScrollYRef = useRef(0);
  const pinEndScrollYRef = useRef(0);

  const { scrollY } = useScroll();

  const update = () => {
    const stage = stageRef.current;
    const form = formRef.current;
    if (!stage || !form) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const progress = clamp01(mapRange(scrollY.get(), pinStartScrollYRef.current, pinEndScrollYRef.current, 0, 1));

    const fadeT = smoothstep(mapRange(progress, 0, FORM_FADE_END, 0, 1));
    form.style.opacity = String(1 - fadeT);
    // Opacity alone would leave the faded block still catching clicks over the
    // footage behind it.
    form.style.pointerEvents = fadeT > 0.5 ? "none" : "auto";

    // Start: the screen cut-out spans the full viewport width.
    // End: the plate covers the viewport — max, not min, so it bleeds off
    // whichever axis it has to rather than ever showing a white margin.
    const scaleStart = vw / VIDEO_W;
    const scaleEnd = Math.max(vw / ROOM_W, vh / ROOM_H);
    const zoomT = smoothstep(mapRange(progress, ZOOM_START, ZOOM_END, 0, 1));
    const scale = lerp(scaleStart, scaleEnd, zoomT);

    // Where the screen's centre sits on screen at each end. Interpolating the
    // focal point (rather than the plate's corner) is what anchors the zoom to
    // the footage instead of letting the scene slide while it shrinks.
    const focalStartX = vw / 2;
    const focalStartY = (VIDEO_H * scaleStart) / 2;
    const focalEndX = (vw - ROOM_W * scaleEnd) / 2 + SCREEN_CX * scaleEnd;
    const focalEndY = (vh - ROOM_H * scaleEnd) / 2 + SCREEN_CY * scaleEnd;

    const focalX = lerp(focalStartX, focalEndX, zoomT);
    const focalY = lerp(focalStartY, focalEndY, zoomT);

    stage.style.transform = `translate(${focalX - SCREEN_CX * scale}px, ${focalY - SCREEN_CY * scale}px) scale(${scale})`;

    // The clip is centred on the focal point, so its on-screen box falls out
    // of the same two numbers. Report dark only while it actually sits under
    // the logo — the room behind it is white, so once the clip has pulled away
    // from the corner the logo has to go back to its dark-on-light form.
    const halfW = (VIDEO_W * scale) / 2;
    const halfH = (VIDEO_H * scale) / 2;
    const overClip =
      LOGO_X_PX >= focalX - halfW &&
      LOGO_X_PX <= focalX + halfW &&
      LOGO_Y_PX >= focalY - halfH &&
      LOGO_Y_PX <= focalY + halfH;
    wrapperRef.current?.setAttribute("data-nav-dark", overClip ? "true" : "false");
  };

  const measurePinRange = () => {
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;
    if (!wrapper || !panel) return;
    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    pinStartScrollYRef.current = wrapperTop;
    pinEndScrollYRef.current = wrapperTop + wrapper.offsetHeight - panel.offsetHeight;
  };

  useLayoutEffect(() => {
    if (skipPin) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    measurePinRange();
    update();

    const handleResize = () => {
      measurePinRange();
      update();
    };
    window.addEventListener("resize", handleResize);
    const ro = new ResizeObserver(handleResize);
    ro.observe(wrapper);

    return () => {
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipPin]);

  useMotionValueEvent(scrollY, "change", () => {
    if (!skipPin) update();
  });

  // Mobile and reduced motion: no pin and no zoom — the clip is just a
  // backdrop with the contact block on it.
  if (skipPin) {
    return (
      <section id="contact" className="relative overflow-hidden bg-black">
        <div className="relative w-full" style={{ aspectRatio: `${SCREEN_W} / ${SCREEN_H}` }}>
          <StageVideo />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <ContactForm />
        </div>
      </section>
    );
  }

  return (
    <section
      ref={wrapperRef}
      id="contact"
      className="relative bg-white"
      style={{ height: `calc(100vh + ${PIN_VH + HOLD_VH}vh)` }}
    >
      <div ref={panelRef} className="sticky top-0 h-screen w-full overflow-hidden bg-white">
        {/* One rigid scene in the plate's own pixel space. Only this element's
            transform ever changes; nothing inside it moves independently. */}
        <div
          ref={stageRef}
          className="absolute top-0 left-0 origin-top-left will-change-transform"
          style={{ width: ROOM_W, height: ROOM_H }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ROOM_SRC}
            alt=""
            aria-hidden="true"
            width={ROOM_W}
            height={ROOM_H}
            // Never faded: at the opening scale the plate is already far
            // outside the viewport on every side, so it arrives simply by
            // being zoomed back into frame — which is the whole point.
            className="absolute inset-0 h-full w-full"
            draggable={false}
          />

          {/* The screen: bezel drawn outward from the cut-out so the black
              frame lands on the plate's own edge rather than eating into the
              picture. The clip sits ON the plate, not behind it. */}
          <div
            className="absolute"
            style={{
              left: SCREEN_X - BEZEL,
              top: SCREEN_Y - BEZEL,
              width: SCREEN_W + BEZEL * 2,
              height: SCREEN_H + BEZEL * 2,
              background: "#000",
              padding: BEZEL,
              boxSizing: "border-box",
            }}
          >
            <div
              className="absolute top-1/2 left-1/2 overflow-hidden"
              style={{ width: VIDEO_W, height: VIDEO_H, transform: "translate(-50%, -50%)" }}
            >
              <StageVideo />
            </div>
          </div>
        </div>

        <div ref={formRef} className="absolute inset-0 z-10 flex items-center justify-center">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
