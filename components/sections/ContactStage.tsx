"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import Link from "next/link";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { Pause, Play } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SquishSwitch from "@/components/ui/SquishSwitch";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsMobile } from "@/lib/use-mobile";
import { cn } from "@/lib/utils";
import BalloonDrop, { type DropState } from "@/components/sections/about/BalloonDrop";

// THE CLIP, WITH ITS SOUND. Thirty seconds at 1280x720 with a stereo track,
// re-encoded from a 30MB master that stays out of git (crf 27, AAC at 128k:
// 4.3MB). `v1` is in the name because /videos is served immutable for a year -
// a re-export takes a new name, see next.config.ts.
//
// It starts muted, as any clip that plays by itself must, and the switch beside
// it turns the sound on from wherever the clip has got to. Nothing about that
// is remembered: a reload starts silent again. It loops always, with or without
// sound.
const VIDEO_SRC = "/videos/open-space-v1.mp4";
// The clip's own frame at half a second, for the one place it stands still
// before it is played: the reduced-motion stage.
const VIDEO_POSTER = "/images/open-space-poster.webp";
// The clip is a dark interior, and so is the room around it.
const VIDEO_IS_DARK = true;
const ROOM_IS_DARK = true;

// Where the volume pill stands in all three layouts: centred, at the head of
// the picture it belongs to.
const VOLUME_AT_HEAD = "absolute top-3 left-1/2 -translate-x-1/2";

// How long the sound takes to come up or go down.
const SOUND_FADE_MS = 600;

/**
 * Brings the clip's sound up, or takes it down, over SOUND_FADE_MS.
 *
 * Silence is `muted`, not a volume of zero: the clip is muted when the ramp
 * down ends and unmuted before the ramp up begins. That is what makes it work
 * on an iPhone, where the volume of a video cannot be set from a page at all -
 * there the ramp does nothing and the sound simply goes or comes at its end.
 */
function fadeSound(video: HTMLVideoElement, audible: boolean, timer: { current: number | null }) {
  if (timer.current !== null) window.clearInterval(timer.current);
  if (audible && video.muted) {
    video.volume = 0;
    video.muted = false;
  }
  const from = video.volume;
  const to = audible ? 1 : 0;
  const start = performance.now();
  // A timer, not animation frames: frames stop when the page is not being
  // drawn, and a ramp down that never finishes is a clip that never goes quiet.
  timer.current = window.setInterval(() => {
    const t = clamp01((performance.now() - start) / SOUND_FADE_MS);
    // Clamped, and not for tidiness: a volume a hair outside 0..1 is not
    // rounded by the browser, it throws - and it did, at 1.001.
    video.volume = clamp01(from + (to - from) * t);
    if (t < 1) return;
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
    if (!audible) video.muted = true;
  }, 16);
}
// The room: a dark office front with a wall-mounted screen, and the screen is a
// hole in the picture.
const ROOM_SRC = "/images/open_space_bg.webp";

// How far ahead of the stage the clip starts downloading, as a share of the
// viewport. Generous on purpose: the clip is full-screen from the very first
// frame of the pin, so it has to be decodable by the time the section arrives,
// not merely requested.
const VIDEO_PRELOAD_MARGIN = "200% 0px";

// The plate at its own size, and the screen cut-out measured out of its alpha
// channel rather than eyeballed: transparent from x 1056 to 1793 and y 519 to
// 962 (the half-alpha edge; inside it a faint black shadow fades out over
// about 60px, at most 7% - the plate's own inner shadow on the screen).
// Everything below is expressed in this image's own pixel space, which is what
// lets the whole scene move as one rigid composition — the video is pinned to
// this rect and never animated separately, so scrolling only ever changes one
// scale and one offset.
const ROOM_W = 2848;
const ROOM_H = 1600;

/**
 * Where the plate lands once the zoom is done: covering the viewport, centred
 * on it. Max rather than min, so it bleeds off whichever axis it has to rather
 * than ever showing a white margin — which means on any screen wider than the
 * plate's own 16:9 it ends up taller than the viewport, cropped equally above
 * and below.
 *
 * Both the pinned panel and the tail below the section read the resting
 * geometry from here. That is the whole reason it is a function: the tail is
 * the same picture continuing, and a seam between two boxes that computed their
 * own scale would drift the moment either side was touched.
 */
