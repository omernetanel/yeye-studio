import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        primary: "#4F6EF7",
        accent: "#7B5CF0",
        "card-bg": "#111111",
        "card-border": "#1e1e1e",
        muted: "#888888",
      },
      fontFamily: {
        heebo: ["var(--font-heebo)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        "hero": ["72px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "hero-md": ["56px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "section-title": ["44px", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "card-title": ["26px", { lineHeight: "1.3" }],
      },
    },
  },
  plugins: [],
};
export default config;
