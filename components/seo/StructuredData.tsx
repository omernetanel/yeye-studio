import {
  CONTACT_EMAIL,
  INSTAGRAM_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_HEBREW,
  SITE_URL,
  WHATSAPP_NUMBER,
} from "@/lib/site";

/**
 * The studio, in the form a search engine reads.
 *
 * Everything here is already written on the page in Hebrew — the name, what is
 * made, the number people write to. This is the same set of facts in the
 * machine-readable form, so a result for the studio's own name can carry them
 * instead of whatever a crawler happens to pull out of a pinned scroll
 * animation.
 *
 * NOTHING IS INVENTED HERE. No address, because the business is registered at a
 * home and that address is deliberately unpublished. No opening hours, no
 * ratings, no founding date. If a fact is not on the site, it is not in this
 * block. The Instagram profile is here because the menu and the footer link to
 * it; the name in Hebrew letters is only how it is typed into a search box.
 */

/** The studio's node. Service pages and /about point at it by this id. */
export const STUDIO_ID = `${SITE_URL}/#studio`;
/** The person behind it, described in full on /about. */
export const FOUNDER_ID = `${SITE_URL}/about#omer`;

/** One JSON-LD block. Built from constants only, never from visitor input. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": STUDIO_ID,
        name: SITE_NAME,
        alternateName: SITE_NAME_HEBREW,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        image: `${SITE_URL}/opengraph-image`,
        // The site's own icon route, which is the wordmark's "E" in black.
        logo: `${SITE_URL}/icon.png`,
        // The international form, with the plus a phone number is written with.
        telephone: `+${WHATSAPP_NUMBER}`,
        email: CONTACT_EMAIL,
        areaServed: { "@type": "Country", name: "Israel" },
        availableLanguage: "he",
        founder: { "@id": FOUNDER_ID },
        sameAs: [INSTAGRAM_URL],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        alternateName: SITE_NAME_HEBREW,
        inLanguage: "he-IL",
        publisher: { "@id": STUDIO_ID },
      },
    ],
  };

  return <JsonLd data={data} />;
}

/**
 * One service page, as a search engine reads it: what is offered, by whom, and
 * where the page sits under the homepage. The name and description are the
 * page's own metadata, passed in, so the two cannot drift apart.
 */
export function ServiceStructuredData({ name, description, path }: { name: string; description: string; path: string }) {
  const url = `${SITE_URL}${path}`;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Service",
            "@id": `${url}#service`,
            name,
            description,
            url,
            provider: { "@id": STUDIO_ID },
            areaServed: { "@type": "Country", name: "Israel" },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
              { "@type": "ListItem", position: 2, name, item: url },
            ],
          },
        ],
      }}
    />
  );
}