function roomAtRest(vw: number, vh: number) {
  const scale = Math.max(vw / ROOM_W, vh / ROOM_H);
  return { scale, left: (vw - ROOM_W * scale) / 2, top: (vh - ROOM_H * scale) / 2 };
}
const SCREEN_X = 1056;
const SCREEN_Y = 519;
const SCREEN_W = 738;
const SCREEN_H = 444;

const SCREEN_CX = SCREEN_X + SCREEN_W / 2;
const SCREEN_CY = SCREEN_Y + SCREEN_H / 2;

// THE CLIP LIES UNDER THE PLATE, a little larger than the hole it shows
// through. The plate has its own television frame and its own shadow on the
// screen's edge, so nothing is drawn around the clip any more - it is simply
// behind the picture, and the picture's edge is the edge. The margin is what
// keeps a hairline of the page from showing where the two are resampled.
const SCREEN_BLEED = 4;

// The phone's framing of the plate: a SQUARE window on the middle of it,
// centred on the screen. At the plate's full height the screen came out 172px
// across on a phone — the thing this section is about, smaller than a
// thumbnail — so the window is closer than that: what goes is the glass doors
// at either end and a band of ceiling and desk, and the screen is a good half
// of the frame's width.
//
// The plate is scaled by height, so its width comes out at the room's own
// aspect ratio against the square, times how close the window is.
const MOBILE_CLOSE = 1.4;
const MOBILE_PLATE_WIDTH_PCT = (ROOM_W / ROOM_H) * 100 * MOBILE_CLOSE;

// The clip fills the cut-out. The hole is 1.66:1 against the clip's 16:9, so
// filling it costs about 3% off each side of the frame — the alternative was a
// strip of bare wall above and below the picture.
const VIDEO_H = SCREEN_H;
const VIDEO_W = SCREEN_W;

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
// The form held fully legible before it starts fading at all — it was
// dissolving from the instant the panel pinned, which gave it no moment.
const FORM_HOLD = 0.20;
const FORM_FADE_END = 0.46;
const ZOOM_START = 0.50;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  // A degenerate range divides by zero, and 0/0 is NaN, which then spreads into
  // every value derived from it. Not hypothetical: update() runs once on mount
  // BEFORE the pin range has been measured, so both ends are still 0. See the
  // same guard in ServicesSection, where an unguarded NaN reached
  // video.currentTime and threw.
  if (inMax === inMin) return outMin;
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
  "border-white/25 bg-white/10 text-white placeholder:text-white/70 backdrop-blur-sm focus:border-white";

