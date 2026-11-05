-- ════════════════════════════════════════════════════════════════════
--  Kaziranga House — public content schema
--
--  These seven tables replace the published Google Sheet. Everything here
--  is PUBLIC, READ-ONLY content: no user data, no registrations, nothing
--  tied to a person. Identity and the event portal stay in Firebase.
--
--  Writes happen only through the service-role key from a Next.js route
--  handler. That is why every table below enables row level security and
--  grants SELECT and nothing else — the service role bypasses RLS, and
--  anyone holding only the anon key can read but never change a row.
--
--  Run this once in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════

-- Keeps updated_at honest so the content API can cache against it.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Kaziranga Tak episodes ─────────────────────────────────────────
create table if not exists public.episodes (
  id            uuid primary key default gen_random_uuid(),
  episode_no    text not null default '',
  title         text not null default '',
  date_text     text not null default '',
  host          text not null default '',
  image_url     text not null default '',
  instagram_url text not null default '',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Events (the main sheet and the Arohan tab, merged at import) ────
create table if not exists public.events (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null default '',
  category            text not null default '',
  -- Matches the four values the UI already understands.
  status              text not null default 'upcoming'
                      check (status in ('upcoming', 'live-now', 'past-recorded', 'past-unrecorded')),
  -- date_text keeps the sheet's own string so nothing is lost to a failed
  -- parse; starts_at is what you sort and filter on, and may be null.
  date_text           text not null default '',
  starts_at           timestamptz,
  description         text not null default '',
  speaker             text not null default '',
  image_url           text not null default '',
  youtube_url         text not null default '',
  meet_link           text not null default '',
  winner              text not null default '',
  runner_up_1         text not null default '',
  runner_up_2         text not null default '',
  honourable_mentions text not null default '',
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists events_status_starts_at_idx
  on public.events (status, starts_at desc nulls last);

-- ─── Gallery ────────────────────────────────────────────────────────
--  DO NOT normalise `student` or `timestamp_raw`. The gallery's like
--  counters live in the Firebase Realtime Database under a key built by
--  generateImageId(student, timestamp) — concatenated and stripped of
--  illegal characters. Change either value and every like count on that
--  photo is orphaned and silently resets to zero.
create table if not exists public.gallery_items (
  id            uuid primary key default gen_random_uuid(),
  student       text not null default '',
  timestamp_raw text not null default '',
  category      text not null default '',
  image_url     text not null default '',
  approved      boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists gallery_items_approved_idx
  on public.gallery_items (approved);

-- ─── Meetups ────────────────────────────────────────────────────────
create table if not exists public.meetups (
  id             uuid primary key default gen_random_uuid(),
  date_text      text not null default '',
  starts_at      timestamptz,
  venue          text not null default '',
  region         text not null default '',
  instagram_post text not null default '',
  host_id        text not null default '',
  poster         text not null default '',
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists meetups_region_idx on public.meetups (region);

-- ─── Council ────────────────────────────────────────────────────────
--  The one table that crosses the seam: the row is public content, but
--  the person who may edit it is a Firebase user whose profile carries
--  council_member_id. One route handler owns every write here.
create table if not exists public.council_members (
  id           uuid primary key default gen_random_uuid(),
  name         text not null default '',
  role         text not null default '',
  council_type text not null default '',
  tagline      text not null default '',
  phone        text not null default '',
  email        text not null default '',
  image_url    text not null default '',
  color        text not null default '',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── Study Zone (from Mayank's branch) ──────────────────────────────
create table if not exists public.study_links (
  id           uuid primary key default gen_random_uuid(),
  degree       text not null default '',   -- ds | es | mg | ae
  handbook_url text not null default '',
  grading_url  text not null default '',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.revision_sessions (
  id         uuid primary key default gen_random_uuid(),
  degree     text not null default '',     -- ds | es | mg | ae
  level      text not null default '',
  exam_type  text not null default '',
  url        text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists revision_sessions_degree_level_idx
  on public.revision_sessions (degree, level);

-- ─── updated_at triggers ────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'episodes', 'events', 'gallery_items', 'meetups',
    'council_members', 'study_links', 'revision_sessions'
  ]
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function set_updated_at();', t, t);
  end loop;
end $$;

-- ─── Row level security ─────────────────────────────────────────────
--  Read for everyone, write for nobody. The service-role key bypasses
--  RLS entirely, so server-side writes still work. Leaving RLS off is
--  the single most common way a Supabase project leaks — if an anon key
--  ever reaches a browser without these policies, every row is editable.
do $$
declare t text;
begin
  foreach t in array array[
    'episodes', 'events', 'gallery_items', 'meetups',
    'council_members', 'study_links', 'revision_sessions'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "public read" on public.%I;', t);
    execute format(
      'create policy "public read" on public.%I for select to anon, authenticated using (true);', t);
  end loop;
end $$;
