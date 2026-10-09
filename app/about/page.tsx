import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, pageMetadata } from "@/lib/site";
import Navbar from "@/components/layout/Navbar";
import SubPageNav from "@/components/layout/SubPageNav";
import Footer from "@/components/layout/Footer";
import AboutPageContent from "@/components/about/AboutPageContent";
import { FOUNDER_ID, JsonLd, STUDIO_ID } from "@/components/seo/StructuredData";

const DESCRIPTION = "נעים מאוד, אני עומר: מעצב ובונה אתרים מאפס לעסקים. איך זה התחיל, ולמה YEYE.";

export const metadata: Metadata = pageMetadata({ label: "מי אני", description: DESCRIPTION, path: "/about" });

// Tells a search engine who the page is about and whose studio it is. Static,
// and built from constants only - nothing a visitor can put into it.
const PERSON = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": FOUNDER_ID,
  name: "עומר",
  jobTitle: "מעצב ומפתח אתרים",
  url: `${SITE_URL}/about`,
  image: `${SITE_URL}/images/portrait.webp`,
  // The same node the homepage declares, so the two read as one studio.
  worksFor: { "@type": "ProfessionalService", "@id": STUDIO_ID, name: SITE_NAME, url: SITE_URL },
};

export default function AboutPage() {
  return (
    <main id="main" className="min-h-screen bg-white">
      <JsonLd data={PERSON} />
      <Navbar />
      <SubPageNav bare />
      <AboutPageContent />
      <Footer light />
    </main>
  );
}
