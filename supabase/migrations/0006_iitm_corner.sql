-- IITM corner links, and a table for each course's YouTube channels, both
-- editable in the portal (Website → IITM corner / YouTube channels). Run after 0004 and 0005.
-- Safe to run again: tables are created once and a link already there is skipped.

create table if not exists public.iitm_links (
  id          uuid primary key default gen_random_uuid(),
  group_name  text not null default '',
  title       text not null default '',
  description text not null default '',
  url         text not null default '',
  is_key      boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.course_channels (
  id         uuid primary key default gen_random_uuid(),
  level      text not null default 'Foundation',
  subject    text not null default '',
  title      text not null default '',
  url        text not null default '',
  note       text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['iitm_links', 'course_channels']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function set_updated_at();', t, t);
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "public read" on public.%I;', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true);', t);
  end loop;
end $$;

insert into public.iitm_links (group_name, title, description, url, is_key, sort_order)
select v.* from (values
  ('Your account', 'Student portal', 'The IIT Madras BS home: courses, announcements and your dashboard', 'https://study.iitm.ac.in/', true, 0),
  ('Your account', 'Sign in to the dashboard', 'Your student dashboard', 'https://ds.study.iitm.ac.in/auth/login', false, 1),
  ('Your account', 'Your documents', 'ID card, fee receipts and progress card', 'https://ds.study.iitm.ac.in/student_dashboard/student_documents', false, 2),
  ('Your account', 'Past courses and assignments', 'Courses and assignments from earlier terms', 'https://ds.study.iitm.ac.in/student_dashboard/student_courses', false, 3),
  ('Your account', 'Course planner', 'The official planner for choosing your courses', 'https://course-planner-140256174016.asia-south1.run.app/login', false, 4),
  ('Exams', 'OPPE and exams', 'The official exam page for OPPE and other assessments', 'https://study.iitm.ac.in/ds/exam.html', true, 5),
  ('Exams', 'Hall tickets and your exam data', 'Your hall tickets and records, in the programme''s Data Studio report', 'https://datastudio.google.com/u/0/reporting/d02dac13-665b-49cc-8d51-0451268a6a3e/page/p_cj44rizltd?s=k3kRC9kDo54', true, 6),
  ('Exams', 'Exam cities', 'Where in-person quizzes and end terms are held', 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRFM0LWNJWSELYXxXFdpHxu0ghiCDOE6uHneSWH-eIIg-4X91gSyMAy0m05RJDiklK-G0KJ0GasGywp/pubhtml?gid=0&single=true', false, 8),
  ('Exams', 'Academic calendar', 'Term dates, quizzes and end-term schedule', 'https://study.iitm.ac.in/ds/academic_calendar.html', false, 9),
  ('Rules and guidelines', 'Student constitution', 'How student bodies and houses are run', 'https://docs.google.com/document/d/e/2PACX-1vRg7fBOFdQ6H0V-iqXSGa7lSZAaZeRZujPBKZe0UY2QzKB9yWQ7zR1PElBlzTZCp-Dt3kr7JAvNFpHM/pub', false, 10),
  ('Rules and guidelines', 'Student interaction guidelines', 'How students are expected to interact, online and in person', 'https://docs.google.com/document/u/1/d/1eSfJLWW-SChkbMkxMWnmWILx0bUY7PfRChwaAw0KJbE/pub', false, 11),
  ('Rules and guidelines', 'Academic and non-academic guidelines', 'The programme''s code of conduct', 'https://docs.google.com/document/d/e/2PACX-1vS2io0kg4RefmBjePUznBvOly1aZFnuiSMPlVevnl6ElWetIbGsR25Haz2-81Y1xnwsibjUxmOGkAbd/pub', false, 12),
  ('Rules and guidelines', 'Important documents', 'The programme''s archive of official documents', 'https://study.iitm.ac.in/ds/archive.html', false, 13),
  ('Help', 'Student grievance form', 'Raise a grievance with the programme', 'https://forms.gle/jX8zK8XhDoZcA3YB9', true, 14),
  ('Help', 'Programme support', 'support@study.iitm.ac.in · replies within 3 working days', 'mailto:support@study.iitm.ac.in', false, 15),
  ('Help', 'FAQ', 'Answers from the programme office', 'https://study.iitm.ac.in/ds/faq.html', false, 16),
  ('Student life', 'Paradox', 'The BS degree''s annual fest', 'https://iitmparadox.org/', false, 17),
  ('Student life', 'Houses and societies', 'Every student house and society', 'https://study.iitm.ac.in/ds/student_life.html', false, 18),
  ('Student life', 'Student Activity on YouTube', 'Event recordings and showcases from across the programme', 'https://www.youtube.com/@StudentActivityIITMBS', false, 19),
  ('Student life', 'Student Activity on WhatsApp', 'The programme''s announcement channel for activities', 'https://www.whatsapp.com/channel/0029Vb03Jfa7T8bZWNymj23c', false, 20),
  ('Student life', 'BS Insider', 'The students'' blog', 'https://bsinsider.in/', false, 21),
  ('Careers', 'Placement portal', 'Jobs and internships through the programme', 'https://placements.study.iitm.ac.in/', false, 22),
  ('Careers', 'Student projects', 'The programme''s best student projects', 'https://study.iitm.ac.in/student-achievements/projects', false, 23)
) as v(group_name, title, description, url, is_key, sort_order)
where not exists (select 1 from public.iitm_links s where s.url = v.url);
