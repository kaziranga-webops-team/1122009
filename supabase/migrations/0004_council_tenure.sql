-- Council by tenure: each row says which council year it belongs to, so a new
-- council (2026-27) can be added while the previous one stays on the site.
-- Every existing row is the 2025-26 council.
alter table public.council_members
  add column if not exists tenure text not null default '2025-26';

create index if not exists council_members_tenure_idx
  on public.council_members (tenure, sort_order);
