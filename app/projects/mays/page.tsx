import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import SubPageNav from "@/components/layout/SubPageNav";
import Footer from "@/components/layout/Footer";
import MaysCase from "@/components/projects/MaysCase";
import { pageMetadata } from "@/lib/site";

const meta = pageMetadata({
  label: "MAY'S",
  description: "מיתוג מלא לקונדיטוריה: לוגו, סלוגן, תפריט, כרטיסי ביקור ומדבקות.",
  path: "/projects/mays",
});
// The brand's own picture on its share card, instead of the wordmark.
const images = ["/images/projects/mays/mays3.webp"];

export const metadata: Metadata = {
  ...meta,
  openGraph: { ...meta.openGraph, images },
  twitter: { ...meta.twitter, images },
};

/**
 * A page of its own, beside /projects/[slug] and not through it: the sites
 * there share one layout built round a live preview, and a brand has no site
 * to preview. See MaysCase.
 */
export default function MaysPage() {
  return (
    <main id="main" className="relative min-h-screen bg-white">
      <Navbar />
      {/* No bar: the page is black from the very top. */}
      <SubPageNav bare />
      <MaysCase />
      {/* The dark footer: the page closes on black. */}
      <div className="bg-black">
        <Footer />
      </div>
    </main>
  );
}
