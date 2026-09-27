import type { NextConfig } from "next";

// The dev server compiles with eval; the served build does not. See the policy
// below, which is the only place this is used.
const isDev = process.env.NODE_ENV !== "production";

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
          // ENFORCED, after the whole site was walked under the same policy in
          // report-only and reported nothing: the home page end to end with the
          // ink simulation and the paper sequence, and a project page with a
          // client's site loaded live in its frame. This page is a WebGL
          // simulation, a canvas, inline styles from Tailwind and that live
          // iframe, so the policy was measured against all four before it was
          // worn rather than written from a template.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'self'",
              // 'unsafe-inline' stays: Next injects its own bootstrap script,
              // and the layout carries the one that applies the reader's
              // accessibility settings before the first paint. 'unsafe-eval' is
              // the dev server's requirement alone and is dropped from the
              // build that is actually served.
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
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
