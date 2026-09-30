"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { hasInSiteHistory } from "@/lib/nav/in-site-history";
import NavMenu from "@/components/layout/NavMenu";

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
const BACK_CLASS =
  "group inline-flex items-center gap-2 font-display text-[14px] font-medium text-black/70 transition-colors hover:text-black";

export default function SubPageNav() {
  const router = useRouter();
  // GOING BACK MEANS GOING BACK, not going to a fixed address - to the place
  // the reader left, which the scroll provider restores.
  //
  // It only behaves that way when there is somewhere of OURS to go back to.
  // Someone who landed here from a search result has none, and sending them
  // back would send them out of the site; they get the home page instead.
  // Read through useSyncExternalStore: the server snapshot is false, so the
  // markup that arrives is the plain link, and the client snapshot answers once
  // it is hydrated.
  const canGoBack = useSyncExternalStore(
    () => () => {},
    hasInSiteHistory,
    () => false,
  );

  return (
    <>
      <div aria-hidden="true" className="fixed inset-x-0 top-0 z-40 h-[64px] border-b border-black/5 bg-white/85 backdrop-blur-md md:h-[68px]" />
      <NavMenu />

      {/* Under the bar, in the top padding every sub-page leaves. Absolute, not
          fixed: pinned to the screen it floated over the text once the page
          scrolled under it. */}
      <div className="absolute inset-x-0 top-[72px] z-30">
        <div className="mx-auto flex max-w-[1400px] justify-start px-6 pt-4">
          {canGoBack ? (
            <button type="button" onClick={() => router.back()} className={BACK_CLASS}>
              <span>חזור</span>
              <ArrowLeft size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:-translate-x-1" />
            </button>
          ) : (
            <Link href="/" className={BACK_CLASS}>
              <span>חזור</span>
              <ArrowLeft size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:-translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
