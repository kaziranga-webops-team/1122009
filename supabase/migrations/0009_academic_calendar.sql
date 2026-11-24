-- The IIT Madras BS academic calendar, shown in the Study zone with a
-- countdown to the next exam. Edited in the portal (Website → Academic
-- calendar) by admins and the super admin.
--
-- Seeded from the official calendar at
-- https://study.iitm.ac.in/ds/academic_calendar.html (the ES page shows the
-- same calendar), as published on 24 November 2026: the May 2026 and
-- September 2026 terms in full, and the term-student dates for January, May
-- and September 2027. Later terms are added in the portal once published.
create table if not exists public.academic_dates (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  -- Quiz, OPPE, End term, Exam, Results, Registration, Term, Meeting, Holiday, Other
  kind       text not null default 'Other',
  starts_on  date not null,
  ends_on    date,
  -- Term students, Qualifier students, DAD qualifier students, Everyone
  audience   text not null default 'Term students',
  -- The term it belongs to, e.g. 'Sep 2026'
  term       text not null default '',
  note       text not null default '',
  url        text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_dates_range check (ends_on is null or ends_on >= starts_on),
  constraint academic_dates_once unique (term, audience, title)
);

create index if not exists academic_dates_starts_on on public.academic_dates (starts_on);

drop trigger if exists set_updated_at on public.academic_dates;
create trigger set_updated_at before update on public.academic_dates
  for each row execute function set_updated_at();
alter table public.academic_dates enable row level security;
drop policy if exists "public read" on public.academic_dates;
create policy "public read" on public.academic_dates for select to anon, authenticated using (true);

