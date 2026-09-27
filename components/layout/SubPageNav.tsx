"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// About lives inside the homepage's services section rather than on a page of
// its own, so it and "שירותים" deliberately resolve to the same anchor. Split
// them only once there is a real destination to point at.
const LINKS = [
  { label: "עבודות", href: "/projects" },
  { label: "שירותים", href: "/#services" },
  { label: "מי אני", href: "/#about" },
  { label: "צור קשר", href: "/#cta" },
];

/**
 * The way off a sub-page. The homepage navbar is a bare logo — nothing to
 * navigate with — which left the service pages as dead ends once you landed
 * on one. Sits alongside that logo (which stays owned by Navbar) and adds a
 * back link under the row.
 */
// One set of styles for the back control, because it renders as a button or as
// a link depending on where the reader came from and the two have to be
// indistinguishable.
const BACK_CLASS =
  "group inline-flex items-center gap-2 font-display text-[14px] font-medium text-black/70 transition-colors hover:text-black";

export default function SubPageNav() {
  const router = useRouter();
  // GOING BACK MEANS GOING BACK, not going to a fixed address. This was a hard
  // link to /#services, so a reader who arrived from the work grid, from the
  // menu, or from another project was sent to the services section of the home
  // page instead of to the place they left - and to the top of it.
  //
  // It only behaves that way when there is somewhere to go back TO. Someone who
  // opened this page in a fresh tab from a search result has no in-site history
  // (history.length === 1), and for them the control stays the link it was.
  // Read through useSyncExternalStore, the same way the site reads the
  // reader's motion and accessibility preferences: the server snapshot is
  // false, so the markup that arrives is the plain link, and the client
  // snapshot answers from the real history once it is hydrated. The subscribe
  // is empty because history.length announces nothing - it is read once.
  const canGoBack = useSyncExternalStore(
    () => () => {},
    () => window.history.length > 1,
    () => false,
  );

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur-md">
        {/* justify-start is the RIGHT edge under dir="rtl", which is where the
            row belongs. The logo Navbar owns is pinned physically left, so the
            space kept clear for it is padding-inline-END here — reserving it at
            the start instead is what was pushing the row into the logo. */}
        {/* Tighter on a phone, and without the dots: at desktop spacing the
            four links did not fit beside the logo and "צור קשר" broke onto two
            lines. */}
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-start gap-4 px-6 pe-[88px] sm:gap-6 sm:pe-[120px]">
          {LINKS.map((link, i) => (
            <div key={link.href + link.label} className="flex items-center gap-6">
              <Link
                href={link.href}
                className="font-display text-[13px] whitespace-nowrap text-black/60 transition-colors hover:text-black sm:text-[14px]"
              >
                {link.label}
              </Link>
              {i < LINKS.length - 1 && <span aria-hidden className="hidden text-black/20 sm:inline">·</span>}
            </div>
          ))}
        </div>
      </nav>

      {/* Below the row, per its own line in the layout — offset by the bar's
          own height so it never sits under it. */}
      <div className="fixed inset-x-0 top-[72px] z-40">
        <div className="mx-auto flex max-w-[1400px] justify-start px-6 pt-4">
          {canGoBack ? (
            <button type="button" onClick={() => router.back()} className={BACK_CLASS}>
              <span>חזור</span>
              <ArrowLeft size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:-translate-x-1" />
            </button>
          ) : (
            <Link href="/#services" className={BACK_CLASS}>
              <span>חזור</span>
              <ArrowLeft size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:-translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
