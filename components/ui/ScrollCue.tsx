import { cn } from "@/lib/utils";

/**
 * KEEP SCROLLING, said without a hand: a dot travelling up a short line - a
 * thumb's own movement - and two words under it.
 *
 * For a pinned screen. Nothing on one says that the page is not stuck, and on
 * the phone every reader who was handed it thought it was. The line and the dot
 * are the sign; the words only name it, so they stay small while the sign is
 * large enough to be seen at the foot of a phone.
 *
 * A drawn finger was considered and turned down: it is the illustration the
 * stages had just lost, and it reads as an app's tutorial.
 *
 * Markup and its own motion only (.scroll-cue-dot in globals.css). The section
 * that owns it places it and decides when it shows. Decoration: a reader who
 * cannot see it is not on a pinned screen to begin with. select-none, because a
 * long press on a phone selected the words and raised the copy bubble.
 *
 * `short`: a 36px line instead of 56, for the foot of a phone screen whose
 * content runs close to it.
 */
export default function ScrollCue({ className, short = false }: { className?: string; short?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none flex flex-col items-center select-none", short ? "gap-2" : "gap-2.5", className)}
    >
      <span className={cn("relative block w-px bg-black/25", short ? "h-9" : "h-14")}>
        {/* The run along the line (globals.css), scaled with the line. */}
        <span
          className={cn(
            "scroll-cue-dot absolute top-1/2 -left-[5px] block h-[11px] w-[11px] rounded-full bg-black",
            short && "[--cue-from:12px] [--cue-to:-21px]",
          )}
        />
      </span>
      <span className="paper-halo font-display text-m-small font-medium text-black/60">גללו להמשך</span>
    </div>
  );
}
