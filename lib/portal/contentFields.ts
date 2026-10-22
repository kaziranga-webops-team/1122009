// ─────────────────────────────────────────────────────────────────────────────
// How each content table is presented in the admin panel.
//
// One config per resource drives both the list columns and the edit form, so
// adding a column to a table is a line here rather than a new screen. The
// authoritative rules still live in contentSchema.ts — this is presentation.
// ─────────────────────────────────────────────────────────────────────────────
import type { ContentResource } from '@/lib/portal/permissions';
import { EVENT_SOURCES, EVENT_STATUSES } from '@/lib/portal/contentSchema';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'url'
  | 'select'
  | 'datetime'
  | 'boolean'
  | 'number';

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
      { name: 'date_text', label: 'Date' },
      { name: 'category', label: 'Category' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', wide: true },
      { name: 'source', label: 'Source tab', type: 'select', options: EVENT_SOURCES,
        hint: 'Which part of the site this belongs to.' },
      { name: 'status', label: 'Status', type: 'select', options: EVENT_STATUSES },
      { name: 'category', label: 'Category', type: 'text', placeholder: 'guest Session' },
      { name: 'speaker', label: 'Speaker', type: 'text' },
      { name: 'date_text', label: 'Date (as shown)', type: 'text', placeholder: '8/22/2026',
        hint: 'Displayed verbatim on the site.' },
      { name: 'starts_at', label: 'Date (for sorting)', type: 'datetime',
        hint: 'Optional. Used for ordering and filtering.' },
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
      { name: 'email', label: 'Email' },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'role', label: 'Role', type: 'text', placeholder: 'House Secretary' },
      { name: 'council_type', label: 'Council type', type: 'text', placeholder: 'Upper' },
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
      { name: 'date_text', label: 'Date' },
      { name: 'host_id', label: 'Host' },
    ],
    fields: [
      { name: 'region', label: 'Region', type: 'text',
        hint: 'The IITM BS zone that ran it (Lucknow, Patna...), not the state.' },
      { name: 'venue', label: 'Venue', type: 'text' },
      { name: 'date_text', label: 'Date (as shown)', type: 'text', placeholder: '22/02/2025',
        hint: 'Meetups are written day/month/year.' },
      { name: 'starts_at', label: 'Date (for sorting)', type: 'datetime' },
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
      { name: 'date_text', label: 'Date', type: 'text' },
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
      { name: 'degree', label: 'Degree' },
      { name: 'level', label: 'Level', type: 'badge' },
      { name: 'exam_type', label: 'Exam' },
      { name: 'url', label: 'Recording' },
    ],
    fields: [
      { name: 'degree', label: 'Degree', type: 'text', placeholder: 'DS' },
      { name: 'level', label: 'Level', type: 'text', placeholder: 'Foundation' },
      { name: 'exam_type', label: 'Exam type', type: 'text', placeholder: 'Quiz 2' },
      { name: 'url', label: 'Recording URL', type: 'url', wide: true },
      ORDER_FIELD,
    ],
  },
};
