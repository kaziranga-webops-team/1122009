/**
 * Build the boundary files the meetup map draws.
 *
 *   npm run geo:build
 *
 * Writes two TopoJSON files, both committed:
 *   public/geo/india-states.json      36 states and UTs   — the India view
 *   public/geo/india-districts.json   641 districts        — the state view
 *
 * Source: DataMeet India (https://github.com/datameet/maps), pinned to one
 * commit so a rebuild is reproducible. States are `States/Admin2`, which
 * carries the 2019 J&K / Ladakh split and the Survey of India outer boundary
 * (the map of India an Indian site has to show). Districts are the Census
 * 2011 set — the newest DataMeet has — so their own state labels predate
 * Telangana and Ladakh. They are therefore re-assigned here by position: each
 * district goes to whichever current state contains a point inside it, which
 * puts Hyderabad in Telangana and Leh in Ladakh without a lookup table.
 *
 * Licences: states CC BY 4.0, districts CC BY 2.5 India. Both need the credit
 * line the meetup page prints under the map.
 *
 * The raw shapefiles (~27 MB) land in data/geo-src/, which is gitignored.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import mapshaper from 'mapshaper';

const COMMIT = 'b3fbbde595310b397a55d718e0958ce249a4fa1f';
const RAW = `https://raw.githubusercontent.com/datameet/maps/${COMMIT}`;

const SRC_DIR = path.join('data', 'geo-src');
const OUT_DIR = path.join('public', 'geo');

const SOURCES: Record<string, string> = {
  'Admin2.shp': `${RAW}/States/Admin2.shp`,
  'Admin2.dbf': `${RAW}/States/Admin2.dbf`,
  'Admin2.shx': `${RAW}/States/Admin2.shx`,
  'Admin2.prj': `${RAW}/States/Admin2.prj`,
  'Admin2.cpg': `${RAW}/States/Admin2.cpg`,
  '2011_Dist.shp': `${RAW}/Districts/Census_2011/2011_Dist.shp`,
  '2011_Dist.dbf': `${RAW}/Districts/Census_2011/2011_Dist.dbf`,
  '2011_Dist.shx': `${RAW}/Districts/Census_2011/2011_Dist.shx`,
  '2011_Dist.prj': `${RAW}/Districts/Census_2011/2011_Dist.prj`,
};

/**
 * How much detail survives. The India view is ~700 px across, so states at
 * 3% still hold every coastline bend a screen can show; districts are only
 * ever seen one state at a time, zoomed, so they keep more.
 */
const STATE_DETAIL = '3%';
const DISTRICT_DETAIL = '7%';

/** 1e4 steps across India is ~300 m — far finer than any pixel at either zoom. */
const QUANTIZATION = 10000;

async function download() {
  fs.mkdirSync(SRC_DIR, { recursive: true });
  for (const [file, url] of Object.entries(SOURCES)) {
    const dest = path.join(SRC_DIR, file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) continue;
    process.stdout.write(`  downloading ${file}... `);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    console.log('done');
  }
}

const q = (p: string) => `"${p.replace(/\\/g, '/')}"`;

async function main() {
  console.log('Boundary sources:');
  await download();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const states = path.join(SRC_DIR, 'Admin2.shp');
  const districts = path.join(SRC_DIR, '2011_Dist.shp');

  console.log('\nStates...');
  await mapshaper.runCommands(
    [
      `-i ${q(states)} name=states`,
      `-simplify ${STATE_DETAIL} weighted keep-shapes`,
      `-rename-fields name=ST_NM`,
      `-filter-fields name`,
      `-o ${q(path.join(OUT_DIR, 'india-states.json'))} format=topojson quantization=${QUANTIZATION}`,
    ].join(' '),
  );

  console.log('\nDistricts...');
  await mapshaper.runCommands(
    [
      `-i ${q(districts)} name=districts`,
      // Keep the 2011 state only as a fallback for the one district whose
      // inner point falls in no current state (Lakshadweep, which is sea).
      `-rename-fields ST_2011=ST_NM`,
      `-filter-fields DISTRICT,censuscode,ST_2011`,
      `-points inner + name=pts`,
      `-i ${q(states)} name=states`,
      `-join target=pts source=states fields=ST_NM`,
      `-join target=districts source=pts keys=censuscode,censuscode fields=ST_NM`,
      `-target districts`,
      `-each "ST_NM = ST_NM || ST_2011"`,
      `-simplify ${DISTRICT_DETAIL} weighted keep-shapes`,
      `-rename-fields name=DISTRICT,state=ST_NM`,
      `-filter-fields name,state`,
      `-o ${q(path.join(OUT_DIR, 'india-districts.json'))} format=topojson quantization=${QUANTIZATION}`,
    ].join(' '),
  );

  for (const f of ['india-states.json', 'india-districts.json']) {
    const kb = (fs.statSync(path.join(OUT_DIR, f)).size / 1024).toFixed(0);
    console.log(`  ${f}: ${kb} KB`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
