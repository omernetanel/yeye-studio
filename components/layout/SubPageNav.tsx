"use client";

import { useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { hasInSiteHistory, subscribeInSiteHistory } from "@/lib/nav/in-site-history";
import NavMenu from "@/components/layout/NavMenu";
import { useOverDark } from "@/lib/use-over-dark";
import { cn } from "@/lib/utils";

/**
 * The header of a sub-page: the site's own menu, the same button and panel as
 * the home page, and a way back under it.
 *
 * ONE MENU, EVERYWHERE. This used to be a row of four text links of its own -
 * a second navigation with its own labels, its own spacing and its own way of
 * being crowded on a phone. A reader who moves between the home page and a
 * project should find the same button in the same corner. From here its items
 * go to the home page and land where each section is whole (see NavMenu).
 *
 * The white bar stays: on a sub-page the text scrolls up under the logo and
 * the button, and without it the two ran into whatever passed beneath them.
 */
// One set of styles for the back control, because it renders as a button or as
// a link depending on where the reader came from and the two have to be
// indistinguishable.
const BACK_BASE = "group inline-flex items-center gap-2 font-display text-[14px] font-medium transition-colors";
const BACK_ON_LIGHT = "text-black/70 hover:text-black";
const BACK_ON_DARK = "text-white/80 hover:text-white";

export default function SubPageNav({
  bare = false,
}: {
  /**
   * No bar, and "back" goes with the reader down the page. For a page that
   * runs edge to edge in its own colours from the very top, where a white bar
   * would be a lid on it: the mark and the menu float free, and each reads
   * which ground it is over (data-nav-dark) and turns white or black to suit.
   */
  bare?: boolean;
}) {
  const backRef = useRef<HTMLDivElement>(null);
  const overDark = useOverDark(backRef);
  const backClass = `${BACK_BASE} ${bare && overDark ? BACK_ON_DARK : BACK_ON_LIGHT}`;
  const router = useRouter();
  // GOING BACK MEANS GOING BACK, not going to a fixed address - to the place
  // the reader left, which the scroll provider restores.
  //
  // It only behaves that way when there is somewhere of OURS to go back to.
  // Someone who landed here from a search result has none, and sending them
  // back would send them out of the site; they get the home page instead.
  // Read through useSyncExternalStore: the server snapshot is false, so the
  // markup that arrives is the plain link, and the client snapshot answers once
  // it is hydrated - and again when the trail is written, which happens after
  // this has rendered (see subscribeInSiteHistory).
  const canGoBack = useSyncExternalStore(subscribeInSiteHistory, hasInSiteHistory, () => false);

  return (
    <>
      {!bare && (
        <div aria-hidden="true" className="fixed inset-x-0 top-0 z-40 h-[64px] border-b border-black/5 bg-white/85 backdrop-blur-md md:h-[68px]" />
      )}
      <NavMenu />

      {/* Under the bar, in the top padding every sub-page leaves. Absolute, not
          fixed: pinned to the screen it floated over the text once the page
          scrolled under it. */}
      <div className={bare ? "pointer-events-none fixed inset-x-0 top-[48px] z-30" : "absolute inset-x-0 top-[72px] z-30"}>
        {/* Bare, it stands on the menu's own edge - 24px in from the side of the
            screen, however wide - and not on the page column's. */}
        <div
          ref={backRef}
          className={cn("flex justify-start px-6 pt-4 [&>*]:pointer-events-auto", !bare && "mx-auto max-w-[1400px]")}
        >
          {canGoBack ? (
            <button type="button" onClick={() => router.back()} className={backClass}>
              <span>חזור</span>
              <ArrowLeft size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:-translate-x-1" />
            </button>
          ) : (
            <Link href="/" className={backClass}>
              <span>חזור</span>
              <ArrowLeft size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:-translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