function ContactForm() {
  // `website` is the honeypot — see the field itself below.
  const [form, setForm] = useState({ from_name: "", phone: "", reply_to: "", website: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    // A second press while the first is in flight would send the same enquiry
    // twice; the button is disabled, but a keyboard submit does not go through
    // the button at all.
    if (status === "sending") return;
    if (!form.from_name || !form.reply_to) return;

    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_name: form.from_name,
          reply_to: form.reply_to,
          phone: form.phone,
          website: form.website,
          source: "contact",
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
      <h3 className="font-display text-m-title font-bold text-white md:text-[38px] md:leading-snug">
        לא חייבים לדעת בדיוק מה רוצים כדי להתחיל.
      </h3>
      <p className="mt-4 font-body text-m-body text-white/70">
        תשאירו כמה פרטים ובדרך כלל אחזור אליכם בתוך יום עסקים אחד. בלי מכירות, בלי התחייבות.
      </p>

      {/* Announced, not just swapped: the form is replaced by this line, and a
          screen reader would otherwise be told nothing at all about a send that
          worked. Same for the failure below. */}
      {status === "success" ? (
        // The same heading-and-line as the closing form's, on the footage.
        <div role="status" className="mt-8">
          <p className="font-display text-m-sub font-bold text-white md:text-[22px]">
            קיבלתי, תודה!
          </p>
          <p className="mt-1 font-body text-m-body text-white/85">אחזור אליכם בקרוב מאוד.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="שם מלא"
            id="contact-stage-name"
            type="text"
            placeholder="שם מלא"
            autoComplete="name"
            className={DARK_INPUT}
            value={form.from_name}
            onChange={(e) => setForm({ ...form, from_name: e.target.value })}
            required
          />
          <Input
            label="טלפון"
            id="contact-stage-phone"
            type="tel"
            placeholder="טלפון / וואטסאפ (לא חובה, אבל מומלץ)"
            autoComplete="tel"
            inputMode="tel"
            className={`${DARK_INPUT} text-right`}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="דוא״ל"
            id="contact-stage-email"
            type="email"
            placeholder="דוא״ל"
            autoComplete="email"
            inputMode="email"
            className={DARK_INPUT}
            value={form.reply_to}
            onChange={(e) => setForm({ ...form, reply_to: e.target.value })}
            required
          />

          {/* THE TRAP. Off-screen rather than display:none — a bot that skips
              hidden fields is not the one this catches; one that fills every
              input on the page is, and the server drops anything that arrives
              with this set. Never focused and never read aloud. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="pointer-events-none absolute -left-[9999px] h-px w-px opacity-0"
          />
          <Button
            type="submit"
            disabled={status === "sending"}
            showArrow={false}
            // justify-self-center: this is a grid item, so left alone it
            // stretches to the full width of its column and comes out as wide
            // as the three fields above it. It is one button, not a fourth
            // field. mt-4 on the phone: in one column the grid's 12px gap put
            // it right against the last field, and it read as a fifth input.
            className="!border-white !bg-none !bg-white !text-black !shadow-none mt-4 w-auto justify-center justify-self-center !px-12 !py-3 sm:mt-0"
          >
            {status === "sending" ? "שולח..." : "בואו נדבר"}
          </Button>

          {/* A send that failed said nothing at all here until now: the form
              simply sat there. role="alert" so it is read the moment it
              appears, and a way out that does not depend on the form. */}
          {status === "error" && (
            <p role="alert" className="font-body text-m-small text-white/75 sm:col-span-2">
              משהו השתבש בשליחה. אפשר לנסות שוב, או לכתוב לי בוואטסאפ.
            </p>
          )}

          {/* The same line as the closing form — see there.
              The "ב" before the link sits against the tag with no line break
              between them: a newline in JSX becomes a space, and the prefix
              would come out detached from the word it belongs to. */}
          <p className="font-body text-[13px] leading-[1.7] text-white/70 sm:col-span-2">
            מסירת הפרטים היא מרצון. הם ישמשו למענה לפנייה ויעובדו גם אצל ספקי השירות המסייעים
            בהפעלת האתר ובמסירת הפנייה. ללא שם וכתובת דוא״ל לא אוכל לחזור אליכם. מידע נוסף על עיבוד
            המידע וזכויותיכם מופיע ב<Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-white"
            >
              מדיניות הפרטיות
            </Link>
            .
          </p>
        </form>
      )}
    </div>
  );
}

function StageVideo({
  src,
  videoRef,
  still = false,
}: {
  src?: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Stand on the poster until it is played by hand, instead of playing on arrival. */
  still?: boolean;
}) {
  return (
    <video
      ref={videoRef}
      // Held back until the stage is close (see VIDEO_PRELOAD_MARGIN). This is
      // the heaviest asset on the site by a wide margin and it lives at the far
      // end of a very long page, so loading it up front made every visitor who
      // never got here pay for it in full. Setting the attribute later runs the
      // media load algorithm, so it still autoplays on arrival.
      src={src}
      poster={still ? VIDEO_POSTER : undefined}
      aria-hidden="true"
      tabIndex={-1}
      // Always written muted: it is what lets the clip start by itself, and
      // the sound is turned on from the element (see fadeSound), not from here.
      muted
      playsInline
      loop
      autoPlay={!still}
      preload={still ? "metadata" : "auto"}
      disablePictureInPicture
      // Its box is built at the clip's own 16:9, so nothing is ever cropped
      // or letterboxed here — the frame is shown whole at every zoom level.
      className="h-full w-full object-cover"
    />
  );
}

/**
 * The sound: one black pill with the word and the switch in it, centred at the
 * head of the picture.
 *
 * It was a taller block with "שקט" and "קול" either side of the switch, in a
 * corner. The pill is the reference the studio chose: a label, a switch, and
 * nothing to read twice. The word is for the eye; a screen reader gets the
 * switch itself, named, with its state.
 *
 * Solid black, so it reads over the clip, the room and the page alike.
 */
function VolumeControl({
  on,
  onChange,
  className,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Mostly see-through: it stands on the picture and should not cover it.
        // The blur behind it is what keeps the word legible over a bright frame.
        "flex items-center gap-2 rounded-full bg-black/35 py-1 ps-3.5 pe-1.5 ring-1 ring-white/15 backdrop-blur-md select-none",
        className,
      )}
    >
      <span aria-hidden="true" className="font-display text-[12px] font-bold text-white">
        ווליום
      </span>
      <SquishSwitch
        checked={on}
        onChange={onChange}
        label="ווליום הסרטון"
        trackColor="var(--color-primary)"
        trackOnColor="var(--color-white)"
        thumbColor="var(--color-white)"
        thumbOnColor="var(--color-black)"
        width={34}
        height={18}
      />
      {/* Which way it is, in a word, for anyone a dot in a pill does not tell.
          A fixed width, so the pill does not change size when it changes. */}
      <span aria-hidden="true" className="w-[27px] text-start font-display text-[11px] font-medium text-white/70">
        {on ? "פעיל" : "כבוי"}
      </span>
    </div>
  );
}

