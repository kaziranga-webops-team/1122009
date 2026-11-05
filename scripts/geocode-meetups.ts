/**
 * Backfill the geography the meetup map needs: venue text -> city, district,
 * state, latitude, longitude.
 *
 *   npm run geocode:meetups                 geocode; write data/meetups-geo.csv
 *                                           (for review) and
 *                                           data/meetups-geo-sheet.csv (five
 *                                           columns in sheet row order)
 *   npm run geocode:meetups -- --force      ignore the on-disk cache
 *   npm run geocode:meetups -- --sql        also write data/meetups-geo.sql,
 *                                           ready to run in the Supabase
 *                                           SQL editor
 *
 * Why this exists: `meetups.region` is an IIT Madras BS *zone* (Lucknow,
 * Patna, Kolkata...), not a state — a Sambalpur meetup is filed under
 * Kolkata — and `meetups.venue` is free text with no coordinates. Neither can
 * place a pin on a map, so every row needs resolving once.
 *
 * Nothing here writes to the database. It produces a CSV for human review;
 * rows it could not resolve confidently come first, flagged, and the fixes for
 * those go into scripts/meetup-geo-overrides.json (committed) so that a rerun
 * keeps them. Geocoding is one-way: venue strings go out to Nominatim, no host
 * IDs, and the output CSV carries no personal data either.
 *
 * Nominatim's usage policy caps automated use at one request a second and
 * wants an identifying User-Agent; both are honoured below, and every response
 * is cached so a rerun costs nothing.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import Papa from 'papaparse';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const FORCE = process.argv.includes('--force');
const WRITE_SQL = process.argv.includes('--sql');

const DATA_DIR = 'data';
const OUT_CSV = path.join(DATA_DIR, 'meetups-geo.csv');
const OUT_SHEET_CSV = path.join(DATA_DIR, 'meetups-geo-sheet.csv');
const OUT_SQL = path.join(DATA_DIR, 'meetups-geo.sql');
const CACHE_FILE = path.join(DATA_DIR, '.geocode-cache.json');
const OVERRIDES_FILE = path.join('scripts', 'meetup-geo-overrides.json');

const SHEET_MEETUPS_URL =
  process.env.SHEET_MEETUPS_URL ||
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjXAxRoqAYbkftm1l2yz-Ib5prf2ujnR9kcd4iCwJON4YSw8S8UucAYRu3GQuhYeH4Za1EoB3U7f3L/pub?gid=177547042&single=true&output=csv';

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const USER_AGENT = 'kaziranga-house-meetup-geocoder/1.0';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const RATE_LIMIT_MS = 1100;

/** Mainland + islands bounding box. A hit outside it is the wrong country. */
const INDIA_BBOX = { minLat: 6.0, maxLat: 37.6, minLon: 68.0, maxLon: 97.5 };

/**
 * The zones that appear in `region`, mapped to the city each is named after.
 * Used only as a last resort, and always flagged for review when it is.
 */
const ZONE_CITY: Record<string, string> = {
  chandigarh: 'Chandigarh',
  delhi: 'New Delhi',
  lucknow: 'Lucknow',
  patna: 'Patna',
  kolkata: 'Kolkata',
  mumbai: 'Mumbai',
  chennai: 'Chennai',
  hyderabad: 'Hyderabad',
  bengaluru: 'Bengaluru',
  bangalore: 'Bengaluru',
  ahmedabad: 'Ahmedabad',
  pune: 'Pune',
  jaipur: 'Jaipur',
  bhopal: 'Bhopal',
  guwahati: 'Guwahati',
};

type MeetupRow = {
  Date: string;
  Venue: string;
  Region: string;
};

type Place = {
  city: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
  matched: string;
};

type Resolved = Place & {
  query: string;
  source: 'override' | 'venue' | 'venue-tail' | 'zone-fallback';
  review: string;
};

// ─── Loading the rows ───────────────────────────────────────────────

