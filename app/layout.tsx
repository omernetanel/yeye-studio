import type { Metadata, Viewport } from "next";
import "./globals.css";
import { googleSans, assistant } from "@/lib/fonts";
import { SITE_NAME, SITE_TITLE, SITE_DESCRIPTION } from "@/lib/site";
import { SmoothScrollProvider } from "@/lib/motion/lenis";

// TODO: replace with the real production domain before launch (also used in app/sitemap.ts and app/robots.ts).
const BASE_URL = "https://yeyelabs.com";

/**
 * The phone's own chrome, tinted from the page.
 *
 * On a phone the browser paints the strip behind the clock and battery and the
 * bar at the bottom in whichever colour the page declares here, and with
 * nothing declared it falls back to the document's background — which on this
 * site is #0a0a0a. That is why the site sat inside two black margins on a
 * screen that is white from the first pixel to the last.
 *
 * White, flatly, rather than tracking the section under the reader: the page
 * opens white and closes white, and a bar that changed colour halfway down
 * would draw more attention than the one it replaced.
 *
 * viewport-fit=cover is what lets the page reach under those bars in the first
 * place — without it iOS letterboxes the whole document inside the safe area
 * and the tint has nothing to do.
 */
export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
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
      </body>
    </html>
  );
}