/**
 * The room, framed rather than filled, with the clip behind its cut-out: a
 * SQUARE window on the middle of the plate, centred on the screen (see
 * MOBILE_CLOSE for how close). The composition the zoom ends on, for the two
 * places the zoom does not run - a phone, and a reader who asked for less
 * motion.
 *
 * Positioned by the same four numbers the desktop zoom uses, expressed as
 * fractions of the plate: nothing here is measured by eye, and moving the
 * cut-out moves both.
 */
function FramedRoom({ children }: { children: ReactNode }) {
  return (
    <div
      className="absolute"
      style={{
        width: `${MOBILE_PLATE_WIDTH_PCT}%`,
        // The screen's own centre on the window's centre, both ways. The window
        // is square, so its height is its width and one zoom serves both.
        left: `${50 - MOBILE_PLATE_WIDTH_PCT * (SCREEN_CX / ROOM_W)}%`,
        top: `${50 - MOBILE_CLOSE * 100 * (SCREEN_CY / ROOM_H)}%`,
      }}
    >
      {/* The clip first and the plate over it: see SCREEN_BLEED. */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: `${((SCREEN_X - SCREEN_BLEED) / ROOM_W) * 100}%`,
          top: `${((SCREEN_Y - SCREEN_BLEED) / ROOM_H) * 100}%`,
          width: `${((SCREEN_W + SCREEN_BLEED * 2) / ROOM_W) * 100}%`,
          height: `${((SCREEN_H + SCREEN_BLEED * 2) / ROOM_H) * 100}%`,
        }}
      >
        {children}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ROOM_SRC}
        alt=""
        aria-hidden="true"
        width={ROOM_W}
        height={ROOM_H}
        className="relative block h-auto w-full"
        draggable={false}
      />
    </div>
  );
}

