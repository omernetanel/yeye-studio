import localFont from "next/font/local";

// WOFF2, and file names with no commas in them. The fonts were the downloads'
// own .ttf files: more than twice the size on the wire, and the commas in
// "GRAD,opsz,wght" made the preload and the stylesheet spell the address two
// ways, so the main face was fetched twice on every visit. The italic is gone
// too - nothing on the site is set in it, and it was preloaded all the same.
export const googleSans = localFont({
  src: "../public/fonts/GoogleSans-Variable.woff2",
  variable: "--font-google-sans",
  display: "swap",
});

export const assistant = localFont({
  src: "../public/fonts/Assistant-Variable.woff2",
  variable: "--font-assistant",
  display: "swap",
});
