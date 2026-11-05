/**
 * One-off import: the published Google Sheet CSVs -> Supabase Postgres.
 *
 *   npm run import:sheets -- --dry-run     inspect what would be written
 *   npm run import:sheets                  append
 *   npm run import:sheets -- --truncate    empty each table first (re-runnable)
 *
 * Reads from data/ (gitignored — the Council tab carries phone numbers and
 * email addresses, so the exports must never be committed).
 *
 * Writes with the service-role key, which bypasses row level security. That
 * is the only way rows get in: the anon role has SELECT and nothing else.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import Papa from 'papaparse';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATA_DIR = 'data';
const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DRY = process.argv.includes('--dry-run');
const TRUNCATE = process.argv.includes('--truncate');

type Row = Record<string, string>;

// ─── Normalisers ────────────────────────────────────────────────────

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());

/**
 * The sheet writes status as "past recorded", "Past Recorded", "past
 * Recorded" and "upcoming " — mixed case, spaces not hyphens, stray
 * trailing whitespace. The four values below are what the UI understands
 * and what the CHECK constraint allows.
 */
const STATUSES = ['upcoming', 'live-now', 'past-recorded', 'past-unrecorded'] as const;
function status(raw: unknown): string {
  const v = s(raw).toLowerCase().replace(/\s+/g, '-');
  return (STATUSES as readonly string[]).includes(v) ? v : 'upcoming';
}

function bool(raw: unknown): boolean {
  return ['yes', 'y', 'true', '1', 'approved'].includes(s(raw).toLowerCase());
}

/**
 * Dates, parsed with the day/month order stated per sheet.
 *
 * The tabs do not agree with each other, and `new Date(string)` guesses:
 *   Meet-Ups       D/M/Y   "30/11/2025" — 58 of 86 rows have day > 12
 *   Events         M/D/Y   "8/22/2026"  — 23 of 28 rows have second > 12
 *   Kaziranga TAK  M/D/Y
 *   Community Day  D/M/Y   only 8/8 and 9/8, so the data cannot prove it;
 *                          D/M/Y puts the festival on Sat 8 and Sun 9 August,
 *                          M/D/Y would scatter it across Aug and September.
 *
 * Left to `new Date()`, Meet-Ups lost 58 rows outright and — worse — silently
 * swapped day and month on the other 28. A wrong date that parses is harder to
 * notice than one that fails, so the order is never inferred here.
 */
type DateOrder = 'dmy' | 'mdy';

function startsAt(raw: unknown, order: DateOrder): string | null {
  const v = s(raw);
  if (!v) return null;

  const m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/.exec(v);
  if (!m) {
    const iso = new Date(v); // ISO and long-form dates are unambiguous
    return Number.isNaN(iso.getTime()) ? null : iso.toISOString();
  }

  const [a, b] = [Number(m[1]), Number(m[2])];
  const year = Number(m[3]) < 100 ? Number(m[3]) + 2000 : Number(m[3]);
  const day = order === 'dmy' ? a : b;
  const month = order === 'dmy' ? b : a;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const d = new Date(Date.UTC(year, month - 1, day));
  // Rejects overflow such as 31/02, which Date would roll into March.
  if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return d.toISOString();
}

function readCsv(file: string): Row[] {
  const text = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  const { data, errors } = Papa.parse<Row>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    // Several headers ship with a trailing space ("Winner ", "Honourable
    // mentions "), which would silently produce undefined lookups.
    transformHeader: (h) => h.trim(),
  });
  const fatal = errors.filter((e) => e.code !== 'TooFewFields' && e.code !== 'TooManyFields');
  if (fatal.length) console.warn(`  ! ${file}: ${fatal.length} parse warning(s), first: ${fatal[0].message}`);
  return data;
}

// ─── Sheet -> table mappings ────────────────────────────────────────

