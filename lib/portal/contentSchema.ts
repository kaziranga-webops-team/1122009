// ─────────────────────────────────────────────────────────────────────────────
// What may be written to each content table, and by whom.
//
// Everything the admin panel sends goes through these schemas. A column that
// is not listed cannot be set from a request at all — `id`, `created_at` and
// `updated_at` are the database's business, and omitting them here is what
// stops a crafted payload from rewriting them.
// ─────────────────────────────────────────────────────────────────────────────
import { z } from 'zod';
import type { UserRole } from '@/types/portal';
import type { ContentResource } from '@/lib/portal/permissions';

/** Trimmed string that treats null/undefined as empty — the tables use '' not null. */
const text = z.preprocess((v) => (v == null ? '' : String(v).trim()), z.string());
const url = text.refine(
  (v) => v === '' || /^https?:\/\//i.test(v),
  'Must start with http:// or https://'
);
const order = z.coerce.number().int().min(0).max(100000).optional();
/** An ISO instant or null — the forms send '' when a date is cleared. */
const instant = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.string().datetime({ offset: true }).nullable()
);
/**
 * A coordinate inside India, or null when the field is left blank — a meetup
 * whose venue cannot be placed has no coordinates, and 0,0 is a point in the
 * Atlantic. The bounds are the ones the table itself checks (see
 * supabase/migrations/0003_meetup_geography.sql), and they are what catches a
 * swapped pair: latitude 78 is not in India.
 */
const coordinate = (min: number, max: number, axis: string) =>
  z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z.coerce.number().min(min, `${axis} must be between ${min} and ${max}`)
      .max(max, `${axis} must be between ${min} and ${max}`)
      .nullable()
  );

export const EVENT_STATUSES = ['upcoming', 'live-now', 'past-recorded', 'past-unrecorded'] as const;
export const EVENT_SOURCES = ['events', 'aarohan', 'community-day'] as const;

const schemas = {
  events: z.object({
    source: z.enum(EVENT_SOURCES).default('events'),
    title: text.pipe(z.string().min(1, 'Title is required').max(300)),
    category: text,
    status: z.enum(EVENT_STATUSES).default('upcoming'),
    date_text: text,
    starts_at: instant.optional(),
    description: text,
    speaker: text,
    image_url: url,
    youtube_url: url,
    meet_link: url,
    winner: text,
    runner_up_1: text,
    runner_up_2: text,
    honourable_mentions: text,
    sort_order: order,
  }),

  council_members: z.object({
    name: text.pipe(z.string().min(1, 'Name is required').max(160)),
    role: text,
    council_type: text,
    tagline: text,
    phone: text,
    email: text.refine((v) => v === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Not a valid email'),
    image_url: url,
    color: text,
    sort_order: order,
  }),

  gallery_items: z.object({
    // Changing either of these orphans the photo's like count in the Realtime
    // Database, which is keyed on student + timestamp. The admin UI shows them
    // read-only; they are accepted here only so a new row can be created.
    student: text.pipe(z.string().min(1, 'Student is required')),
    timestamp_raw: text,
    category: text,
    image_url: url,
    approved: z.coerce.boolean().default(false),
    sort_order: order,
  }),

  meetups: z.object({
    date_text: text,
    starts_at: instant.optional(),
    venue: text,
    region: text.pipe(z.string().min(1, 'Region is required')),
    instagram_post: url,
    host_id: text,
    poster: url,
    city: text,
    district: text,
    state: text,
    lat: coordinate(6, 37.6, 'Latitude').optional(),
    lon: coordinate(68, 97.5, 'Longitude').optional(),
    sort_order: order,
  }),

  episodes: z.object({
    episode_no: text,
    title: text.pipe(z.string().min(1, 'Title is required')),
    date_text: text,
    host: text,
    image_url: url,
    instagram_url: url,
    sort_order: order,
  }),

  study_links: z.object({
    degree: text.pipe(z.string().min(1, 'Degree is required')),
    handbook_url: url,
    grading_url: url,
    sort_order: order,
  }),

  revision_sessions: z.object({
    degree: text.pipe(z.string().min(1, 'Degree is required')),
    level: text,
    exam_type: text,
    url: url.pipe(z.string().min(1, 'URL is required')),
    sort_order: order,
  }),
} satisfies Record<ContentResource, z.ZodObject<z.ZodRawShape>>;

export type ContentSchemas = typeof schemas;

export function schemaFor(resource: ContentResource) {
  return schemas[resource];
}

/**
 * Fields an RC may change on the council row that describes them.
 *
 * Their own words and contact details, yes. Their name, their title and which
 * council they sit on, no — those are claims about the house's structure, not
 * about themselves, so they stay with the admins.
 */
const RC_COUNCIL_FIELDS = ['tagline', 'phone', 'email', 'image_url', 'color'] as const;

/**
 * Narrows a validated payload to the fields `role` is allowed to set.
 * Returns the kept fields and the rejected ones, so the caller can say what
 * was ignored rather than silently dropping it.
 */
export function restrictFields(
  role: UserRole,
  resource: ContentResource,
  data: Record<string, unknown>
): { data: Record<string, unknown>; rejected: string[] } {
  if (role !== 'RC' || resource !== 'council_members') return { data, rejected: [] };

  const allowed = new Set<string>(RC_COUNCIL_FIELDS);
  const kept: Record<string, unknown> = {};
  const rejected: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (allowed.has(k)) kept[k] = v;
    else rejected.push(k);
  }
  return { data: kept, rejected };
}

/** Human-facing labels for the admin UI's resource switcher. */
export const RESOURCE_LABELS: Record<ContentResource, { title: string; singular: string }> = {
  events: { title: 'Events', singular: 'event' },
  council_members: { title: 'Council', singular: 'council member' },
  gallery_items: { title: 'Gallery', singular: 'photo' },
  meetups: { title: 'Meetups', singular: 'meetup' },
  episodes: { title: 'Kaziranga Tak', singular: 'episode' },
  study_links: { title: 'Study links', singular: 'study link' },
  revision_sessions: { title: 'Revision sessions', singular: 'session' },
};
