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
  async headers() {
    return [
      {
        source: "/frames/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
