import type { Metadata } from "next";
import "./globals.css";
import { googleSans, assistant } from "@/lib/fonts";
import { SmoothScrollProvider } from "@/lib/motion/lenis";
import StickyMobileCTA from "@/components/layout/StickyMobileCTA";

// TODO: replace with the real production domain before launch (also used in app/sitemap.ts and app/robots.ts).
const BASE_URL = "https://yeyelabs.com";
const SITE_TITLE = "YEYE LABS | סטודיו דיגיטלי פרמיום";
const SITE_DESCRIPTION = "אנחנו בונים אתרים ומערכות שמייצרות לקוחות לעסקים.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: "YEYE LABS",
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${googleSans.variable} ${assistant.variable}`}>
      <body className="bg-background font-body text-white">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
        <StickyMobileCTA />
      </body>
    </html>
  );
}
