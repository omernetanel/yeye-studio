import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // The paper's frame sequences — over a thousand small files between the two
  // layouts. Left at the default (max-age=0, must-revalidate) every visit after
  // the first would send one revalidation request per frame before the section
  // could move. These never change in place: a re-export goes to a new version
  // folder (v1 → v2) and the code points at it, so a year and `immutable` is
  // safe, and the browser serves them from disk without asking.
  // The contact page is gone: every way to get in touch is the form at the end
  // of the home page. Old links and search results land on it instead of a 404.
  async redirects() {
    return [{ source: "/contact", destination: "/#cta", permanent: true }];
  },

  async headers() {
    return [
      {
        source: "/frames/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Everything the site serves. These are the cheap protections that
        // cost nothing to keep and are only noticed when they are missing.
        source: "/:path*",
        headers: [
          // Two years, subdomains included, and eligible for the preload list:
          // once a browser has seen this it will not try the site over plain
          // HTTP again. Vercel serves HTTPS only, so nothing here can be
          // locked out by it.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // A file this site serves is the type it says it is. Without this a
          // browser may sniff, which is how an uploaded "image" becomes a
          // script.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // The full URL goes to this site, only the origin goes anywhere
          // else, and nothing at all goes from HTTPS to HTTP.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The site asks for none of these, so nothing embedded in it can
          // ask either.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          // Clickjacking, for browsers that predate frame-ancestors.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // CSP IN REPORT-ONLY, ON PURPOSE. This page is a WebGL simulation, a
          // canvas, inline styles from Tailwind and a live iframe of client
          // sites; a policy written blind would break one of them the day it
          // shipped. Violations are reported to the console while the whole
          // site is walked through, and only then is this turned into an
          // enforced Content-Security-Policy.
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'self'",
              // Next injects its own inline bootstrap, and the dev server
              // needs eval; both are why this is reported before it is worn.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "media-src 'self' blob:",
              "font-src 'self'",
              "worker-src 'self' blob:",
              // The form posts to this site's own route; the mail service is
              // called from the server, never from the browser.
              "connect-src 'self'",
              // The project pages show the live client sites themselves.
              "frame-src https:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
