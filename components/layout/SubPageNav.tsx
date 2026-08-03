"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// About lives inside the homepage's services section rather than on a page of
// its own, so it and "שירותים" deliberately resolve to the same anchor. Split
// them only once there is a real destination to point at.
const LINKS = [
  { label: "עבודות", href: "/projects" },
  { label: "שירותים", href: "/#services" },
  { label: "אודות", href: "/#services" },
  { label: "צור קשר", href: "/contact" },
];

/**
 * The way off a sub-page. The homepage navbar is a bare logo — nothing to
 * navigate with — which left the service pages as dead ends once you landed
 * on one. Sits alongside that logo (which stays owned by Navbar) and adds a
 * back link under the row.
 */
export default function SubPageNav() {
  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-end gap-6 px-6 ps-[120px]">
          {LINKS.map((link, i) => (
            <div key={link.href + link.label} className="flex items-center gap-6">
              <Link
                href={link.href}
                className="font-display text-[14px] text-black/60 transition-colors hover:text-black"
              >
                {link.label}
              </Link>
              {i < LINKS.length - 1 && <span aria-hidden className="text-black/20">·</span>}
            </div>
          ))}
        </div>
      </nav>

      {/* Below the row, per its own line in the layout — offset by the bar's
          own height so it never sits under it. */}
      <div className="fixed inset-x-0 top-[72px] z-40">
        <div className="mx-auto flex max-w-[1400px] justify-end px-6 pt-4">
          <Link
            href="/#services"
            className="group inline-flex items-center gap-2 font-display text-[14px] font-medium text-black/70 transition-colors hover:text-black"
          >
            <span>חזור</span>
            <ArrowLeft size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>
    </>
  );
}
