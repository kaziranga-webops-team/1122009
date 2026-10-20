# Kaziranga NOW

A community hub for Kaziranga House — IITM BS in Data Science program. Features Kaziranga Tak reel links, events, blogs, and study materials, all powered by a single editable JSON file.

## Run & Operate

- `pnpm --filter @workspace/kaziranga-now run dev` — run the frontend (port auto-assigned 
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, shadcn/ui, framer-motion, wouter, TanStack Query
- Data: Single JSON file at `artifacts/kaziranga-now/public/data/content.json`
- Icons: lucide-react + react-icons/si (Instagram, GitHub)

## Where things live

- `artifacts/kaziranga-now/` — the main web app
- `artifacts/kaziranga-now/public/data/content.json` — **ALL content lives here in one file**
- `artifacts/kaziranga-now/src/hooks/useData.ts` — `useContent()` hook (TanStack Query)
- `artifacts/kaziranga-now/src/components/RhinoWaterScene.tsx` — decorative SVG rhino/water scene

## Architecture decisions

- **Single JSON CMS**: All content is in one `content.json` file. Editors update it via GitHub and the site reflects changes automatically — no admin panel or database needed.
- **No backend**: Fully static frontend. No API server or database.
- **TanStack Query**: Used for `useContent()` — automatically deduplicates the single JSON fetch across all components.
- **Framer-motion**: Scroll-triggered animations throughout.
- **Nature/Rhino theme**: Forest greens, teal, earthy amber palette inspired by Kaziranga National Park.
- **Rhino horn cursor**: Custom SVG cursor styled as a rhino horn.
- **RhinoWaterScene**: Pure SVG decorative scene — rhinos standing in water with reflection, forest treeline, and mist.

## Product

The site has 6 sections:
1. **Hero** — site name, tagline, rhino icon, "Explore the Forest" CTA, rhino water scene visual
2. **Kaziranga Tak** — link to latest Instagram reel
3. **Events** — tabs for Upcoming / Ongoing / Completed, with participants and winners for completed events
4. **Blogs** — card grid with expandable full-post modal
5. **Study Portal** — link to IITM portal + Foundation/Diploma study materials by level
6. **Footer** — Instagram and GitHub icons + decorative rhino silhouette

## How to add content (edit content.json on GitHub)

The entire `content.json` is structured as:
```
{
  "site": { name, tagline, description, instagram, github, footerNote, program, house },
  "hero": { title, subtitle, ctaText, image },
  "tak": { sectionTitle, sectionSubtitle, sectionImage, reels: [...] },
  "events": { sectionTitle, sectionSubtitle, sectionImage, events: [...] },
  "blogs": { sectionTitle, sectionSubtitle, sectionImage, posts: [...] },
  "study": { sectionTitle, sectionSubtitle, sectionImage, studyPortalUrl, groups: [...] }
}
```

### Adding section images
Set `"sectionImage": "https://your-image-url.com/photo.jpg"` in any section to show a banner image at the top of that section. Leave as `""` to use the default decorative styling.

### Add a new reel
Add to `tak.reels[]`:
```json
{ "id": "reel-2", "title": "Episode Title", "url": "https://instagram.com/reel/...", "thumbnail": "", "date": "2026-05-10", "description": "Episode description" }
```

### Add an event
Add to `events.events[]`:
```json
{ "id": "evt-5", "title": "Event Name", "status": "upcoming", "date": "2026-06-01", "description": "What is it?", "participants": [], "winners": [] }
```
Set `"status"` to `"upcoming"`, `"ongoing"`, or `"completed"`. Completed events show participants and winners.

### Add a blog post
Add to `blogs.posts[]`:
```json
{ "id": "blog-4", "title": "Post Title", "author": "Your Name", "date": "2026-05-10", "category": "Meetup", "excerpt": "Short preview...", "content": "Full post text goes here.", "tags": ["tag1", "tag2"] }
```

### Add a study material
Find the right group + level + subject in `study.groups[].levels[].subjects[]`, then add to its `materials[]`:
```json
{ "id": "mat-new-1", "title": "Material Name", "type": "pdf", "url": "https://drive.google.com/...", "uploadedBy": "Your Name", "date": "2026-05-10" }
```
Use `"type": "pdf"` for downloads or `"type": "link"` for web links.

## User preferences

- Content should be editable via GitHub by modifying a single JSON file (no admin UI needed)
- Theme: rhinos, green, water, misty islands (Kaziranga National Park aesthetic)
- Must be mobile responsive
- Rhino horn custom cursor
- Rhino/water/forest visual scene in hero

## Gotchas

- The fetch path `/data/content.json` is served from the `public/` folder.
- When deploying, the JSON file in `public/data/` is included in the static build automatically.
- The cursor SVG is embedded inline in `index.css` as a data URI.
