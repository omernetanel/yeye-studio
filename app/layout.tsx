import type { Metadata, Viewport } from "next";
import "./globals.css";
import { googleSans, assistant } from "@/lib/fonts";
import { SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, SITE_BACKGROUND, SITE_URL } from "@/lib/site";
import { SmoothScrollProvider } from "@/lib/motion/lenis";
import MediaGuard from "@/components/layout/MediaGuard";
import CalmMotion from "@/components/layout/CalmMotion";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import AccessibilityMenu from "@/components/layout/AccessibilityMenu";
import { A11Y_STORAGE_KEY } from "@/lib/a11y/storage-key";


/**
 * The phone's own chrome, tinted from the page.
 *
 * On a phone the browser paints the strip behind the clock and battery and the
 * bar at the bottom in whichever colour the page declares here, and with
 * nothing declared it falls back to the document's background — which on this
 * site is #0a0a0a. That is why the site sat inside two black margins on a
 * screen that is white from the first pixel to the last.
 *
 * White here, as the page's starting point. On a phone the bars do change once
 * on the way down: from "who I am" reaching the top of the screen to the work
 * reaching it, they go black - see the edge strips in components/layout/
 * Navbar.tsx. Safari 26 ignores this tag altogether and reads those strips;
 * the tag is for every other browser.
 *
 * viewport-fit=cover is what lets the page reach under those bars in the first
 * place — without it iOS letterboxes the whole document inside the safe area
 * and the tint has nothing to do.
 *
 * DECLARED TWICE, ONCE PER SCHEME, AND THAT IS THE WHOLE FIX. A single
 * theme-color with no media query looks like it covers both cases and does not:
 * a browser running in dark mode treats one bare colour as "the light-mode
 * colour", finds nothing declared for the scheme it is actually in, and paints
 * its own dark chrome instead. That is why a white page still sat between two
 * black bars on a phone whose browser was in night mode. Naming white for the
 * dark scheme as well is what makes it stop guessing.
 *
 * `color-scheme: light` in globals.css is the other half: it tells the engine
 * this page has no dark rendering, so the browser's force-dark pass leaves the
 * content alone rather than inverting a site that is white by design.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: SITE_BACKGROUND },
    { media: "(prefers-color-scheme: dark)", color: SITE_BACKGROUND },
  ],
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  // The address each page would rather be indexed at. Declared here as the
  // homepage and overridden by every page below it, so a visit that arrives
  // with a tracking parameter on the end, or over www, still points a search
  // engine at one address instead of at as many addresses as there are links.
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    // The card is the 1200×630 wordmark in app/opengraph-image.tsx, which Next
    // attaches on its own; "summary" would crop it into a small square.
    card: "summary_large_image",
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
    <html
      lang="he"
      dir="rtl"
      className={`${googleSans.variable} ${assistant.variable}`}
      // The surface, handed to CSS from the same constant the theme-color above
      // is built from. Inline rather than declared in @theme so there is exactly
      // one value: see SITE_BACKGROUND.
      style={{ "--color-background": SITE_BACKGROUND } as React.CSSProperties}
      // The reader's switches (below) are written onto this element before
      // React hydrates it, on purpose; without this, React reports the
      // attributes it did not render as a mismatch.
      suppressHydrationWarning
    >
      {/* No bg/text utilities here on purpose: they would win over the html,body
          rule in globals.css, which is the one place the document's own surface
          is decided — and that surface is what a phone reads when it picks a
          colour for its bars. See the comment on that rule. */}
      <body className="font-body">
        {/* The way past the chrome for anyone arriving on the keyboard. Hidden
            until it is focused, which is the first tab stop on every page. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[100] focus:rounded-full focus:bg-black focus:px-5 focus:py-3 focus:font-body focus:text-[15px] focus:text-white"
        >
          דילוג לתוכן הראשי
        </a>
        {/* THE READER'S SWITCHES, SET BEFORE THE FIRST PAINT. Read from the
            browser's own storage and written onto <html> here, so a visitor who
            asked for more contrast last time does not watch the page arrive in
            its default form and change under them. Kept to one statement, with
            its own try/catch, because storage throws in a private window. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=JSON.parse(localStorage.getItem('${A11Y_STORAGE_KEY}')||'{}');var r=document.documentElement;if(p.contrast)r.setAttribute('data-a11y-contrast','');if(p.motion)r.setAttribute('data-a11y-motion','');if(p.links)r.setAttribute('data-a11y-links','');}catch(e){}`,
          }}
        />
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
        <MediaGuard />
        <CalmMotion />
        {/* Once, for every page: the footer no longer carries a way to WhatsApp,
            so the sub-pages need this as much as the homepage does. */}
        <WhatsAppButton />
        <AccessibilityMenu />
      </body>
    </html>
  );
}