/**
 * The contact stage between the paper-ball section and the process section.
 *
 * The whole thing is one composition in the room image's pixel space: the
 * room plate, and the clip locked behind the screen cut-out in it.
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

  // Its own element, attached in both branches, so the gate does not depend on
  // which one rendered.
  const gateRef = useRef<HTMLDivElement>(null);
  // The phone's two balloons, armed while the picture's top is above the top of
  // the screen. Not latched here: BalloonDrop latches its own start, and resets
  // once the section is scrolled back below the screen.
  const balloons = isMobile && !prefersReducedMotion;
  const dropStateRef = useRef<DropState>({ armed: false, wallLive: false, leaving: false });
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined);
  const [tail, setTail] = useState<{ height: number; width: number; left: number; top: number } | null>(null);

  // THE SOUND. Off on every load. Turning it on is the reader's own press, which
  // is also the only thing a browser accepts as leave to play sound at all.
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  // What the observer below reads: it outlives the render that made it.
  const soundOnRef = useRef(false);
  const inViewRef = useRef(false);
  const fadeTimerRef = useRef<number | null>(null);
  // Only the reduced-motion stage has this: there the clip waits to be played.
  const [playing, setPlaying] = useState(false);

  const toggleSound = (next: boolean) => {
    const video = videoRef.current;
    soundOnRef.current = next;
    setSoundOn(next);
    if (video) fadeSound(video, next && inViewRef.current, fadeTimerRef);
  };

  const togglePlaying = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  // A READER WHO LEFT THE SOUND ON AND SCROLLED AWAY does not go on hearing a
  // clip they can no longer see for the rest of the page. It fades out as the
  // section leaves the screen and back in when it returns. The clip itself
  // never stops.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new IntersectionObserver(([entry]) => {
      inViewRef.current = entry.isIntersecting;
      const video = videoRef.current;
      if (video && soundOnRef.current) fadeSound(video, entry.isIntersecting, fadeTimerRef);
    });
    observer.observe(wrapper);
    const fadeTimer = fadeTimerRef;
    return () => {
      observer.disconnect();
      if (fadeTimer.current !== null) window.clearInterval(fadeTimer.current);
    };
    // The section is a different element in each of the three layouts.
  }, [skipPin, prefersReducedMotion]);

  useEffect(() => {
    const gate = gateRef.current;
    if (!gate) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVideoSrc(VIDEO_SRC);
          observer.disconnect();
        }
      },
      { rootMargin: VIDEO_PRELOAD_MARGIN },
    );
    observer.observe(gate);
    return () => observer.disconnect();
  }, []);

  const { scrollY } = useScroll();

  const update = () => {
    const stage = stageRef.current;
    const form = formRef.current;
    if (!stage || !form) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const progress = clamp01(mapRange(scrollY.get(), pinStartScrollYRef.current, pinEndScrollYRef.current, 0, 1));

    const fadeT = smoothstep(mapRange(progress, FORM_HOLD, FORM_FADE_END, 0, 1));
    form.style.opacity = String(1 - fadeT);
    // Opacity alone would leave the faded block still catching clicks over the
    // footage behind it.
    form.style.pointerEvents = fadeT > 0.5 ? "none" : "auto";

    // Start: the screen cut-out spans the full viewport width.
    // End: the plate at rest, from the one place that decides that.
    const scaleStart = vw / VIDEO_W;
    const rest = roomAtRest(vw, vh);
    const scaleEnd = rest.scale;
    const zoomT = smoothstep(mapRange(progress, ZOOM_START, ZOOM_END, 0, 1));
    const scale = lerp(scaleStart, scaleEnd, zoomT);

    // Where the screen's centre sits on screen at each end. Interpolating the
    // focal point (rather than the plate's corner) is what anchors the zoom to
    // the footage instead of letting the scene slide while it shrinks.
    const focalStartX = vw / 2;
    const focalStartY = (VIDEO_H * scaleStart) / 2;
    const focalEndX = rest.left + SCREEN_CX * scaleEnd;
    const focalEndY = rest.top + SCREEN_CY * scaleEnd;

    const focalX = lerp(focalStartX, focalEndX, zoomT);
    const focalY = lerp(focalStartY, focalEndY, zoomT);

    stage.style.transform = `translate(${focalX - SCREEN_CX * scale}px, ${focalY - SCREEN_CY * scale}px) scale(${scale})`;

    // The clip is centred on the focal point, so its on-screen box falls out
    // of the same two numbers.
    //
    // WHICH OF THE TWO IS DARK HAS CHANGED TWICE, so it is two constants now
    // and not a sentence in this comment: a white showroom around dark footage,
    // then a dark studio around a bright office, and now both dark. The logo
    // reads whichever one is under its corner.
    const halfW = (VIDEO_W * scale) / 2;
    const halfH = (VIDEO_H * scale) / 2;
    const overClip =
      LOGO_X_PX >= focalX - halfW &&
      LOGO_X_PX <= focalX + halfW &&
      LOGO_Y_PX >= focalY - halfH &&
      LOGO_Y_PX <= focalY + halfH;
    wrapperRef.current?.setAttribute("data-nav-dark", String(overClip ? VIDEO_IS_DARK : ROOM_IS_DARK));
  };

  // What is left of the plate below the bottom edge once the zoom has come to
  // rest — nothing but the rest of the picture. It lives outside the section
  // and outside the pin, so it costs the zoom nothing and is simply scrolled
  // into afterwards.
  const measureTail = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { scale, left, top } = roomAtRest(vw, vh);
    const height = top + ROOM_H * scale - vh;
    // Zero on a screen narrower than 16:9, where the plate is scaled by height
    // and there is nothing hanging below.
    setTail(height > 1 ? { height, width: ROOM_W * scale, left, top: top - vh } : null);
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
    measureTail();
    update();

    const handleResize = () => {
      measurePinRange();
      measureTail();
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
    const gate = gateRef.current;
    if (balloons && gate) dropStateRef.current.armed = gate.getBoundingClientRect().top < 0;
  });

  // REDUCED MOTION: THE ROOM STANDING STILL, AND A BUTTON TO PLAY IT. Nothing
  // zooms and nothing plays by itself - that is what this reader asked for -
  // but the clip is not taken away from them either. It stands on its own
  // frame in the room, and playing it is their choice. It used to be the form
  // alone, which left a reader with this setting without the one thing on the
  // page that has sound and a picture in it.
  //
  // No pull up into "who I am" here, unlike the phone: there the room climbs
  // in under a pinned closing line, and with no pin the same overlap laid the
  // plate straight over that section's text.
  //
  // overflow-x-clip: the form's honeypot is parked 9999px off to the side.
  // Unclipped, a phone widened its layout to reach it and zoomed the whole
  // page out to a blank strip.
  // -mt-px: both sections are black but land on fractional pixels, and the
  // white page showed through the seam as a hairline.
  if (prefersReducedMotion) {
    return (
      <section
        ref={wrapperRef}
        id="contact"
        data-nav-dark="true"
        className="relative -mt-px overflow-x-clip bg-black pt-14 pb-24 md:pt-16"
      >
        <div className="mx-auto w-full max-w-[560px] px-6">
          <div ref={gateRef} className="relative aspect-square w-full overflow-hidden">
            <FramedRoom>
              <StageVideo src={videoSrc} videoRef={videoRef} still />
            </FramedRoom>
            <VolumeControl on={soundOn} onChange={toggleSound} className={VOLUME_AT_HEAD} />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Button variant="outline" showArrow={false} onClick={togglePlaying}>
              <span className="inline-flex items-center gap-2">
                {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                {playing ? "עצירת הסרטון" : "הפעלת הסרטון"}
              </span>
            </Button>
          </div>
        </div>
        <div className="mt-14">
          <ContactForm />
        </div>
      </section>
    );
  }

  // Mobile: no pin and no zoom — the clip is just a backdrop with the contact
  // block on it.
  //
  // THE FORM SETS THE HEIGHT, and it did not before. The section used to be as
  // tall as the footage's own 2237:1152 box — 193px on a phone — with the
  // contact block laid over it absolutely, taking part in no layout at all. The
  // block is 240px. It overflowed by 46 and the section clips, so the form that
  // this whole section exists to ask for was cut off at both ends on every
  // phone. The clip is the backdrop now and the content decides the height.
  if (skipPin) {
    return (
      // PULLED UP INTO THE SECTION ABOVE, and z-20 so it travels over it.
      //
      // The closing line of "who I am" is pinned to the middle of the screen at
      // the end of that section, and while a panel is pinned nothing below it
      // can be seen — so the line always held on a screen of black and then the
      // room appeared afterwards, as a separate arrival. Starting this section
      // 42svh early means the room climbs into view WHILE the line is still
      // standing, and when the pin lets go the two travel on together.
      //
      // It also closes the hairline the sections used to show at their seam:
      // both are black, but their heights are computed from svh and land on
      // fractional pixels, and the white page showed through the gap.
      // data-nav-dark: this is the one black section on the phone's page, and
      // the floating chrome — the logo, the menu, the WhatsApp mark — all read
      // this attribute to know to invert. The desktop branch sets it from its
      // own scroll handler because the zoom changes what is under the corner;
      // here nothing moves, so it is simply true.
      //
      // TRANSPARENT FOR THE PART PULLED UP, black from there down. The overlap
      // lies over the black of "who I am" anyway, and painted black it hid that
      // section's falling balloons at this section's top edge — a band of open
      // black above the picture where they simply vanished. Clear, they fall on
      // until the picture itself covers them. The switch is 2px inside the
      // overlap so the fractional-pixel seam above still has black on both sides.
      <section
        ref={wrapperRef}
        id="contact"
        data-nav-dark="true"
        className="relative z-20 -mt-[42svh] overflow-hidden bg-[linear-gradient(to_bottom,transparent_calc(42svh_-_2px),black_calc(42svh_-_2px))] py-24"
      >
        {balloons && <BalloonDrop sectionRef={wrapperRef} stateRef={dropStateRef} variant="contact" />}
        {/* The plate, framed rather than filled - see FramedRoom. The zoom does
            not run on a phone, so what is left of this section is the
            composition it ends on, and a composition wants black around it,
            not a screen it bleeds off. */}
        {/* data-balloon-floor: where the balloons falling out of "who I am"
            stop being visible — see BalloonDrop.

            z-10 puts the picture ABOVE this stage's own balloon layer, which
            sits at z-[5]: they pass behind the room and the footage and are
            only seen once they are below it, against the black of the form. */}
        <div
          ref={gateRef}
          data-balloon-floor
          className="relative z-10 aspect-square w-full overflow-hidden"
        >
          <FramedRoom>
            <StageVideo src={videoSrc} videoRef={videoRef} />
          </FramedRoom>
          <VolumeControl on={soundOn} onChange={toggleSound} className={VOLUME_AT_HEAD} />
        </div>

        {/* And the ask underneath it. No heading over the picture: the block
            below already opens with one, so putting a second line above the
            plate would explain the shot before it had been looked at. */}
        {/* relative z-10, like the picture above it: this stage's balloons fall
            in the layer at z-[5], and a form without a level of its own is
            painted underneath that layer — they dropped straight across the
            fields. Lifted to the picture's level, they pass behind both. */}
        <div className="relative z-10 mt-[9svh]">
          <ContactForm />
        </div>
      </section>
    );
  }

  return (
    <>
    <section
      ref={wrapperRef}
      id="contact"
      className="relative bg-white"
      style={{ height: `calc(100vh + ${PIN_VH + HOLD_VH}vh)` }}
    >
      {/* Zero-height marker at the very top of the section: the observer
          needs something that scrolls with the page, and the panel itself is
          sticky, which would keep it intersecting once reached. */}
      <div ref={gateRef} aria-hidden="true" className="absolute inset-x-0 top-0 h-px" />

      <div ref={panelRef} className="sticky top-0 h-screen w-full overflow-hidden bg-white">
        {/* One rigid scene in the plate's own pixel space. Only this element's
            transform ever changes; nothing inside it moves independently. */}
        <div
          ref={stageRef}
          className="absolute top-0 left-0 origin-top-left will-change-transform"
          style={{ width: ROOM_W, height: ROOM_H }}
        >
          {/* The clip, under the plate and a little larger than the hole it is
              seen through - see SCREEN_BLEED. The frame around the screen used
              to be drawn here, a chrome bezel with a sweep of light across it,
              because the old plate had none; this one has its own. */}
          <div
            className="absolute overflow-hidden"
            style={{
              left: SCREEN_X - SCREEN_BLEED,
              top: SCREEN_Y - SCREEN_BLEED,
              width: SCREEN_W + SCREEN_BLEED * 2,
              height: SCREEN_H + SCREEN_BLEED * 2,
            }}
          >
            <StageVideo src={videoSrc} videoRef={videoRef} />
          </div>

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
        </div>

        <div ref={formRef} className="absolute inset-0 z-10 flex items-center justify-center">
          <ContactForm />
        </div>

        {/* The sound, at the head of the pinned screen for the whole of the
            zoom: over the clip while it fills the screen and over the room once
            it has pulled back. Above the form's layer, which covers the panel.
            The logo and the menu hold the two corners; the middle is free. */}
        <VolumeControl on={soundOn} onChange={toggleSound} className={cn(VOLUME_AT_HEAD, "top-5 z-20")} />
      </div>
    </section>

    {/* The rest of the picture. Outside the section on purpose: it takes no
        part in the zoom, adds nothing to the pin's travel, and exists only so
        the plate does not end on a cut edge. Same image, same resting scale,
        pushed up by a viewport so it is the continuation of what the panel
        above is already showing rather than a second copy placed near it. */}
    {tail && (
      <div
        aria-hidden="true"
        data-nav-dark="true"
        className="relative overflow-clip bg-white"
        style={{ height: tail.height }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ROOM_SRC}
          alt=""
          width={ROOM_W}
          height={ROOM_H}
          className="absolute max-w-none"
          style={{ width: tail.width, height: "auto", left: tail.left, top: tail.top }}
          draggable={false}
        />
      </div>
    )}
    </>
  );
}
