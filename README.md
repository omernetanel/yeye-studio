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

The contact forms send through Resend from the server. They need one
environment variable, `RESEND_API_KEY` - in Vercel for the live site, and in a
local `.env.local` to send from `npm run dev` (see `app/api/contact/route.ts`).
The sender (`forms@yeye.co.il`) and the inbox (`info@yeye.co.il`) are in
`lib/site.ts`; the domain must be verified in Resend for either to work.

## Scripts

- `npm run dev` — local dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint
