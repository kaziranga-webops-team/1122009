-- Pictures the super admin can swap from the portal (Website → Site images).
-- One row per place on the site; a place with no row keeps its built-in art.
create table if not exists public.site_images (
  id         uuid primary key default gen_random_uuid(),
  slot       text not null unique,
  image_url  text not null default '',
  alt        text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.site_images;
create trigger set_updated_at before update on public.site_images
  for each row execute function set_updated_at();
alter table public.site_images enable row level security;
drop policy if exists "public read" on public.site_images;
create policy "public read" on public.site_images for select to anon, authenticated using (true);
