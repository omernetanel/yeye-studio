import Link from "next/link";
import { ExternalLink } from "lucide-react";
import ArrowIcon from "@/components/ui/ArrowIcon";
import { cn } from "@/lib/utils";

/**
 * Where a piece of work opens: in a new tab, or on a page of this site.
 *
 * Some of the work has its own page here and some goes straight to the live
 * site, and nothing told the two apart until the tab changed. It began as a
 * note on the ones that leave. The ones that stay now say so too (`inSite`):
 * a reader expects a piece of work to open the site itself, and a page about
 * it instead is as much of a surprise as a new tab was.
 *
 * The two are not worded alike on purpose. Leaving says the one thing that has
 * to be known before pressing - that a new tab opens. Staying is only a
 * direction, with the site's arrow.
 *
 * WITH `href` IT IS PRESSED LIKE WHAT IT DESCRIBES. A line about a press that
 * could not itself be pressed was odd. It is a second way to the same place
 * as the name beside it, so it is kept out of the tab order and away from
 * screen readers, which would otherwise meet the same link twice. Without
 * `href` it is plain text - where it already stands inside a link.
 *
 * `shown={false}` keeps its line and hides it: where pieces stand side by side
 * or swap in one place, one without a note must not come out shorter.
 * The colour is the caller's - it sits on white in one place and on a dark
 * card in another.
 */
export default function ExternalNote({
  shown = true,
  inSite = false,
  href,
  className,
}: {
  shown?: boolean;
  /** The work opens on its page here, rather than in a new tab. */
  inSite?: boolean;
  /** Where it goes. Given, the note is a link there. */
  href?: string;
  className?: string;
}) {
  const classes = cn("inline-flex items-center gap-1.5 font-body text-[12px]", !shown && "invisible", className);
  const content = inSite ? (
    <>
      לעמוד הפרויקט
      <ArrowIcon className="h-3 w-3" />
    </>
  ) : (
    <>
      <ExternalLink size={12} strokeWidth={2} aria-hidden="true" />
      נפתח בכרטיסייה חדשה
    </>
  );

  if (!href) return <span className={classes}>{content}</span>;
  return (
    <Link
      href={href}
      target={inSite ? undefined : "_blank"}
      rel={inSite ? undefined : "noopener noreferrer"}
      aria-hidden="true"
      tabIndex={-1}
      className={cn(classes, "underline-offset-4 hover:underline")}
    >
      {content}
    </Link>
  );
}
