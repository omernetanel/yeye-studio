/**
 * WHERE A HASH LINK ON THE HOME PAGE ACTUALLY LANDS — the one table, and the
 * one piece of arithmetic that reads it.
 *
 * Half the sections on that page are pinned panels that play out over screens
 * of scroll, and their `id` sits at the TOP of that run: at the very start of
 * the animation, where #services is a shrunken sheet, #about is an empty black
 * panel and #projects is a blurred heading below the bottom edge. A plain hash
 * jump would drop the reader on exactly the frame that means nothing.
 *
 * So a target is a section plus how far into its own run to go. The fraction is
 * of the section's pin travel — its height less a viewport — which is zero for
 * an ordinary section, so the same arithmetic covers both kinds.
 *
 * THIS LIVED IN NavMenu, and so did a second copy of "what to do when the page
 * arrives with a hash" — one in the menu and one in the scroll provider, both
 * firing on the same frame and quietly racing. The knowledge moved here; the
 * menu now uses it for clicks and the provider for arrivals, and neither knows
 * about the other.
 */

// `at` per layout where the phone's section is built differently from the
// desktop's and the same fraction lands somewhere else in it.
export type HashTarget = { label: string; id: string; at: number | { desktop: number; mobile: number } };

export const TARGETS: HashTarget[] = [
  { label: "הבית", id: "hero", at: 0 },
  // The services themselves — the heading and the list, which is what the
  // label promises. Further in is the process, which is a different section in
  // all but markup.
  { label: "מה אני עושה", id: "services", at: 0 },
  // Past the greeting and the portrait's arrival, on the three claims. The
  // phone's claims are cards under the portrait, further down its section:
  // 0.42 there stopped on the paragraphs above them.
  { label: "מי אני", id: "about", at: { desktop: 0.42, mobile: 0.56 } },
  // After the heading has settled and the arc is up. 0.75 on desktop because
  // the section runs on past its pin — the button under the arc — and 0.94 of
  // the whole of it carried the heading off the top of the screen. The phone's
  // section is not pinned: its top is where the heading is already settled.
  { label: "פרויקטים", id: "projects", at: { desktop: 0.75, mobile: 0 } },
];

// The contact stage is deliberately absent from the menu: it is a section you
// arrive at by reading, not one you jump into. The way to it is the CTA — and
// every "contact" link on the page lands there too.
export const CTA: HashTarget = { label: "בואו נדבר", id: "cta", at: 0 };

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
export function destinationForHash(hash: string, isMobile: boolean): number | null {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!id) return null;

  const target = targetForHash(id);
  if (target) return destinationOf(target, isMobile);

  const element = document.getElementById(decodeURIComponent(id));
  return element ? Math.round(element.getBoundingClientRect().top + window.scrollY) : null;
}

/**
 * Where that target sits on the page right now, or null if its section is not
 * on this one. Reads the DOM, so it is only ever called from the browser.
 */
export function destinationOf(target: HashTarget, isMobile: boolean): number | null {
  const section = document.getElementById(target.id);
  if (!section) return null;
  const top = section.getBoundingClientRect().top + window.scrollY;
  // Zero for a section that is not pinned, so this one line serves both.
  const run = Math.max(0, section.offsetHeight - window.innerHeight);
  const at = typeof target.at === "number" ? target.at : isMobile ? target.at.mobile : target.at.desktop;
  return Math.round(top + run * at);
}
