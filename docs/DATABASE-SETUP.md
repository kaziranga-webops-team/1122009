# Database setup — step by step

The plan: **Firebase Auth** keeps identity and the event portal, **Supabase
Postgres** takes the public content now living in Google Sheets, **Cloudinary**
takes images. Nothing about the portal (users, roles, registrations) moves.

This file is the part **you** do — accounts, keys and data. The code that reads
from Postgres is noted at the end as the part I do after.

---

## 1. Create the Supabase project

1. Sign up at <https://supabase.com> and create a new project.
2. **Region: Mumbai (`ap-south-1`)** — or Singapore. Pick the closest to your
   members; every content read crosses this distance.
3. Save the database password it gives you somewhere safe. You will not need it
   for the app (the app uses API keys), but you cannot retrieve it later.

A free project **pauses after about a week with no requests**. A live site
revalidating every five minutes never goes quiet, but a staging project will —
it is not broken, just asleep, and the dashboard wakes it.

## 2. Create the tables

In the Supabase dashboard open **SQL Editor → New query**, paste the whole of
[`supabase/migrations/0001_content.sql`](../supabase/migrations/0001_content.sql),
and run it.

That creates seven tables — `episodes`, `events`, `gallery_items`, `meetups`,
`council_members`, `study_links`, `revision_sessions` — and, importantly, turns
on row level security with a read-only policy on each.

Check it worked: **Table Editor** should list all seven, and each should show a
green "RLS enabled" badge. If any table says RLS is disabled, stop and re-run —
an unprotected table plus a leaked anon key means anyone can rewrite your
content.

## 3. Copy the keys

**Project Settings → API**. You need two values:

| Value | Goes in | Secret |
| --- | --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | No |
| `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` | **Yes** |

Put both in `.env.local` (see `.env.example`). You do **not** need the `anon`
key — in this design the browser never talks to Supabase; every read goes
through a cached route handler on the server.

> The `service_role` key bypasses every row-level policy. It must never get a
> `NEXT_PUBLIC_` prefix — that prefix tells Next.js to inline the value into the
> JavaScript bundle, which would hand every visitor full write access.

## 4. Create the Cloudinary account

1. Sign up at <https://cloudinary.com> (free tier is enough).
2. From the dashboard take the **cloud name**, **API key** and **API secret**.
3. Add them to `.env.local` as `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`,
   `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Only the cloud name is public — it appears in every image URL. The key and
secret sign uploads server-side.

## 5. Export the sheets

For each tab of the published spreadsheet: **File → Download → CSV**. You need
six, plus two from Mayank's branch that are not on the live site yet:

| Tab | Becomes |
| --- | --- |
| Episodes (gid 0) | `episodes` |
| Events (gid 311257018) | `events` |
| Arohan (gid 842204102) | `events` — merged in, with a `category` |
| Gallery (gid 660048919) | `gallery_items` |
| Council (gid 1429305251) | `council_members` |
| Meetups (gid 177547042) | `meetups` |
| Study links (gid 672798623) | `study_links` |
| Revision sessions (gid 599638333) | `revision_sessions` |

Put the CSVs somewhere I can reach — a `data/` folder in the repo root is fine;
it is gitignored by the step below.

**Do not delete or unpublish the spreadsheet.** It is the rollback, and it stays
live until the Postgres path has served production for a week.

## 6. Add the keys to Vercel

**Project → Settings → Environment Variables.** Everything in `.env.local` that
the site needs at runtime has to exist here too, or production falls back to
mock mode and empty content:

- all `NEXT_PUBLIC_FIREBASE_*`
- `FIREBASE_SERVICE_ACCOUNT_KEY` *(still outstanding — six portal API routes
  are dead without it)*
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

---

## What I do next

Once steps 1–5 are done, the remaining work is code:

1. **An importer** that reads each CSV and writes rows — merging the Arohan tab
   into `events` with a category, normalising `status` to the four values the UI
   already understands, and parsing dates into `starts_at` while keeping the
   sheet's original string in `date_text`.
2. **`lib/content.ts`** — the same shape as today's `lib/sheets.ts`, reading
   Postgres instead of parsing CSV. The `/api/*` routes and every page component
   stay exactly as they are; that one seam is what makes this safe.
3. **Cloudinary uploads** — a signed upload endpoint, so council photos stop
   being pasted Google Drive links.
4. **Run both paths side by side** and compare before the sheets are retired.

## The one thing that must not break

The gallery's like counts live in the Firebase Realtime Database under a key
built from the photo's `Student` and `Timestamp` values. Those two columns must
survive the import byte for byte — `gallery_items.student` and
`gallery_items.timestamp_raw`. Change either and every like count orphans and
silently resets to zero.

After importing, check a handful of photos against the live site before you
consider the gallery migrated.
