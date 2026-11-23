-- Sections of the home page and whole pages the super admin can switch off
-- (Website → Sections in the portal). A section with no row is shown.
create table if not exists public.site_sections (
  id         uuid primary key default gen_random_uuid(),
  section    text not null unique,
  visible    boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.site_sections;
create trigger set_updated_at before update on public.site_sections
  for each row execute function set_updated_at();
alter table public.site_sections enable row level security;
drop policy if exists "public read" on public.site_sections;
create policy "public read" on public.site_sections for select to anon, authenticated using (true);

-- Every switch, listed once. The poster wall starts off: there are no posters yet.
insert into public.site_sections (section, visible, sort_order) values
  ('Home · Named for a floodplain', true, 1),
  ('Home · Three steps into the house', true, 2),
  ('Home · What the house does', true, 3),
  ('Home · Poster wall', false, 4),
  ('Home · Communities', true, 5),
  ('Home · Lately in the house', true, 6),
  ('Home · Council', true, 7),
  ('Home · Join the house', true, 8),
  ('Page · Communities', true, 20),
  ('Page · Council', true, 21),
  ('Page · Gallery', true, 22),
  ('Page · Meetups', true, 23),
  ('Page · Events', true, 24),
  ('Page · Kaziranga Tak', true, 25)
on conflict (section) do nothing;
