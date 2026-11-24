// ─────────────────────────────────────────────────────────────────────────────
// How each content table is presented in the admin panel.
//
// One config per resource drives both the list columns and the edit form, so
// adding a column to a table is a line here rather than a new screen. The
// authoritative rules still live in contentSchema.ts — this is presentation.
// ─────────────────────────────────────────────────────────────────────────────
import type { ContentResource } from '@/lib/portal/permissions';
import { EVENT_SOURCES, EVENT_STATUSES } from '@/lib/portal/contentSchema';
import { COMMUNITIES } from '@/lib/communities';
import { REGIONS } from '@/lib/portal/regions';
import { LEVELS, SUBJECTS } from '@/lib/study/subjects';
import { SITE_IMAGE_SLOTS } from '@/lib/siteImageSlots';
import { SITE_SECTIONS } from '@/lib/siteSectionsList';

/**
 * What a website event is. The site reads these case-insensitively: the
 * house series, Aarohan's three tracks, and otherwise the community that ran it.
 */
export const EVENT_CATEGORIES = [
  'Guest session',
  'Curiosity Hour',
  'Cultural',
  'Technical',
  'E-sports',
  ...COMMUNITIES.map((c) => c.name),
] as const;

/** Kinds of date on the academic calendar. Quiz, OPPE, End term and Exam are the highlighted ones. */
export const ACADEMIC_KINDS = ['Quiz', 'OPPE', 'End term', 'Exam', 'Results', 'Registration', 'Term', 'Meeting', 'Holiday', 'Other'] as const;
export const ACADEMIC_AUDIENCES = ['Term students', 'Qualifier students', 'DAD qualifier students', 'Everyone'] as const;
/** Terms from January 2026 to September 2030; a term already used elsewhere is kept as typed. */
export const ACADEMIC_TERMS = Array.from({ length: 5 }, (_, i) => 2026 + i).flatMap((y) => [`Jan ${y}`, `May ${y}`, `Sep ${y}`]);

/** Upper and Lower are the leadership and the RCs; the rest are teams. */
export const COUNCIL_TYPES = [
  'Upper',
  'Lower',
  'Community',
  'Event Management',
  'Design',
  'Content',
  'PR & outreach',
  'Video Editing',
  'Webops',
] as const;

export type FieldType =
  | 'text'
  | 'textarea'
  | 'url'
  | 'select'
  | 'datetime'
  | 'boolean'
  | 'number'
  /** A calendar date (no time), stored as YYYY-MM-DD: it cannot be misread. */
  | 'date'
  /** A link with an Upload button that stores the picture on Cloudinary. */
  | 'image';

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  options?: readonly string[];
  placeholder?: string;
  /** Shown under the input — use it for anything surprising. */
  hint?: string;
  /** Visible but never editable after creation. */
  lockedAfterCreate?: boolean;
  /** Occupies the full width of the two-column form grid. */
  wide?: boolean;
}

export interface ResourceConfig {
  /** Columns shown in the list, in order. The first is the row's headline. */
  columns: { name: string; label: string; type?: 'badge' | 'boolean' | 'image' }[];
  fields: FieldConfig[];
}

const ORDER_FIELD: FieldConfig = {
  name: 'sort_order',
  label: 'Sort order',
  type: 'number',
  hint: 'Lower numbers appear first on the website.',
};

