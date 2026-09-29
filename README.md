# YEYE Digital

The site of YEYE Digital, a one-person digital studio: Hebrew, right to left,
a cinematic scroll experience built with Next.js (App Router), TypeScript,
Tailwind, Framer Motion, Lenis and raw WebGL.

See `CLAUDE.md` for the build rules and conventions, and `CONTEXT.md` for the
current state of every section and why it is built the way it is.

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
