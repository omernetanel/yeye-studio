/**
 * WHERE A HASH LINK ON THE HOME PAGE ACTUALLY LANDS — the one table, and the
 * one function that reads it.
 *
 * Half the sections on that page are pinned panels that play out over screens
 * of scroll, and their `id` sits at the TOP of that run: at the very start of
 * the animation, where #about is an empty black panel and #projects is a
 * blurred heading below the bottom edge. A plain hash jump would drop the
 * reader on exactly the frame that means nothing.
 *
 * So a pinned section reports where it is whole (lib/nav/landings.ts), and a
 * link goes there. Someone who used the menu wants what the label says, on one
 * complete screen - not a frame from the middle of an arrival. A section that
 * reports nothing is simply its top.
 *
 * THIS LIVED IN NavMenu, and so did a second copy of "what to do when the page
 * arrives with a hash" — one in the menu and one in the scroll provider, both
 * firing on the same frame and quietly racing. The knowledge moved here; the
 * menu uses it for clicks and the provider for arrivals, and neither knows
 * about the other.
 */

import { isMotionReduced } from "@/lib/reduced-motion";
import { landingFor } from "@/lib/nav/landings";

/**
 * `id` is the hash; `section` is the element it belongs to, when the two are
 * not the same - "איך אני עובד" is a moment inside the services section, not a
 * section of its own.
 */
export type HashTarget = { label: string; id: string; section?: string };

export const TARGETS: HashTarget[] = [
  { label: "הבית", id: "hero" },
  { label: "מה אני עושה", id: "services" },
  // The first stage of the process, whole on the open sheet.
  { label: "איך אני עובד", id: "process", section: "services" },
  { label: "מי אני", id: "about" },
  { label: "פרויקטים", id: "projects" },
];

// The contact stage is deliberately absent from the menu: it is a section you
// arrive at by reading, not one you jump into. The way to it is the CTA — and
// every "contact" link on the page lands there too.
export const CTA: HashTarget = { label: "בואו נדבר", id: "cta" };

export const ALL_TARGETS = [...TARGETS, CTA];

/** The target a `#id` or `/#id` names, or undefined for anything else. */
export function targetForHash(hash: string) {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  return ALL_TARGETS.find((target) => target.id === id);
}

/**
 * Where the page should sit for a given hash: the target's own landing point
 * when the hash names one, the element's top when it names anything else on the
 * page, and null when there is nothing to aim at — no hash, or a section that
 * belongs to a page this is not.
 */
export function destinationForHash(hash: string): number | null {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!id) return null;

  const target = targetForHash(id);
  if (target) return destinationOf(target);

  const element = document.getElementById(decodeURIComponent(id));
  return element ? Math.round(element.getBoundingClientRect().top + window.scrollY) : null;
}

/**
 * Where that target sits on the page right now, or null if its section is not
 * on this one. Reads the DOM, so it is only ever called from the browser.
 *
 * With less motion nothing is pinned and every section is simply its content,
 * so the top is the place and nothing is asked of the sections.
 */
export function destinationOf(target: HashTarget): number | null {
  if (!isMotionReduced()) {
    const landing = landingFor(target.id);
    if (landing !== null) return Math.round(landing);
  }
  const section = document.getElementById(target.section ?? target.id);
  return section ? Math.round(section.getBoundingClientRect().top + window.scrollY) : null;
}
