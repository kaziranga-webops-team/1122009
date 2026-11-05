# Event Portal — setup

The Kazi-Event-Management system now lives inside this Next.js site. This file
covers the steps that can only be done from the Firebase console / your machine.

## Route map

| Area | Route | Auth |
| --- | --- | --- |
| Public site | `/`, `/events`, `/gallery`, `/council`, `/study`, `/tak` | none |
| Sign in | `/login`, `/access-denied` | none |
| Student portal | `/dashboard`, `/dashboard/events`, `/dashboard/events/[id]`, `/dashboard/events/[id]/subevents/[subEventId]`, `/dashboard/my-registrations`, `/dashboard/notifications`, `/dashboard/profile` | signed in |
| Admin | `/admin/dashboard`, `/admin/events`, `/admin/events/new`, `/admin/events/[id]/edit`, `/admin/registrations` | `ADMIN` / `SUPER_ADMIN` |
| Super admin | `/super-admin/dashboard`, `/super-admin/allowed-users`, `/super-admin/roles`, `/super-admin/audit-logs`, `/super-admin/historical-users` | `SUPER_ADMIN` |
| Team invites | `/team-invitation/[id]` | signed in |

`/my-registrations`, `/notifications` and `/profile` are redirects into `/dashboard/*`.

**Note on `/events`:** this is the *public*, Google-Sheets-backed events page that
already existed on the site. The portal's event pages live under `/dashboard/events`.
All portal links and notification `linkUrl`s point at `/dashboard/events/...`.

## Two Firebase projects

| Project | Used for | Configured by |
| --- | --- | --- |
| `kazi-671e6` (portal) | Google sign-in, Cloud Firestore | `NEXT_PUBLIC_FIREBASE_*` in `.env.local` |
| `kaziranga-now` (legacy) | `/gallery` like counts in Realtime Database | defaults in `lib/firebase.ts`, overridable via `NEXT_PUBLIC_LEGACY_RTDB_*` |

`lib/firebase.ts` initialises the portal project as the default app and the legacy
project as a second named app (`kaziranga-legacy-rtdb`) purely for RTDB. If you ever
move the likes data into the portal project, set `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
and the legacy app stops being created.

## Still to do

### 1. Firebase Admin service account (REQUIRED)

Without it `adminDb`/`adminAuth` are `null` and these routes are inert:
`/api/seed`, `/api/auth/allowed-check`, `/api/auth/request-access`,
`/api/admin/export-csv`, `/api/super-admin/users/role`, `/api/team/invite`.
That means no CSV export, no role changes, no team invitations, no access requests.

Firebase console -> Project settings -> Service accounts -> **Generate new private key**.
Then add to `.env.local` (and to Vercel -> Settings -> Environment Variables):

    FIREBASE_SERVICE_ACCOUNT_KEY=<the whole JSON on one line, or base64 of it>

### 2. Enable Google sign-in

Firebase console -> Authentication -> Sign-in method -> enable **Google**.

Authentication -> Settings -> Authorized domains -> add `localhost` and your
production domain (e.g. `kaziranga-house.vercel.app`).

### 3. Create the Firestore database

Firebase console -> Firestore Database -> Create database (production mode).

### 4. Deploy rules and indexes

    npm run firebase:deploy-rules

Requires `npm i -g firebase-tools` and `firebase login`. `.firebaserc` already points
at `kazi-671e6`. The collection-group indexes in `firestore.indexes.json` are needed —
`/dashboard`, `/admin/registrations` and `/super-admin/historical-users` query
`registrations` and `events` as collection groups and will error without them.

### 5. Seed the initial roster

With the service account key in place and the dev server running:

    curl -X POST http://localhost:3000/api/seed

This writes `allowedUsers` and a bootstrap audit log. The two emails in
`INITIAL_SUPER_ADMIN_EMAILS` (`lib/portal/firebase/mockData.ts`) bypass the allow-list
and become `SUPER_ADMIN` on first sign-in. Edit that list before seeding if the
super admins have changed.

### 6. Vercel environment variables

Every `NEXT_PUBLIC_FIREBASE_*` value plus `FIREBASE_SERVICE_ACCOUNT_KEY` must be set
in Vercel. `lib/firebase.ts` has **no** hardcoded fallback for the portal project — if
the vars are missing in production the portal silently drops into mock mode.

## Optional

- `NEXT_PUBLIC_USE_MOCK_FIREBASE=true` runs the whole portal on in-memory mock data
  with seeded users and a role switcher — useful for UI work without Firebase.
- `npm run migrate:firestore -- --dry-run` / `npm run verify:firestore-migration`
  port data from a flat layout into the `tenures/mainEvents/events` hierarchy.
  Only needed if you have existing data from the standalone app.

## Known pre-existing issue

`components/BackgroundAudio.tsx` requests `/nature-ambience.mp3`, which is not in
`public/`. It 404s on every public page. Unrelated to the portal.
