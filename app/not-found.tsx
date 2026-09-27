import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { pageTitle } from "@/lib/site";

/**
 * A wrong address, in Hebrew, with a way out of it.
 *
 * Until now there was none, so a mistyped URL landed on Next's own English
 * default — left-to-right, black on white, with the framework's name on it.
 * This is the site's own page: the nav still works, the footer still carries
 * the legal row, and the reader is offered the two places they were most
 * likely heading for.
 *
 * Deliberately still: no ink, no pinning, nothing to scroll. Someone who is
 * lost wants the way back, not a composition.
 */
export const metadata: Metadata = {
  title: pageTitle("הדף לא נמצא"),
  // A wrong address is not something to index.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-[160px] pb-24 text-center">
        <p className="font-display text-[clamp(72px,16vw,160px)] leading-[0.9] font-extrabold tracking-tight text-black/10">
          404
        </p>
        <h1 className="mt-2 font-display text-[clamp(28px,5vw,46px)] leading-[1.15] font-extrabold tracking-tight text-black">
          הדף הזה לא קיים
        </h1>
        <p className="mt-4 max-w-[420px] font-body text-[17px] leading-[1.8] text-black/70">
          כנראה שהכתובת השתנתה, או שיש שם טעות קטנה. אפשר לחזור לעמוד הבית או לראות את העבודות.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Button href="/" className="!border-black !bg-none !bg-black !text-white !shadow-none">
            לעמוד הבית
          </Button>
          <Link
            href="/projects"
            className="font-body text-[16px] text-black/70 underline underline-offset-4 transition-colors hover:text-black"
          >
            העבודות שלי
          </Link>
        </div>
      </div>

      <Footer light />
    </main>
  );
}