async function loadRows(): Promise<{ rows: MeetupRow[]; from: string }> {
  if (SUPABASE_URL && SERVICE_KEY && process.env.CONTENT_SOURCE !== 'sheets') {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/meetups?select=date_text,venue,region&order=sort_order.asc`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    );
    if (res.ok) {
      const body = (await res.json()) as Record<string, string>[];
      if (body.length) {
        return {
          from: 'Supabase',
          rows: body.map((r) => ({
            Date: r.date_text ?? '',
            Venue: r.venue ?? '',
            Region: r.region ?? '',
          })),
        };
      }
    }
  }
  const res = await fetch(SHEET_MEETUPS_URL);
  if (!res.ok) throw new Error(`Could not fetch the meetups sheet (HTTP ${res.status})`);
  const parsed = Papa.parse<MeetupRow>(await res.text(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return {
    from: 'the published Google Sheet',
    rows: parsed.data.filter((r) => (r.Date || '').trim() || (r.Venue || '').trim()),
  };
}

// ─── Venue text -> things worth asking a geocoder ───────────────────

/**
 * Words that describe the event, not the place. "Dandiya cum meet-up night,
 * Agra Chaupati" has to become "Agra Chaupati", or the geocoder goes looking
 * for a festival.
 */
const NOISE =
  /\b(meet[\s-]?ups?|meetings?|gatherings?|get[\s-]?together|dandiya|holi|diwali|navratri|cum|night|evening|morning|session|outing|trip|picnic|kaziranga)\b/gi;

function clean(s: string): string {
  return s
    .replace(/ /g, ' ')
    .replace(NOISE, ' ')
    .replace(/\b\d{6}\b/g, ' ') // pincodes
    .replace(/[()]/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();
}

/**
 * Most specific first: the whole venue, then its trailing segments, which is
 * where Indian addresses keep the city and the state.
 */
function candidates(venue: string): string[] {
  const full = clean(venue);
  if (!full) return [];
  const parts = full.split(',').map((p) => p.trim()).filter(Boolean);
  const out = [full];
  if (parts.length > 2) out.push(parts.slice(-2).join(', '));
  if (parts.length > 1) out.push(parts[parts.length - 1]);
  if (parts.length > 1) out.push(parts[0]);
  return [...new Set(out.filter((q) => q.length > 2))];
}

// ─── Nominatim, cached ──────────────────────────────────────────────

type CacheEntry = Place | null;

const cache: Record<string, CacheEntry> = fs.existsSync(CACHE_FILE)
  ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
  : {};
let spent = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function geocode(query: string): Promise<CacheEntry> {
  if (!FORCE && query in cache) return cache[query];

  if (spent > 0) await sleep(RATE_LIMIT_MS);
  spent += 1;

  const url = `${NOMINATIM}?format=jsonv2&addressdetails=1&countrycodes=in&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Nominatim returned HTTP ${res.status} for "${query}"`);

  const hits = (await res.json()) as Record<string, any>[];
  const hit = hits[0];
  let place: CacheEntry = null;

  if (hit) {
    const a = (hit.address ?? {}) as Record<string, string>;
    const lat = Number(hit.lat);
    const lon = Number(hit.lon);
    const inIndia =
      a.country_code === 'in' &&
      lat >= INDIA_BBOX.minLat &&
      lat <= INDIA_BBOX.maxLat &&
      lon >= INDIA_BBOX.minLon &&
      lon <= INDIA_BBOX.maxLon;
    if (inIndia) {
      place = {
        city: a.city || a.town || a.village || a.municipality || a.suburb || a.county || '',
        district: a.state_district || a.district || a.county || '',
        state: a.state || '',
        lat,
        lon,
        matched: String(hit.display_name ?? ''),
      };
    }
  }

  cache[query] = place;
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  return place;
}

// ─── Resolving one row ──────────────────────────────────────────────

/** Whitespace in the sheet is erratic, so neither side of a lookup trusts it. */
const tidy = (s: string) => (s || '').replace(/\s+/g, ' ').trim();
const key = (r: MeetupRow) => `${tidy(r.Date)}|${tidy(r.Venue)}`;

/**
 * A hand-written fix, keyed "<date>|<venue>". Any of:
 *   query     a better search string (or a list, tried in order) to geocode
 *   lat/lon   coordinates set outright, skipping the geocoder
 *   city/district/state   labels laid over whatever came back
 * An entry means a human has checked this row, so it is not flagged again.
 */
type Override = Partial<Place> & { query?: string | string[]; note?: string };

const rawOverrides: Record<string, Override> = fs.existsSync(OVERRIDES_FILE)
  ? JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'))
  : {};
const overrides: Record<string, Override> = Object.fromEntries(
  Object.entries(rawOverrides).map(([k, v]) => [k.includes('|') ? `${tidy(k.split('|')[0])}|${tidy(k.slice(k.indexOf('|') + 1))}` : k, v]),
);

/** The label fields an override sets, if any. */
function labels(over?: Override): Partial<Place> {
  if (!over) return {};
  const out: Partial<Place> = {};
  if (over.city) out.city = over.city;
  if (over.district) out.district = over.district;
  if (over.state) out.state = over.state;
  return out;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/**
 * Did the geocoder land somewhere the venue text actually mentions? A hit
 * whose city appears nowhere in the string is the kind that silently puts a
 * pin 400 km away, so it gets flagged rather than trusted.
 */
function corroborated(venue: string, p: Place): boolean {
  const hay = norm(venue);
  return [p.city, p.district].some((t) => t && hay.includes(norm(t)));
}

async function resolve(row: MeetupRow): Promise<Resolved | null> {
  const venue = (row.Venue || '').trim();
  const zone = (row.Region || '').trim();

  const over = overrides[key(row)];

  // Coordinates set by hand skip the geocoder entirely.
  if (over && over.lat != null && over.lon != null) {
    return {
      city: over.city ?? '',
      district: over.district ?? '',
      state: over.state ?? '',
      lat: over.lat,
      lon: over.lon,
      matched: over.note ?? 'set by hand',
      query: venue,
      source: 'override',
      review: '',
    };
  }

  const queries = over?.query ? [over.query].flat() : candidates(venue);
  for (let i = 0; i < queries.length; i++) {
    const place = await geocode(queries[i]);
    if (!place) continue;
    if (over) {
      // A human picked this search string, or at least these labels, so the
      // corroboration check has nothing left to add.
      return {
        ...place,
        ...labels(over),
        matched: over.note ? `${place.matched} — ${over.note}` : place.matched,
        query: queries[i],
        source: 'override',
        review: '',
      };
    }
    const reviews: string[] = [];
    if (!corroborated(venue, place)) reviews.push('name not in venue text');
    if (!place.city) reviews.push('no city');
    if (!place.state) reviews.push('no state');
    return {
      ...place,
      query: queries[i],
      source: i === 0 ? 'venue' : 'venue-tail',
      review: reviews.join('; '),
    };
  }

  // Nothing in the venue resolved. Fall back to the zone's own city, which is
  // a guess about the region and not about the meetup: always needs review.
  const zoneCity = ZONE_CITY[zone.toLowerCase()];
  if (zoneCity) {
    const place = await geocode(zoneCity);
    if (place) {
      return {
        ...place,
        ...labels(over),
        query: zoneCity,
        source: 'zone-fallback',
        review: over
          ? 'the override query did not resolve — placed at the zone city'
          : venue
            ? 'venue unresolved — placed at the zone city'
            : 'no venue — placed at the zone city',
      };
    }
  }
  return null;
}

// ─── Output ─────────────────────────────────────────────────────────

const sqlStr = (s: string) => `'${s.replace(/'/g, "''")}'`;

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const { rows, from } = await loadRows();
  console.log(`Read ${rows.length} meetups from ${from}.`);
  console.log('Geocoding (about a second each, cached after the first run)...\n');

  const out: Record<string, string>[] = [];
  let failed = 0;

  for (const [i, row] of rows.entries()) {
    const r = await resolve(row);
    if (!r) {
      failed += 1;
      out.push({
        row: String(i + 1),
        needs_review: 'YES',
        review: 'could not resolve at all',
        date: row.Date,
        venue: row.Venue,
        region: row.Region,
        city: '',
        district: '',
        state: '',
        lat: '',
        lon: '',
        source: 'none',
        query: '',
        matched: '',
      });
      console.log(`  x  ${row.Venue || '(no venue)'} — unresolved`);
      continue;
    }
    const needs = r.source === 'zone-fallback' || r.review ? 'YES' : '';
    out.push({
      row: String(i + 1),
      needs_review: needs,
      review: r.review,
      date: row.Date,
      venue: row.Venue,
      region: row.Region,
      city: r.city,
      district: r.district,
      state: r.state,
      lat: r.lat.toFixed(6),
      lon: r.lon.toFixed(6),
      source: r.source,
      query: r.query,
      matched: r.matched,
    });
    const label = (row.Venue || '(no venue)').slice(0, 44).padEnd(46);
    console.log(`  ${needs ? '?' : 'o'}  ${label} ${r.city || '—'}, ${r.state || '—'}`);
  }

  // Five columns in the sheet's own row order, for pasting straight into the
  // spreadsheet next to the existing ones. `out` must still be in source
  // order here — the review file below is what gets reordered.
  fs.writeFileSync(
    OUT_SHEET_CSV,
    Papa.unparse(out.map((r) => ({ City: r.city, District: r.district, State: r.state, Lat: r.lat, Lon: r.lon }))),
    'utf8',
  );

  // The review file leads with the rows a human has to look at. `row` keeps
  // the original position recoverable.
  const review = [...out].sort((a, b) => (b.needs_review || '').localeCompare(a.needs_review || ''));
  fs.writeFileSync(OUT_CSV, Papa.unparse(review), 'utf8');

  if (WRITE_SQL) {
    const lines = out
      .filter((r) => r.lat)
      .map(
        (r) =>
          `update public.meetups set city = ${sqlStr(r.city)}, district = ${sqlStr(r.district)}, ` +
          `state = ${sqlStr(r.state)}, lat = ${r.lat}, lon = ${r.lon} ` +
          `where date_text = ${sqlStr(r.date)} and venue = ${sqlStr(r.venue)};`,
      );
    fs.writeFileSync(OUT_SQL, `begin;\n${lines.join('\n')}\ncommit;\n`, 'utf8');
  }

  const flagged = out.filter((r) => r.needs_review).length;
  console.log(
    `\n${out.length} rows — ${out.length - flagged - failed} confident, ${flagged} to check, ${failed} unresolved.`,
  );
  console.log(`Wrote ${OUT_CSV}, ${OUT_SHEET_CSV}${WRITE_SQL ? ` and ${OUT_SQL}` : ''}.`);
  console.log(`Requests to Nominatim this run: ${spent}.`);
  if (flagged || failed) {
    console.log(`\nFix the flagged rows in ${OVERRIDES_FILE} (key: "date|venue"), then rerun.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
