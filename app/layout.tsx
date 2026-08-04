import type { Metadata } from "next";
import "./globals.css";
import { googleSans, assistant } from "@/lib/fonts";
import { SITE_NAME, SITE_TITLE, SITE_DESCRIPTION } from "@/lib/site";
import { SmoothScrollProvider } from "@/lib/motion/lenis";

// TODO: replace with the real production domain before launch (also used in app/sitemap.ts and app/robots.ts).
const BASE_URL = "https://yeyelabs.com";

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
