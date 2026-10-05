import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "This one opens on another site" - under a piece of work whose link goes
 * straight to the live site instead of to a page here.
 *
 * Some of the work has its own page on this site and some does not, and
 * nothing told the two apart until the tab changed. Said in words, with the
 * mark everyone knows for it, so leaving the site is never a surprise.
 *
 * `shown={false}` keeps its line and hides it: where pieces stand side by side
 * or swap in one place, the ones without the note must not come out shorter.
 * The colour is the caller's - it sits on white in one place and on a dark
 * card in another.
 */
export default function ExternalNote({ shown = true, className }: { shown?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-body text-[12px]", !shown && "invisible", className)}>
      <ExternalLink size={12} strokeWidth={2} aria-hidden="true" />
      נפתח באתר חיצוני
    </span>
  );
}
