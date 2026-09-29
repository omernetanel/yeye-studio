import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, pageTitle } from "@/lib/site";
import Navbar from "@/components/layout/Navbar";
import SubPageNav from "@/components/layout/SubPageNav";
import Footer from "@/components/layout/Footer";
import AboutPageContent from "@/components/about/AboutPageContent";

const DESCRIPTION = `עומר, מעצב ומפתח אתרים ומי שעומד מאחורי ${SITE_NAME}. איך זה התחיל, למה YEYE, ומה אני עושה.`;

export const metadata: Metadata = {
  title: pageTitle("מי אני"),
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
};

// Tells a search engine who the page is about and whose studio it is. Static,
// and built from constants only - nothing a visitor can put into it.
const PERSON = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "עומר",
  jobTitle: "מעצב ומפתח אתרים",
  url: `${SITE_URL}/about`,
  image: `${SITE_URL}/images/portrait.webp`,
  worksFor: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
};

export default function AboutPage() {
  return (
    // Black, like the homepage's "who I am": data-nav-dark turns the logo and
    // the phone's browser chrome to match.
    <main id="main" data-nav-dark="true" className="min-h-screen bg-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON) }} />
      <Navbar />
      <SubPageNav dark />
      <AboutPageContent />
      <Footer />
    </main>
  );
}
