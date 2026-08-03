// One place for the brand name, because it was previously spelled out in every
// page's metadata and had already drifted: the homepage said "YEYE Digital"
// while every sub-page tab said "YEYE LABS".
export const SITE_NAME = "YEYE Digital";
export const SITE_TITLE = `${SITE_NAME} - סטודיו דיגיטלי`;
export const SITE_DESCRIPTION = "אני בונה אתרים ומערכות שמייצרות לקוחות לעסקים.";

/** Title for any page that is not the homepage. */
export function pageTitle(label: string) {
  return `${label} | ${SITE_NAME}`;
}
