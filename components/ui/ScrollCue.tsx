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
 */
export default function ScrollCue({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none flex flex-col items-center gap-2.5 select-none", className)}
    >
      <span className="relative block h-14 w-px bg-black/25">
        <span className="scroll-cue-dot absolute top-1/2 -left-[5px] block h-[11px] w-[11px] rounded-full bg-black" />
      </span>
      <span className="paper-halo font-display text-m-small font-medium text-black/60">גללו להמשך</span>
    </div>
  );
}
