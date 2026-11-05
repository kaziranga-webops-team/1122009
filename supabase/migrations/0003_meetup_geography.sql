-- ════════════════════════════════════════════════════════════════════
--  meetups: where on the map the pin goes
--
--  `region` is an IIT Madras BS zone — Lucknow, Patna, Kolkata — not a
--  place: a Sambalpur meetup is filed under Kolkata and a Vadodara one
--  under Mumbai, so nothing in the table could put a pin on a map.
--  `venue` is free text with no coordinates ("Thrivesome cafe and
--  community" names no city at all).
--
--  These five columns are what the meetup map reads. They are filled by
--  scripts/geocode-meetups.ts, which resolves each venue once and writes
--  data/meetups-geo.sql for a run here; the rows it cannot place
--  confidently are corrected by hand in scripts/meetup-geo-overrides.json.
--
--  lat/lon are nullable on purpose. A meetup whose venue cannot be placed
--  has no coordinates, and 0,0 is a point in the Atlantic — the map skips
--  a null and would happily draw a zero.
--
--  Run this in the Supabase SQL editor after 0002_event_source.sql.
-- ════════════════════════════════════════════════════════════════════

alter table public.meetups
  add column if not exists city     text not null default '',
  add column if not exists district text not null default '',
  add column if not exists state    text not null default '',
  add column if not exists lat      double precision,
  add column if not exists lon      double precision;

-- Latitude and longitude only make sense together, and only inside India's
-- bounding box: a swapped pair (78, 27) lands in Saudi Arabia, which is the
-- single most likely way a hand-typed coordinate goes wrong.
alter table public.meetups
  drop constraint if exists meetups_coords_together;
alter table public.meetups
  add constraint meetups_coords_together
  check (
    (lat is null and lon is null)
    or (lat between 6.0 and 37.6 and lon between 68.0 and 97.5)
  );

-- The map groups by state, then by city.
create index if not exists meetups_state_idx on public.meetups (state);
create index if not exists meetups_city_idx  on public.meetups (city);
