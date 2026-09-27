import type { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import SubPageNav from "@/components/layout/SubPageNav";
import Footer from "@/components/layout/Footer";

/**
 * The shell the three plain-text pages share — privacy, accessibility, terms.
 *
 * They are documents, not compositions: one column, one measure, no motion and
 * nothing floating. What makes them feel like the rest of the site is the type
 * and the white, not an effect.
 */
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  /** The date this text last changed, as it should read on the page. */
  updated: string;
  children: ReactNode;
}) {
  return (
    <main id="main" className="min-h-screen bg-white">
      <Navbar />
      <SubPageNav />

      <article className="mx-auto max-w-[760px] px-6 pt-[160px] pb-24">
        <h1 className="font-display text-[clamp(34px,5vw,52px)] leading-[1.1] font-extrabold tracking-tight text-black">
          {title}
        </h1>
        <p className="mt-3 font-body text-[14px] text-black/60">עודכן: {updated}</p>

        {/* The document's own rhythm, declared once: headings, paragraphs and
            lists all spaced from here rather than class by class down the page. */}
        <div className="mt-12 flex flex-col gap-8 font-body text-[17px] leading-[1.9] text-black/70 [&_a]:underline [&_a]:underline-offset-4 [&_a]:text-black [&_h2]:font-display [&_h2]:text-[24px] [&_h2]:leading-[1.3] [&_h2]:font-bold [&_h2]:text-black [&_li]:mt-2 [&_p+h2]:mt-4 [&_ul]:list-disc [&_ul]:ps-5">
          {children}
        </div>
      </article>

      <Footer light />
    </main>
  );
}
