import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, WHATSAPP_NUMBER } from "@/lib/site";

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
 * ratings, no founding date, no social profiles — the Instagram account exists
 * but is empty, and `sameAs` pointing at an empty profile is worse than no
 * `sameAs` at all. If a fact is not on the site, it is not in this block.
 */
export default function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${SITE_URL}/#studio`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        image: `${SITE_URL}/opengraph-image`,
        // The site's own icon route, which is the wordmark's "E" in black.
        logo: `${SITE_URL}/icon.png`,
        // The international form, with the plus a phone number is written with.
        telephone: `+${WHATSAPP_NUMBER}`,
        areaServed: { "@type": "Country", name: "IL" },
        availableLanguage: "he",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: "he-IL",
        publisher: { "@id": `${SITE_URL}/#studio` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // The content is built here from constants, not from anything a visitor
      // can reach, so there is no untrusted string in it.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
