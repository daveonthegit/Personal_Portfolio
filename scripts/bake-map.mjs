#!/usr/bin/env node
/**
 * bake-map.mjs — generates src/os/mapdata.ts from Natural Earth public-domain data.
 *
 * Real geography, baked at build-authoring time: no runtime map dependency, no
 * tiles, no network. Re-run only when changing the projection or coverage.
 *
 *   node scripts/bake-map.mjs [--cache <dir>]
 *
 * Sources (public domain, via the Natural Earth GitHub mirror):
 *   - ne_50m_admin_1_states_provinces_lakes  → region layer (states + coast)
 *   - ne_10m_coastline                       → NYC-metro coastal detail
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const cacheArgIdx = process.argv.indexOf('--cache');
const CACHE = cacheArgIdx > -1 ? process.argv[cacheArgIdx + 1] : join(__dirname, '.map-cache');
mkdirSync(CACHE, { recursive: true });

const SOURCES = {
  admin1: {
    file: 'ne_50m_admin1.geojson',
    url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces_lakes.geojson',
  },
  coast10: {
    file: 'ne_10m_coast.geojson',
    url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_coastline.geojson',
  },
};

/* ── Projection: plate carrée anchored on NYC at viewBox (500, 350) ───────── */

const NYC = { lon: -74.006, lat: 40.7128 };
const PX_PER_LAT = 63.6; // ~11° of latitude spans the 700-unit viewBox height
const PX_PER_LON = PX_PER_LAT * Math.cos((42 * Math.PI) / 180);

const project = ([lon, lat]) => [
  500 + (lon - NYC.lon) * PX_PER_LON,
  350 - (lat - NYC.lat) * PX_PER_LAT,
];

/* ── Douglas–Peucker simplification (tolerance in projected units) ────────── */

function rdp(points, tol) {
  if (points.length < 3) return points;
  const sq = (v) => v * v;
  const segDist2 = (p, a, b) => {
    let [x, y] = a;
    let dx = b[0] - x;
    let dy = b[1] - y;
    if (dx !== 0 || dy !== 0) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) { x = b[0]; y = b[1]; }
      else if (t > 0) { x += dx * t; y += dy * t; }
    }
    return sq(p[0] - x) + sq(p[1] - y);
  };
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxD = 0;
    let idx = -1;
    for (let i = first + 1; i < last; i++) {
      const d = segDist2(points[i], points[first], points[last]);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tol * tol && idx > -1) {
      keep[idx] = true;
      stack.push([first, idx], [idx, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const fmt = (n) => Math.round(n * 100) / 100;
const toPath = (pts, close) =>
  `M${pts.map((p) => `${fmt(p[0])} ${fmt(p[1])}`).join('L')}${close ? 'Z' : ''}`;

function load(key) {
  const path = join(CACHE, SOURCES[key].file);
  if (!existsSync(path)) {
    console.error(`missing ${path} — download it first:\n  curl -sL -o "${path}" "${SOURCES[key].url}"`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

/* ── Region layer: northeast states ───────────────────────────────────────── */

const NE_STATES = new Map(Object.entries({
  Maine: 'ME', 'New Hampshire': 'NH', Vermont: 'VT', Massachusetts: 'MA',
  'Rhode Island': 'RI', Connecticut: 'CT', 'New York': 'NY', 'New Jersey': 'NJ',
  Pennsylvania: 'PA', Maryland: 'MD', Delaware: 'DE', Virginia: 'VA',
  'West Virginia': 'WV', 'District of Columbia': 'DC',
}));

const admin1 = load('admin1');
const regionPaths = [];
const stateLabels = [];

for (const f of admin1.features) {
  if (f.properties.admin !== 'United States of America') continue;
  const code = NE_STATES.get(f.properties.name);
  if (!code) continue;

  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  let largest = null;
  let largestSpan = 0;
  const parts = [];
  for (const poly of polys) {
    for (const ring of poly) {
      const projected = rdp(ring.map(project), 1.1);
      if (projected.length < 4) continue;
      parts.push(toPath(projected, true));
      const xs = projected.map((p) => p[0]);
      const ys = projected.map((p) => p[1]);
      const span = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
      if (span > largestSpan) { largestSpan = span; largest = projected; }
    }
  }
  if (parts.length === 0) continue;
  regionPaths.push({ code, d: parts.join('') });

  if (largest && code !== 'DC') {
    const cx = largest.reduce((s, p) => s + p[0], 0) / largest.length;
    const cy = largest.reduce((s, p) => s + p[1], 0) / largest.length;
    stateLabels.push({ code, x: fmt(cx), y: fmt(cy) });
  }
}

/* ── Metro layer: 10m coastline cropped to the NYC bight ──────────────────── */

const METRO_BBOX = { w: -74.6, e: -73.2, s: 40.35, n: 41.15 };
const inBox = ([lon, lat]) =>
  lon >= METRO_BBOX.w && lon <= METRO_BBOX.e && lat >= METRO_BBOX.s && lat <= METRO_BBOX.n;

const coast10 = load('coast10');
const metroPaths = [];

for (const f of coast10.features) {
  const lines = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const line of lines) {
    let run = [];
    const flush = () => {
      if (run.length > 1) {
        const projected = rdp(run.map(project), 0.03);
        if (projected.length > 1) metroPaths.push({ d: toPath(projected, false) });
      }
      run = [];
    };
    for (const pt of line) {
      if (inBox(pt)) run.push(pt);
      else flush();
    }
    flush();
  }
}

/* ── Emit ─────────────────────────────────────────────────────────────────── */

const out = `/**
 * GENERATED by scripts/bake-map.mjs — do not edit by hand.
 * Real geography from Natural Earth (public domain), projected onto the
 * cinematic viewBox (1000×700, NYC at 500,350) and simplified.
 */

export interface BakedPath { d: string; code?: string }

export const PROJ = {
  nyc: { x: 500, y: 350, lon: ${NYC.lon}, lat: ${NYC.lat} },
  pxPerLon: ${fmt(PX_PER_LON)},
  pxPerLat: ${PX_PER_LAT},
} as const;

/** Northeast state polygons (50m resolution, ~1.1u tolerance). */
export const REGION_STATES: BakedPath[] = ${JSON.stringify(regionPaths)};

/** State label anchors (largest-ring centroids). */
export const STATE_LABELS: { code: string; x: number; y: number }[] = ${JSON.stringify(stateLabels)};

/** NYC-metro coastline fragments (10m resolution, cropped to the bight). */
export const METRO_COAST: BakedPath[] = ${JSON.stringify(metroPaths)};
`;

const outPath = join(repoRoot, 'src', 'os', 'mapdata.ts');
writeFileSync(outPath, out);
const kb = (out.length / 1024).toFixed(1);
console.log(`wrote ${outPath} (${kb} KB) — ${regionPaths.length} states, ${metroPaths.length} metro coast fragments`);
