-- Council by tenure: each row says which council year it belongs to, so a new
-- council (2026-27) can be added while the previous one stays on the site.
-- Every existing row is the 2025-26 council.
alter table public.council_members
  add column if not exists tenure text not null default '2025-26';

create index if not exists council_members_tenure_idx
  on public.council_members (tenure, sort_order);

-- Revision sessions: what the session covers and when it is (or was) held,
-- so the Study zone can list upcoming ones first and label each recording.
alter table public.revision_sessions
  add column if not exists subject text not null default '',
  add column if not exists held_at timestamptz;

-- Study resources: notes, PDFs, videos and links on /study/notes, by subject.
create table if not exists public.study_resources (
  id         uuid primary key default gen_random_uuid(),
  title      text not null default '',
  url        text not null default '',
  level      text not null default 'Foundation',
  subject    text not null default '',
  kind       text not null default '',
  author     text not null default '',
  tags       text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists study_resources_level_subject_idx
  on public.study_resources (level, subject);
drop trigger if exists set_updated_at on public.study_resources;
create trigger set_updated_at before update on public.study_resources
  for each row execute function set_updated_at();
alter table public.study_resources enable row level security;
drop policy if exists "public read" on public.study_resources;
create policy "public read" on public.study_resources for select to anon, authenticated using (true);
