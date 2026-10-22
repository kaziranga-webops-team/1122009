# Kaziranga House

Official website of **Kaziranga House** — a student community at the IIT Madras BS Degree programme.

Built with **Next.js (App Router)**, **React 19**, **Tailwind CSS v4**, GSAP / Framer Motion / Lenis for motion, and Firebase for the gallery "likes" feature. Content is sourced from Google Sheets, proxied through the app's own API routes.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

## Project structure

```
app/
  layout.tsx          Root layout: site metadata, providers
  providers.tsx       Client providers (React Query, Lenis, Tooltip, Navbar, Toaster)
  template.tsx        Per-navigation page transition
  page.tsx            Home, plus /council /events /gallery /study /tak routes
  api/                Server route handlers (the "backend")
    events | episodes | gallery | council | meetups   Google Sheets proxies (cached)
    hero-photos                                        Sample hero photos (shuffled)
components/           UI + sections (page views live in components/pages)
hooks/  lib/  registry/
public/               Static assets (incl. images/hero sample photos, data/content.json)
```

## Data / backend

- Google Sheets are fetched **server-side** in `app/api/*` route handlers (`lib/sheets.ts`),
  parsed with PapaParse, and cached for 5 minutes. The client (`lib/api.ts`) only ever
  calls `/api/*` — sheet URLs never reach the browser.
- Static site content lives in `public/data/content.json`.
- Sheet URLs and Firebase config can be overridden with env vars — see `.env.example`.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel — it auto-detects Next.js (no config needed).
3. Optionally set the env vars from `.env.example` in the Vercel project settings.
4. Deploy.
