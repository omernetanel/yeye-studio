import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YEYE Studio | סטודיו דיגיטלי פרמיום",
  description: "אנחנו בונים אתרים ומערכות שמייצרות לקוחות לעסקים.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
      </head>
      <body style={{ fontFamily: "'Assistant', Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
