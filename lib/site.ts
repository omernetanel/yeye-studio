// One place for the brand name, because it was previously spelled out in every
// page's metadata and had already drifted: the homepage said "YEYE Digital"
// while every sub-page tab said "YEYE LABS".
export const SITE_NAME = "YEYE Digital";
export const SITE_TITLE = `${SITE_NAME} - סטודיו דיגיטלי`;
export const SITE_DESCRIPTION = "אני בונה אתרים ומערכות שמייצרות לקוחות לעסקים.";

/**
 * The document's own surface — THE one place this colour is written.
 *
 * It is not a decoration: nothing on the page shows it, because every section
 * paints its own background over it. What it does is tell the phone what colour
 * to make the strip behind the clock and the bar at the foot of the screen, and
 * a browser reads that from two places at once — the theme-color meta tag and
 * the surface the document actually declares. They have to agree, or it picks
 * for itself, which is how a white studio page ended up sitting between two
 * black bars.
 *
 * So both come from here. app/layout.tsx feeds it to the meta tag AND sets
 * --color-background from it, which is the variable app/globals.css paints
 * html and body with. If this site is ever blue, this line is the only edit.
 */
export const SITE_BACKGROUND = "#ffffff";

/**
 * The same surface while a black section fills the top of the screen. The
 * navbar swaps the browser chrome to this and back as those sections pass, so
 * the strip behind the clock follows the page instead of staying white over
 * black. It has to match the sections' own black exactly.
 */
export const SITE_BACKGROUND_DARK = "#000000";

/** Title for any page that is not the homepage. */
export function pageTitle(label: string) {
  return `${label} | ${SITE_NAME}`;
}