export const CONTENT_FIELDS: Record<ContentResource, ResourceConfig> = {
  events: {
    columns: [
      { name: 'title', label: 'Event' },
      { name: 'source', label: 'Tab', type: 'badge' },
      { name: 'status', label: 'Status', type: 'badge' },
      { name: 'starts_at', label: 'Date' },
      { name: 'category', label: 'Category' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', wide: true },
      { name: 'source', label: 'Source tab', type: 'select', options: EVENT_SOURCES,
        hint: 'Which part of the site this belongs to.' },
      { name: 'status', label: 'Status', type: 'select', options: EVENT_STATUSES },
      { name: 'category', label: 'Category', type: 'select', options: EVENT_CATEGORIES,
        hint: 'A house series, an Aarohan track, or the community that ran it.' },
      { name: 'speaker', label: 'Speaker', type: 'text' },
      { name: 'starts_at', label: 'Date', type: 'datetime',
        hint: 'The website shows exactly this date, and lists everything newest first by it. Leave empty only if there is no date.' },
      { name: 'description', label: 'Description', type: 'textarea', wide: true },
      { name: 'image_url', label: 'Cover image', type: 'url', wide: true },
      { name: 'youtube_url', label: 'YouTube link', type: 'url' },
      { name: 'meet_link', label: 'Meeting link', type: 'url' },
      { name: 'winner', label: 'Winner', type: 'text' },
      { name: 'runner_up_1', label: '1st runner-up', type: 'text' },
      { name: 'runner_up_2', label: '2nd runner-up', type: 'text' },
      { name: 'honourable_mentions', label: 'Honourable mentions', type: 'text' },
      ORDER_FIELD,
    ],
  },

  council_members: {
    columns: [
      { name: 'name', label: 'Name' },
      { name: 'role', label: 'Role', type: 'badge' },
      { name: 'council_type', label: 'Council' },
      { name: 'tenure', label: 'Tenure' },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'role', label: 'Role', type: 'text', placeholder: 'House Secretary' },
      { name: 'council_type', label: 'Council type', type: 'select', options: COUNCIL_TYPES,
        hint: 'Upper is the house leadership, Lower the regional coordinators, Community the community heads; the rest are teams.' },
      { name: 'tenure', label: 'Tenure', type: 'text', placeholder: '2026-27',
        hint: 'The council year. The newest year shows first on the site; older years stay viewable.' },
      { name: 'color', label: 'Accent colour', type: 'text', placeholder: '#c6011f' },
      { name: 'tagline', label: 'Tagline', type: 'textarea', wide: true },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'image_url', label: 'Photo', type: 'url', wide: true },
      ORDER_FIELD,
    ],
  },

  gallery_items: {
    columns: [
      { name: 'student', label: 'Student' },
      { name: 'category', label: 'Category', type: 'badge' },
      { name: 'approved', label: 'Approved', type: 'boolean' },
      { name: 'timestamp_raw', label: 'Submitted' },
    ],
    fields: [
      { name: 'student', label: 'Student', type: 'text', lockedAfterCreate: true,
        hint: 'Locked: this and the timestamp form the key holding the photo’s like count.' },
      { name: 'timestamp_raw', label: 'Submitted at', type: 'text', lockedAfterCreate: true },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'approved', label: 'Approved for the site', type: 'boolean' },
      { name: 'image_url', label: 'Image', type: 'url', wide: true },
      ORDER_FIELD,
    ],
  },

  meetups: {
    columns: [
      { name: 'region', label: 'Region' },
      { name: 'venue', label: 'Venue' },
      { name: 'city', label: 'City' },
      { name: 'starts_at', label: 'Date' },
      { name: 'host_id', label: 'Host' },
    ],
    fields: [
      { name: 'region', label: 'Region', type: 'select', options: REGIONS,
        hint: 'The IITM BS zone that ran it, not the state.' },
      { name: 'venue', label: 'Venue', type: 'text' },
      { name: 'starts_at', label: 'Date', type: 'datetime',
        hint: 'The website shows exactly this date, and lists meetups newest first by it.' },
      { name: 'host_id', label: "Host's ID", type: 'text' },
      { name: 'instagram_post', label: 'Instagram post', type: 'url', wide: true },
      { name: 'poster', label: 'Poster image', type: 'url', wide: true },
      // Geography: what puts the meetup on the map. Nothing else in the row
      // can — region is a zone, venue is free text.
      { name: 'city', label: 'City', type: 'text', placeholder: 'Agra' },
      { name: 'district', label: 'District', type: 'text', placeholder: 'Agra' },
      { name: 'state', label: 'State', type: 'text', placeholder: 'Uttar Pradesh' },
      { name: 'lat', label: 'Latitude', type: 'number', placeholder: '27.175255',
        hint: 'Right-click the spot in Google Maps and copy the first number. Leave both blank if unknown — the meetup then stays off the map.' },
      { name: 'lon', label: 'Longitude', type: 'number', placeholder: '78.009816',
        hint: 'The second number. Between 68 and 97.5 for anywhere in India.' },
      ORDER_FIELD,
    ],
  },

  episodes: {
    columns: [
      { name: 'episode_no', label: 'No.' },
      { name: 'title', label: 'Title' },
      { name: 'host', label: 'Host' },
      { name: 'date_text', label: 'Date' },
    ],
    fields: [
      { name: 'episode_no', label: 'Episode number', type: 'text', placeholder: 'Episode 1' },
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'host', label: 'Host', type: 'text' },
      { name: 'date_text', label: 'Date', type: 'date', hint: 'The day the episode went live.' },
      { name: 'image_url', label: 'Thumbnail', type: 'url', wide: true },
      { name: 'instagram_url', label: 'Instagram link', type: 'url', wide: true },
      ORDER_FIELD,
    ],
  },

  study_links: {
    columns: [
      { name: 'degree', label: 'Degree' },
      { name: 'handbook_url', label: 'Handbook' },
      { name: 'grading_url', label: 'Grading doc' },
    ],
    fields: [
      { name: 'degree', label: 'Degree', type: 'text', placeholder: 'DS' },
      { name: 'handbook_url', label: 'Student handbook', type: 'url', wide: true },
      { name: 'grading_url', label: 'Grading document', type: 'url', wide: true },
      ORDER_FIELD,
    ],
  },

  revision_sessions: {
    columns: [
      { name: 'subject', label: 'Subject' },
      { name: 'degree', label: 'Degree' },
      { name: 'level', label: 'Level', type: 'badge' },
      { name: 'exam_type', label: 'Exam' },
      { name: 'held_at', label: 'When' },
    ],
    fields: [
      { name: 'subject', label: 'Subject', type: 'text', placeholder: 'Statistics 1', wide: true },
      { name: 'degree', label: 'Degree', type: 'select', options: ['DS', 'ES', 'MG', 'AE'] },
      { name: 'level', label: 'Level', type: 'select', options: ['Foundation', 'Diploma', 'Degree'] },
      { name: 'exam_type', label: 'Exam', type: 'text', placeholder: 'Quiz 2' },
      { name: 'held_at', label: 'Date and time', type: 'datetime',
        hint: 'Upcoming sessions show first in the Study zone; past ones are listed as recordings.' },
      { name: 'url', label: 'Meeting or recording link', type: 'url', wide: true,
        hint: 'The Meet link before the session; swap in the YouTube recording after.' },
      ORDER_FIELD,
    ],
  },

  academic_dates: {
    columns: [
      { name: 'title', label: 'What' },
      { name: 'starts_on', label: 'Date' },
      { name: 'kind', label: 'Kind', type: 'badge' },
      { name: 'term', label: 'Term' },
      { name: 'audience', label: 'For' },
    ],
    fields: [
      { name: 'title', label: 'What', type: 'text', placeholder: 'Quiz 2', wide: true },
      { name: 'kind', label: 'Kind', type: 'select', options: ACADEMIC_KINDS,
        hint: 'Quizzes, OPPEs and end terms are highlighted, with a countdown in the Study zone.' },
      { name: 'starts_on', label: 'Date', type: 'date' },
      { name: 'ends_on', label: 'Last day', type: 'date', hint: 'Only for a window, like a registration period. Leave empty for a single day.' },
      { name: 'term', label: 'Term', type: 'select', options: ACADEMIC_TERMS, hint: 'The term it belongs to, like Sep 2026.' },
      { name: 'audience', label: 'For', type: 'select', options: ACADEMIC_AUDIENCES },
      { name: 'note', label: 'Note', type: 'text', wide: true, placeholder: 'Optional, e.g. "Programming quiz 2"' },
      { name: 'url', label: 'Official link', type: 'url', wide: true, placeholder: 'https://study.iitm.ac.in/ds/academic_calendar.html' },
    ],
  },

  study_resources: {
    columns: [
      { name: 'title', label: 'Resource' },
      { name: 'subject', label: 'Subject' },
      { name: 'level', label: 'Level', type: 'badge' },
      { name: 'kind', label: 'Type' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', wide: true, placeholder: 'Week 3 notes: probability' },
      { name: 'url', label: 'Link', type: 'url', wide: true, hint: 'A Drive folder, PDF, Google Doc, YouTube video or any page.' },
      { name: 'level', label: 'Level', type: 'select', options: LEVELS },
      { name: 'subject', label: 'Subject', type: 'select', options: Array.from(new Set(LEVELS.flatMap((l) => SUBJECTS[l]))) },
      { name: 'kind', label: 'Type', type: 'select', options: ['notes', 'pdf', 'video', 'drive', 'doc', 'link'],
        hint: 'Leave empty to guess from the link.' },
      { name: 'author', label: 'Shared by', type: 'text', placeholder: 'Kaziranga House' },
      { name: 'tags', label: 'Tags', type: 'text', placeholder: 'week 3, summary', hint: 'Comma-separated.' },
      ORDER_FIELD,
    ],
  },

  iitm_links: {
    columns: [
      { name: 'title', label: 'Link' },
      { name: 'group_name', label: 'Group', type: 'badge' },
      { name: 'is_key', label: 'Key', type: 'boolean' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', wide: true },
      { name: 'group_name', label: 'Group', type: 'select',
        options: ['Your account', 'Exams', 'Rules and guidelines', 'Help', 'Student life', 'Careers'] },
      { name: 'is_key', label: 'Key link', type: 'boolean', hint: 'Key links also show on the Study zone page.' },
      { name: 'description', label: 'One line about it', type: 'text', wide: true },
      { name: 'url', label: 'Link', type: 'text', wide: true, placeholder: 'https://…', hint: 'A web address, or mailto: for an email.' },
      ORDER_FIELD,
    ],
  },

  course_channels: {
    columns: [
      { name: 'subject', label: 'Subject' },
      { name: 'level', label: 'Level', type: 'badge' },
      { name: 'title', label: 'Channel' },
    ],
    fields: [
      { name: 'level', label: 'Level', type: 'select', options: LEVELS },
      { name: 'subject', label: 'Subject', type: 'select', options: Array.from(new Set(LEVELS.flatMap((l) => SUBJECTS[l]))) },
      { name: 'title', label: 'Channel name', type: 'text', placeholder: 'IITM BS Maths 1' },
      { name: 'url', label: 'YouTube channel link', type: 'url', wide: true, placeholder: 'https://www.youtube.com/@…' },
      { name: 'note', label: 'Note', type: 'text', wide: true, placeholder: 'Optional, e.g. "Weekly live sessions"' },
      ORDER_FIELD,
    ],
  },

  site_images: {
    columns: [
      { name: 'image_url', label: 'Picture', type: 'image' },
      { name: 'slot', label: 'Where it shows' },
    ],
    fields: [
      { name: 'slot', label: 'Where it shows', type: 'select', options: SITE_IMAGE_SLOTS, wide: true,
        hint: 'One picture per place. Delete the entry to bring back the original artwork.' },
      { name: 'image_url', label: 'Picture', type: 'image', wide: true,
        hint: 'Upload a JPG, PNG or WebP under 8 MB, or paste a link to one.' },
      { name: 'alt', label: 'What the picture shows', type: 'text', wide: true,
        placeholder: 'Members at the Delhi meetup', hint: 'Read aloud by screen readers. Leave empty for a purely decorative picture.' },
    ],
  },

  site_sections: {
    columns: [
      { name: 'section', label: 'Section or page' },
      { name: 'visible', label: 'Shown on the website', type: 'boolean' },
    ],
    fields: [
      { name: 'section', label: 'Section or page', type: 'select', options: SITE_SECTIONS, wide: true },
      { name: 'visible', label: 'Show it on the website', type: 'boolean',
        hint: 'Turn off to hide a home-page section, or to take a page out of the menus. Turn back on any time.' },
      ORDER_FIELD,
    ],
  },
};
