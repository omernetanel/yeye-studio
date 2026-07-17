import type { Metadata } from "next";
import "./globals.css";
import { googleSans, assistant } from "@/lib/fonts";
import { SmoothScrollProvider } from "@/lib/motion/lenis";
import StickyMobileCTA from "@/components/layout/StickyMobileCTA";

export const metadata: Metadata = {
  title: "YEYE LABS | סטודיו דיגיטלי פרמיום",
  description: "אנחנו בונים אתרים ומערכות שמייצרות לקוחות לעסקים.",
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
