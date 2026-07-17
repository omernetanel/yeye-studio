# YEYE LABS

Marketing site for YEYE LABS — a cinematic, scroll-driven Next.js site built
with React Three Fiber, GSAP ScrollTrigger, Framer Motion, and Lenis.

See `CLAUDE.md` for the full build spec, tech-stack rules, and the design-
token/quality conventions this project follows.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Before the contact form can send real emails, set the EmailJS environment
variables from `.env.example` in a local `.env.local` (see `app/api/contact/route.ts`).

## Scripts

- `npm run dev` — local dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint
