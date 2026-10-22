-- ════════════════════════════════════════════════════════════════════
--  events.source — which sheet tab a row came from
--
--  The spreadsheet carries three event-shaped tabs with three different
--  column sets: the main Events tab, Aarohan (competition results, no
--  dates) and Community Day. They all land in `events`, so the table
--  needs to say which one a row came from — `category` cannot, because
--  each tab means something different by it.
--
--  Run this in the Supabase SQL editor after 0001_content.sql.
-- ════════════════════════════════════════════════════════════════════

alter table public.events
  add column if not exists source text not null default 'events'
  check (source in ('events', 'aarohan', 'community-day'));

create index if not exists events_source_idx on public.events (source);