const MAPPINGS: {
  table: string;
  file: string;
  /** Rows without this field are blank spreadsheet filler and are dropped. */
  requires: string;
  map: (r: Row, i: number) => Record<string, unknown>;
}[] = [
  {
    table: 'episodes',
    file: 'Kaziranga_Now_backend - Kaziranga TAK.csv',
    requires: 'title',
    map: (r, i) => ({
      episode_no: s(r['Episode No.']),
      title: s(r['Title']),
      date_text: s(r['Date']),
      host: s(r['Host']),
      image_url: s(r['Image_url']),
      instagram_url: s(r['Instagram_url']),
      sort_order: i,
    }),
  },
  {
    table: 'events',
    file: 'Kaziranga_Now_backend - Events.csv',
    requires: 'title',
    map: (r, i) => ({
      source: 'events',
      title: s(r['Title']),
      category: s(r['Category']),
      status: status(r['status']),
      date_text: s(r['Date']),
      starts_at: startsAt(r['Date'], 'mdy'),
      description: s(r['description']),
      speaker: s(r['Speaker']),
      image_url: s(r['Image_url']),
      youtube_url: s(r['youtube_url']),
      meet_link: s(r['meet_link']),
      sort_order: i,
    }),
  },
  {
    // No date and no speaker on this tab — it is a results table.
    table: 'events',
    file: 'Kaziranga_Now_backend - Aarohan .csv',
    requires: 'title',
    map: (r, i) => ({
      source: 'aarohan',
      title: s(r['Name of Event']),
      category: s(r['Sub-Category']),
      status: status(r['Status']),
      image_url: s(r['Images']),
      youtube_url: s(r['YouTube link']),
      meet_link: s(r['Meet-Link']),
      winner: s(r['Winner']),
      runner_up_1: s(r['First Runner-up']),
      // "Secong" is the spelling in the sheet's own header.
      runner_up_2: s(r['Secong Runner-up']),
      honourable_mentions: s(r['Honourable mentions']),
      sort_order: i,
    }),
  },
  {
    table: 'events',
    file: 'Kaziranga_Now_backend - Community Day.csv',
    requires: 'title',
    map: (r, i) => ({
      source: 'community-day',
      title: s(r['Name of the Event']),
      category: s(r['Community Name']),
      status: status(r['Status']),
      date_text: s(r['Date']),
      starts_at: startsAt(r['Date'], 'dmy'),
      description: s(r['description']),
      image_url: s(r['card image']),
      youtube_url: s(r['yt link']),
      meet_link: s(r['Link to specific page']),
      winner: s(r['Winner']),
      runner_up_1: s(r['First Runner-up']),
      runner_up_2: s(r['Secong Runner-up']),
      honourable_mentions: s(r['Honourable mentions']),
      sort_order: i,
    }),
  },
  {
    table: 'gallery_items',
    file: 'Kaziranga_Now_backend - Gallery Backend.csv',
    requires: 'student',
    map: (r, i) => ({
      // student and timestamp_raw are copied verbatim on purpose: together
      // they build the Realtime Database key that holds each photo's like
      // count. Normalise either and every count on that photo orphans.
      student: s(r['Student']),
      timestamp_raw: s(r['Timestamp']),
      category: s(r['Category']),
      image_url: s(r['Image_url']),
      approved: bool(r['Approved']),
      sort_order: i,
    }),
  },
  {
    table: 'meetups',
    file: 'Kaziranga_Now_backend - Meet-Ups.csv',
    requires: 'region',
    map: (r, i) => ({
      date_text: s(r['Date']),
      starts_at: startsAt(r['Date'], 'dmy'),
      venue: s(r['Venue']),
      region: s(r['Region']),
      instagram_post: s(r['Instagram Post']),
      host_id: s(r["Host's ID"]),
      poster: s(r['Poster']),
      sort_order: i,
    }),
  },
  {
    table: 'council_members',
    file: 'Kaziranga_Now_backend - Council.csv',
    requires: 'name',
    map: (r, i) => ({
      name: s(r['Name']),
      role: s(r['Role']),
      council_type: s(r['Council Type']),
      tagline: s(r['Tagline']),
      phone: s(r['Phone']),
      email: s(r['Email']),
      image_url: s(r['Image URL']),
      color: s(r['Color']),
      sort_order: i,
    }),
  },
  {
    table: 'study_links',
    file: 'Kaziranga_Now_backend - Study_docs.csv',
    requires: 'degree',
    map: (r, i) => ({
      degree: s(r['Degree']),
      handbook_url: s(r['Student Handbook']),
      grading_url: s(r['Grading Doc']),
      sort_order: i,
    }),
  },
  {
    table: 'revision_sessions',
    file: 'Kaziranga_Now_backend - Revision Sessions.csv',
    requires: 'url',
    map: (r, i) => ({
      degree: s(r['Degree']),
      level: s(r['Level']),
      exam_type: s(r['Exam_type']),
      url: s(r['URL']),
      sort_order: i,
    }),
  },
];

// ─── Supabase REST ──────────────────────────────────────────────────

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

async function truncate(table: string) {
  const res = await fetch(`${BASE}/rest/v1/${table}?id=not.is.null`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=minimal' },
  });
  if (!res.ok) throw new Error(`truncate ${table}: ${res.status} ${await res.text()}`);
}

async function insert(table: string, rows: Record<string, unknown>[]) {
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const res = await fetch(`${BASE}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) throw new Error(`insert ${table}: ${res.status} ${await res.text()}`);
  }
}

async function main() {
  if (!BASE || !KEY) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  console.log(DRY ? '— DRY RUN, nothing is written —\n' : `→ ${BASE}\n`);

  if (TRUNCATE && !DRY) {
    for (const table of [...new Set(MAPPINGS.map((m) => m.table))]) {
      await truncate(table);
      console.log(`cleared ${table}`);
    }
    console.log('');
  }

  let total = 0;
  for (const m of MAPPINGS) {
    const raw = readCsv(m.file);
    const rows = raw.map(m.map).filter((r) => String(r[m.requires] ?? '').length > 0);
    const dropped = raw.length - rows.length;
    total += rows.length;

    console.log(
      `${m.table.padEnd(18)} ${String(rows.length).padStart(4)} rows` +
        (dropped ? `  (${dropped} blank skipped)` : '') +
        `   ← ${m.file}`
    );

    if (DRY) {
      if (rows[0]) console.log(`   e.g. ${JSON.stringify(rows[0]).slice(0, 150)}…`);
      continue;
    }
    await insert(m.table, rows);
  }

  console.log(`\n${DRY ? 'would import' : 'imported'} ${total} rows`);
}

main().catch((e) => {
  console.error('\nImport failed:', e.message);
  process.exit(1);
});
