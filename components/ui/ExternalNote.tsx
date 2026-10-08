import { ExternalLink, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Where a piece of work opens: on another site, or on a page of this one.
 *
 * Some of the work has its own page here and some goes straight to the live
 * site, and nothing told the two apart until the tab changed. It began as a
 * note on the ones that leave. The ones that stay now say so too (`inSite`):
 * a reader expects a piece of work to open the site itself, and a page about
 * it instead is as much of a surprise as a new tab was. Said in words, with a
 * mark beside them, so neither is.
 *
 * `shown={false}` keeps its line and hides it: where pieces stand side by side
 * or swap in one place, one without a note must not come out shorter.
 * The colour is the caller's - it sits on white in one place and on a dark
 * card in another.
 */
export default function ExternalNote({
  shown = true,
  inSite = false,
  className,
}: {
  shown?: boolean;
  /** The work opens on its page here, rather than on another site. */
  inSite?: boolean;
  className?: string;
}) {
  const Mark = inSite ? FileText : ExternalLink;
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-body text-[12px]", !shown && "invisible", className)}>
      <Mark size={12} strokeWidth={2} aria-hidden="true" />
      {inSite ? "נפתח בעמוד הפרויקט" : "נפתח באתר חיצוני"}
    </span>
  );
}