insert into public.academic_dates (term, audience, kind, title, starts_on, ends_on, note, url) values
  -- ── May 2026 term ──
  ('May 2026', 'Qualifier students', 'Registration', 'Qualifier registration', '2026-03-02', '2026-05-31', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Qualifier students', 'Term', 'Course and programme orientation', '2026-05-16', '2026-05-18', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Qualifier students', 'Exam', 'Qualifier exam', '2026-07-19', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Qualifier students', 'Results', 'Qualifier exam results', '2026-07-23', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Qualifier students', 'Registration', 'Course registration and qualifier reattempt window', '2026-07-23', '2026-07-24', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Qualifier students', 'Exam', 'Qualifier reattempt exam', '2026-08-16', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Qualifier students', 'Results', 'Qualifier reattempt results', '2026-08-26', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'Meeting', 'Class committee', '2026-05-12', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'Registration', 'Course registration', '2026-05-19', '2026-05-20', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'Term', 'Term starts', '2026-06-12', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'Registration', 'Drop course window', '2026-07-03', '2026-07-05', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'Quiz', 'Quiz 1', '2026-07-19', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'Results', 'Quiz 1 results', '2026-07-27', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'OPPE', 'OPPE 1, day 1', '2026-08-01', null, 'Programming quiz 1', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'OPPE', 'OPPE 1, day 2', '2026-08-02', null, 'Programming quiz 1', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'Results', 'OPPE 1 results', '2026-08-07', '2026-08-12', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'Quiz', 'Quiz 2', '2026-08-16', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'Results', 'Quiz 2 results', '2026-08-24', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'OPPE', 'OPPE 2, day 1', '2026-08-29', null, 'Programming quiz 2', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'OPPE', 'OPPE 2, day 2', '2026-08-30', '2026-08-31', 'Programming quiz 2', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'OPPE', 'OPPE 2, day 3', '2026-09-05', null, 'Programming quiz 2', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'OPPE', 'OPPE 2, day 4', '2026-09-06', null, 'Programming quiz 2', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'Results', 'OPPE 2 results', '2026-09-10', '2026-09-15', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'End term', 'End term exam', '2026-09-13', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'Term students', 'Results', 'End term results', '2026-09-21', '2026-09-26', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'DAD qualifier students', 'Registration', 'DAD qualifier registration', '2026-05-24', '2026-08-14', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'DAD qualifier students', 'Exam', 'DAD qualifier exam', '2026-09-13', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2026', 'DAD qualifier students', 'Results', 'DAD qualifier results', '2026-09-21', '2026-09-26', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),

  -- ── September 2026 term ──
  ('Sep 2026', 'Qualifier students', 'Registration', 'Qualifier registration', '2026-06-29', '2026-09-27', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Qualifier students', 'Term', 'Course and programme orientation', '2026-09-14', '2026-09-18', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Qualifier students', 'Exam', 'Qualifier exam', '2026-11-15', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Qualifier students', 'Results', 'Qualifier exam results', '2026-11-19', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Qualifier students', 'Registration', 'Course registration and qualifier reattempt window', '2026-11-19', '2026-11-20', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Qualifier students', 'Exam', 'Qualifier reattempt exam', '2026-12-05', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Qualifier students', 'Results', 'Qualifier reattempt results', '2026-12-15', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'Meeting', 'Class committee', '2026-09-15', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'Registration', 'Course registration', '2026-09-22', '2026-09-23', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'Term', 'Term starts', '2026-10-02', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'Registration', 'Drop course window', '2026-10-23', '2026-10-25', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'Quiz', 'Quiz 1', '2026-11-15', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'OPPE', 'OPPE 1, day 1', '2026-11-21', null, 'Programming quiz 1', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'OPPE', 'OPPE 1, day 2', '2026-11-22', null, 'Programming quiz 1', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'Results', 'Quiz 1 results', '2026-11-23', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'Results', 'OPPE 1 results', '2026-11-26', '2026-12-01', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'Quiz', 'Quiz 2', '2026-12-05', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'Results', 'Quiz 2 results', '2026-12-13', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'OPPE', 'OPPE 2, day 1', '2026-12-19', null, 'Programming quiz 2', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'OPPE', 'OPPE 2, day 2', '2026-12-20', null, 'Programming quiz 2', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'OPPE', 'OPPE 2, day 3', '2027-01-02', null, 'Programming quiz 2', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'OPPE', 'OPPE 2, day 4', '2027-01-03', null, 'Programming quiz 2', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'Results', 'OPPE 2 results', '2027-01-07', '2027-01-12', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'End term', 'End term exam', '2027-01-10', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'Term students', 'Results', 'End term results', '2027-01-18', '2027-01-23', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'DAD qualifier students', 'Registration', 'DAD qualifier registration', '2026-09-27', '2026-12-11', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'DAD qualifier students', 'Exam', 'DAD qualifier exam', '2027-01-10', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2026', 'DAD qualifier students', 'Results', 'DAD qualifier results', '2027-01-18', '2027-01-23', '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),

  -- ── January 2027 term (term students; planned dates) ──
  ('Jan 2027', 'Term students', 'Term', 'Term starts', '2027-02-05', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Jan 2027', 'Term students', 'Quiz', 'Quiz 1', '2027-03-14', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Jan 2027', 'Term students', 'OPPE', 'OPPE 1, day 1', '2027-03-27', null, 'Programming quiz 1', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Jan 2027', 'Term students', 'OPPE', 'OPPE 1, day 2', '2027-03-28', null, 'Programming quiz 1', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Jan 2027', 'Term students', 'Quiz', 'Quiz 2', '2027-04-11', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Jan 2027', 'Term students', 'OPPE', 'OPPE 2, day 1', '2027-04-25', null, 'Programming quiz 2', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Jan 2027', 'Term students', 'OPPE', 'OPPE 2, day 2', '2027-05-02', null, 'Programming quiz 2', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Jan 2027', 'Term students', 'End term', 'End term exam', '2027-05-09', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),

  -- ── May 2027 term (term students; planned dates) ──
  ('May 2027', 'Term students', 'Term', 'Term starts', '2027-06-04', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2027', 'Term students', 'Quiz', 'Quiz 1', '2027-07-11', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2027', 'Term students', 'OPPE', 'OPPE 1, day 1', '2027-07-24', null, 'Programming quiz 1', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2027', 'Term students', 'OPPE', 'OPPE 1, day 2', '2027-07-25', null, 'Programming quiz 1', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2027', 'Term students', 'Quiz', 'Quiz 2', '2027-08-08', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2027', 'Term students', 'OPPE', 'OPPE 2, day 1', '2027-08-22', null, 'Programming quiz 2', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2027', 'Term students', 'OPPE', 'OPPE 2, day 2', '2027-08-29', null, 'Programming quiz 2', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('May 2027', 'Term students', 'End term', 'End term exam', '2027-09-05', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),

  -- ── September 2027 term (term students; planned dates) ──
  ('Sep 2027', 'Term students', 'Term', 'Term starts', '2027-10-01', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2027', 'Term students', 'Quiz', 'Quiz 1', '2027-11-07', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2027', 'Term students', 'OPPE', 'OPPE 1, day 1', '2027-11-27', null, 'Programming quiz 1', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2027', 'Term students', 'OPPE', 'OPPE 1, day 2', '2027-11-28', null, 'Programming quiz 1', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2027', 'Term students', 'Quiz', 'Quiz 2', '2027-12-12', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2027', 'Term students', 'OPPE', 'OPPE 2, day 1', '2027-12-19', null, 'Programming quiz 2', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2027', 'Term students', 'OPPE', 'OPPE 2, day 2', '2027-12-26', null, 'Programming quiz 2', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2027', 'Term students', 'OPPE', 'OPPE 2, day 3', '2028-01-02', null, 'Programming quiz 2', 'https://study.iitm.ac.in/ds/academic_calendar.html'),
  ('Sep 2027', 'Term students', 'End term', 'End term exam', '2028-01-09', null, '', 'https://study.iitm.ac.in/ds/academic_calendar.html')
on conflict (term, audience, title) do nothing;
