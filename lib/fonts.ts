import localFont from "next/font/local";

export const googleSans = localFont({
  src: [
    {
      path: "../public/fonts/GoogleSans-VariableFont_GRAD,opsz,wght.ttf",
      style: "normal",
    },
    {
      path: "../public/fonts/GoogleSans-Italic-VariableFont_GRAD,opsz,wght.ttf",
      style: "italic",
    },
  ],
  variable: "--font-google-sans",
  display: "swap",
});

export const assistant = localFont({
  src: "../public/fonts/Assistant-VariableFont_wght.ttf",
  variable: "--font-assistant",
  display: "swap",
});
