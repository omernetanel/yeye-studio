import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import SubPageNav from "@/components/layout/SubPageNav";
import Footer from "@/components/layout/Footer";
import SorozinCase from "@/components/projects/SorozinCase";
import { projects } from "@/lib/projects";
import { pageMetadata } from "@/lib/site";

const meta = pageMetadata({
  label: "Sorozin Chef",
  description: "מיתוג מחדש לשף בשרים: לוגו, תפריטים, כרטיסי ביקור ודף נחיתה.",
  path: "/projects/sorozin-chef",
});
// The brand's own picture on its share card, instead of the wordmark.
const images = ["/images/projects/sorozin/sorozin4.webp"];

export const metadata: Metadata = {
  ...meta,
  openGraph: { ...meta.openGraph, images },
  twitter: { ...meta.twitter, images },
};

/**
 * A page of its own, beside /projects/[slug] and not through it, like the one
 * for MAY'S: it is the brand's page, and the landing page - which is all the
 * [slug] layout would have shown - is one part of it. See SorozinCase.
 */
export default function SorozinPage() {
  // The landing page's address is kept in one place, with the other sites.
  const site = projects.find((project) => project.slug === "sorozin-chef");
  if (!site) notFound();

  return (
    <main id="main" className="relative min-h-screen bg-white">
      <Navbar />
      {/* No bar: the page is black from the very top. */}
      <SubPageNav bare />
      <SorozinCase site={{ url: site.url, image: site.image }} />
      {/* The dark footer: the page closes on black. */}
      <div className="bg-black">
        <Footer />
      </div>
    </main>
  );
}
