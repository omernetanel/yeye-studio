// One place for the brand name, because it was previously spelled out in every
// page's metadata and had already drifted: the homepage said "YEYE Digital"
// while every sub-page tab said "YEYE LABS".
export const SITE_NAME = "YEYE Digital";
// The name first, so a saved tab reads as the studio and not as a list of
// services; what it does comes after, in the words people search for.
export const SITE_TITLE = `${SITE_NAME} | עיצוב ובניית אתרים ומיתוג לעסקים`;
export const SITE_DESCRIPTION =
  "אני עומר, ואני מעצב ובונה אתרים מאפס: אתרי תדמית, דפי נחיתה, חנויות אונליין ומיתוג. בלי תבניות ובלי אנשים באמצע, מהרעיון ועד שהאתר באוויר.";

/** The name as it is said and searched for in Hebrew. Never shown on a page. */
export const SITE_NAME_HEBREW = "YEYE דיגיטל";

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
 * The same surface through the page's one dark stretch. The navbar swaps the
 * browser chrome to this and back - the meta tag and the document surface for
 * most browsers, and on a phone the two fixed edge strips Safari 26 actually
 * samples - so the bars follow the page instead of staying white over black.
 * It has to match the sections' own black exactly.
 */
export const SITE_BACKGROUND_DARK = "#000000";

/**
 * The studio's WhatsApp number, in the international form wa.me expects —
 * country code, no plus, no leading zero. ONE place: it was written out as its
 * own constant in four files, which is how a number change turns into a hunt.
 */
export const WHATSAPP_NUMBER = "972552759445";

/** The studio's Instagram profile (@yeye__digital). */
export const INSTAGRAM_URL = "https://www.instagram.com/yeye__digital/";

/**
 * The address the site publishes, in one place.
 *
 * It was `hello@yeyelabs.com`, hard-coded in the hero — an address on a domain
 * the studio no longer uses, on a mailbox that does not exist. Anyone who
 * pressed the mail icon wrote to nowhere. It is the studio's own address on
 * its own domain; ImprovMX forwards it to the studio's Gmail inbox (the DNS
 * records are at box.co.il). Do not ship a change to it before mail to the new
 * address has been seen to arrive.
 */
export const CONTACT_EMAIL = "info@yeye.co.il";

/**
 * Where the site's forms are delivered, and the address they are sent from.
 * Both on the studio's own domain: the sender is verified in Resend (so it is
 * signed for yeye.co.il and lands in the inbox, not in spam), and the inbox is
 * forwarded on to the studio's mail. Server-only - neither is shown on a page.
 */
export const FORMS_INBOX = CONTACT_EMAIL;
export const FORMS_SENDER = `${SITE_NAME} <forms@yeye.co.il>`;

/**
 * Where the site lives. Used for canonical URLs, the sitemap and robots, so
 * all three can never disagree — which they did, all pointing at the old
 * domain with a TODO beside each one.
 */
export const SITE_URL = "https://yeye.co.il";

/** Title for any page that is not the homepage. */
export function pageTitle(label: string) {
  return `${label} | ${SITE_NAME}`;
}

/**
 * Everything a page below the homepage says about itself, from one call.
 *
 * A page that set only `title` and `description` kept the layout's share card,
 * so a link to a service page arrived in WhatsApp under the homepage's title
 * and declared the homepage as its address. Next replaces `openGraph` whole
 * rather than merging it, which is why the site name and locale are repeated
 * here and not left to the layout - and why the card is named outright: the
 * image from app/opengraph-image.tsx is dropped along with the rest.
 */
export function pageMetadata({ label, description, path }: { label: string; description: string; path: string }) {
  const title = pageTitle(label);
  const images = [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME }];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: SITE_NAME, locale: "he_IL", type: "website" as const, images },
    twitter: { card: "summary_large_image" as const, title, description, images },
  };
}
