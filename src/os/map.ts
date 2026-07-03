/**
 * Cartography for the Zoom-In acquisition ladder and desktop wallpaper.
 *
 * Visual grammar (ctOS-inspired, per design session):
 *  - Region view = earth-at-night: dark landmass, glowing white light-clusters
 *    at the real metro areas along the BosWash corridor.
 *  - Metro view = real 10m coastline (Natural Earth, baked) + borough labels.
 *  - Grid/block views = dense WHITE block-mass city: filled building rectangles,
 *    Central Park hatched void, Broadway diagonal.
 *
 * Hops 0–1 draw REAL geography from `mapdata.ts` (scripts/bake-map.mjs).
 * Hops 2–3 are dense stylization — texture reads, geography can't be verified.
 * Cyan belongs to the lock state only, applied by the sequence.
 */

import { REGION_STATES, STATE_LABELS, METRO_COAST, PROJ } from './mapdata';

const INK = 'rgba(244, 239, 230, 0.6)';
const INK_SOFT = 'rgba(244, 239, 230, 0.32)';
const INK_FAINT = 'rgba(244, 239, 230, 0.07)';
const LAND_FILL = 'rgba(244, 239, 230, 0.045)';

const NSS = 'vector-effect="non-scaling-stroke"';

export const NYC = { x: PROJ.nyc.x, y: PROJ.nyc.y };

const proj = (lon: number, lat: number): [number, number] => [
  500 + (lon - PROJ.nyc.lon) * PROJ.pxPerLon,
  350 - (lat - PROJ.nyc.lat) * PROJ.pxPerLat,
];

/** Deterministic PRNG — animation must not depend on Math.random. */
function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/* ── Acquisition ladder ──────────────────────────────────────────────────── */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Hop {
  box: Box;
  cam: { cx: number; cy: number; s: number };
  label: string;
  status: string;
  /** Wrong targets the system flickers across before committing. */
  candidates: Array<{ box: Box; label: string }>;
}

const metroBoxAt = (lon: number, lat: number, w: number, h: number): Box => {
  const [x, y] = proj(lon, lat);
  return { x: x - w / 2, y: y - h / 2, w, h };
};

export const HOPS: Hop[] = [
  {
    box: { x: 478, y: 326, w: 54, h: 44 },
    cam: { cx: 505, cy: 348, s: 12.5 },
    label: 'NEW YORK METRO',
    status: 'Target — New York metro',
    candidates: [
      { box: metroBoxAt(-71.06, 42.36, 40, 32), label: 'BOSTON METRO' },
      { box: metroBoxAt(-77.04, 38.91, 40, 32), label: 'WASHINGTON METRO' },
      { box: metroBoxAt(-75.17, 39.95, 36, 30), label: 'PHILADELPHIA METRO' },
    ],
  },
  {
    box: { x: 498, y: 337.5, w: 7.4, h: 14.5 },
    cam: { cx: 501.7, cy: 344.8, s: 40 },
    label: 'MANHATTAN GRID',
    status: 'Grid — Manhattan',
    candidates: [
      { box: metroBoxAt(-74.17, 40.73, 6, 5), label: 'NEWARK' },
      { box: metroBoxAt(-73.94, 40.65, 7, 5.5), label: 'BROOKLYN' },
      { box: metroBoxAt(-73.82, 40.73, 7.5, 6), label: 'QUEENS' },
    ],
  },
  {
    box: { x: 501, y: 344.25, w: 1.5, h: 1.15 },
    cam: { cx: 501.75, cy: 344.82, s: 470 },
    label: 'SUBJECT BLOCK',
    status: 'Block resolved',
    candidates: [
      { box: { x: 500.1, y: 342.6, w: 1.3, h: 1.0 }, label: 'BLOCK 40.81 / 73.99' },
      { box: { x: 502.3, y: 346.1, w: 1.4, h: 1.05 }, label: 'BLOCK 40.77 / 73.95' },
    ],
  },
];

/** Final lock — drawn at block level; morphs into the Dossier window. */
export const LOCK_BOX: Box = { x: 501.52, y: 344.65, w: 0.48, h: 0.36 };

/* ── Defs: glow filter + zone hatching ───────────────────────────────────── */

function defs(): string {
  // NOTE: no SVG filters here on purpose — feGaussianBlur re-rasterizes on every
  // camera transform and was the main source of jank. Glow is faked with a
  // radial gradient + layered circles instead.
  return `
    <defs>
      <radialGradient id="xwZiHalo">
        <stop offset="0%" stop-color="rgba(244,239,230,0.5)"/>
        <stop offset="45%" stop-color="rgba(244,239,230,0.14)"/>
        <stop offset="100%" stop-color="rgba(244,239,230,0)"/>
      </radialGradient>
      <pattern id="xwZiHatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(244,239,230,0.22)" stroke-width="1.5"/>
      </pattern>
    </defs>`;
}

/* ── Layers ──────────────────────────────────────────────────────────────── */

function graticule(): string {
  const lines: string[] = [];
  for (let x = 100; x < 1000; x += 100) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="700" stroke="${INK_FAINT}" ${NSS}/>`);
  }
  for (let y = 100; y < 700; y += 100) {
    lines.push(`<line x1="0" y1="${y}" x2="1000" y2="${y}" stroke="${INK_FAINT}" ${NSS}/>`);
  }
  return `<g id="xw-zi-graticule">${lines.join('')}</g>`;
}

/** Earth-at-night: glowing light clusters at the real BosWash metros. */
function nightLights(): string {
  const rnd = lcg(20260702);
  const metros: Array<[number, number, number, number]> = [
    // lon, lat, dots, spread (map units)
    [-74.006, 40.713, 30, 11],  // NYC
    [-71.059, 42.36, 15, 7],    // Boston
    [-75.165, 39.953, 15, 7],   // Philadelphia
    [-77.037, 38.907, 14, 7],   // Washington
    [-76.612, 39.29, 9, 4.5],   // Baltimore
    [-71.413, 41.824, 7, 3.5],  // Providence
    [-72.685, 41.764, 6, 3],    // Hartford
    [-72.928, 41.308, 6, 3],    // New Haven
    [-73.756, 42.653, 6, 3],    // Albany
  ];
  const dots: string[] = [];
  const halos: string[] = [];
  const put = (x: number, y: number, r: number, o: number) =>
    dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="rgba(244,239,230,${o.toFixed(2)})"/>`);

  for (const [lon, lat, n, spread] of metros) {
    const [cx, cy] = proj(lon, lat);
    // One cheap gradient halo per metro instead of a blur filter over every dot.
    halos.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(spread * 1.9).toFixed(1)}" fill="url(#xwZiHalo)"/>`);
    for (let i = 0; i < n; i++) {
      // Sum of two uniforms ≈ center-weighted scatter
      const dx = (rnd() + rnd() - 1) * spread;
      const dy = (rnd() + rnd() - 1) * spread * 0.8;
      put(cx + dx, cy + dy, 0.7 + rnd() * 1.3, 0.25 + rnd() * 0.5);
    }
  }
  // The I-95 ribbon between them
  const corridor = [-77.037, 38.907, -76.612, 39.29, -75.165, 39.953, -74.006, 40.713, -72.928, 41.308, -71.413, 41.824, -71.059, 42.36];
  for (let i = 0; i < corridor.length - 2; i += 2) {
    const [x1, y1] = proj(corridor[i]!, corridor[i + 1]!);
    const [x2, y2] = proj(corridor[i + 2]!, corridor[i + 3]!);
    const segs = 7;
    for (let k = 1; k < segs; k++) {
      const t = k / segs;
      put(x1 + (x2 - x1) * t + (rnd() - 0.5) * 5, y1 + (y2 - y1) * t + (rnd() - 0.5) * 5, 0.5 + rnd() * 0.7, 0.14 + rnd() * 0.22);
    }
  }
  return `
    <g id="xw-zi-lights">
      ${halos.join('')}
      ${dots.join('')}
    </g>`;
}

function regionLayer(): string {
  const states = REGION_STATES.map(
    (p) => `<path d="${p.d}" fill="${LAND_FILL}" stroke="${INK_SOFT}" ${NSS}/>`,
  ).join('');
  const labels = STATE_LABELS.map(
    (l) => `<text x="${l.x}" y="${l.y}" class="xw-zi-state-label">${l.code}</text>`,
  ).join('');
  const cities: Array<[string, number, number]> = [
    ['WASHINGTON', ...proj(-77.037, 38.907)] as [string, number, number],
    ['PHILADELPHIA', ...proj(-75.165, 39.953)] as [string, number, number],
    ['BOSTON', ...proj(-71.059, 42.36)] as [string, number, number],
  ];
  const cityMarks = cities.map(
    ([name, x, y]) => `
      <g class="xw-zi-city">
        <text x="${x + 11}" y="${y + 4}" class="xw-zi-city-label">${name}</text>
      </g>`,
  ).join('');
  const nycMark = `
    <g class="xw-zi-city">
      <text x="${NYC.x + 24}" y="${NYC.y - 20}" class="xw-zi-city-label xw-zi-city-label--subject">NEW YORK</text>
    </g>`;
  return `
    <g id="xw-zi-region-layer">${states}</g>
    ${nightLights()}
    <g id="xw-zi-region-labels">${labels}${cityMarks}${nycMark}</g>`;
}

function metroLayer(): string {
  const coast = METRO_COAST.map(
    (p) => `<path d="${p.d}" fill="none" stroke="${INK}" ${NSS}/>`,
  ).join('');
  const boroughs: Array<[string, number, number]> = [
    ['MANHATTAN', -73.97, 40.79],
    ['BROOKLYN', -73.95, 40.64],
    ['QUEENS', -73.8, 40.73],
    ['THE BRONX', -73.87, 40.86],
    ['NEWARK', -74.19, 40.72],
    ['JERSEY CITY', -74.08, 40.71],
  ];
  const labels = boroughs.map(([name, lon, lat]) => {
    const [x, y] = proj(lon as number, lat as number);
    return `<text x="${x}" y="${y}" class="xw-zi-metro-label">${name}</text>`;
  }).join('');
  return `<g id="xw-zi-metro-layer" opacity="0">${coast}<g id="xw-zi-metro-labels">${labels}</g></g>`;
}

/**
 * Dense stylized Manhattan — local units, ~1u ≈ 1 screen px at hop-2 rest.
 * `mass` fills the blocks between streets so the island reads as a white
 * city-mass (the TURN OUT THE LIGHTS look); linework rides on top.
 */
export function manhattanGridLines(
  street = INK_SOFT,
  avenue = 'rgba(244,239,230,0.4)',
  outline = INK,
  mass = true,
): string {
  const parts: string[] = [];
  const rnd = lcg(4711);
  // Island half-width at a given y (tapered ends)
  const halfW = (y: number) => 238 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(y) / 690, 2.2)));

  if (mass) {
    for (let y = -620; y < 620; y += 26) {
      for (let x = -220; x < 220; x += 40) {
        const cx = x + 20;
        const cy = y + 13;
        if (Math.abs(cx) > halfW(cy) - 14) continue;
        // Central Park stays void
        if (cx > -64 && cx < 64 && cy > -352 && cy < -114) continue;
        const o = 0.1 + rnd() * 0.2;
        parts.push(`<rect x="${x + 3}" y="${y + 3}" width="34" height="20" fill="rgba(244,239,230,${o.toFixed(2)})"/>`);
      }
    }
  }
  // Streets (crosstown)
  for (let y = -620; y <= 620; y += 26) {
    parts.push(`<line x1="-238" y1="${y}" x2="238" y2="${y}" stroke="${street}" ${NSS}/>`);
  }
  // Avenues (long axis)
  for (let x = -200; x <= 200; x += 40) {
    parts.push(`<line x1="${x}" y1="-618" x2="${x}" y2="618" stroke="${avenue}" ${NSS}/>`);
  }
  // Broadway cuts the grid
  parts.push(`<polyline points="-150,-620 -58,-210 28,140 74,620" fill="none" stroke="${outline}" ${NSS}/>`);
  // Central Park — hatched restricted zone (plain void in the defs-less wallpaper)
  parts.push(`<rect x="-64" y="-352" width="128" height="238" fill="${mass ? 'url(#xwZiHatch)' : 'none'}" stroke="${outline}" ${NSS}/>`);
  // Island outline — tapered, irregular
  const island = [
    [-138, -640], [-28, -662], [62, -640], [150, -556], [202, -376], [232, -118],
    [240, 122], [202, 380], [122, 560], [42, 650], [-58, 662], [-120, 560],
    [-190, 378], [-228, 120], [-238, -120], [-218, -378], [-188, -558],
  ];
  parts.push(
    `<polygon points="${island.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${outline}" ${NSS}/>`,
  );
  // Pier ticks, west edge
  for (let y = -520; y <= 520; y += 74) {
    parts.push(`<line x1="-244" y1="${y}" x2="-262" y2="${y + 6}" stroke="${street}" ${NSS}/>`);
  }
  return parts.join('');
}

function gridLayer(): string {
  return `
    <g id="xw-zi-grid-layer" opacity="0">
      <g transform="translate(501.7 344.8) scale(0.0138) rotate(-28.9)">
        ${manhattanGridLines()}
      </g>
    </g>`;
}

/** White block-mass buildings — deterministic, no address claim intended. */
function blockFootprints(): string {
  const rnd = lcg(1337);
  const parts: string[] = [];
  for (let y = -540; y <= 540; y += 180) {
    parts.push(`<line x1="-660" y1="${y}" x2="660" y2="${y}" stroke="rgba(244,239,230,0.38)" ${NSS}/>`);
  }
  for (let x = -600; x <= 600; x += 240) {
    parts.push(`<line x1="${x}" y1="-560" x2="${x}" y2="560" stroke="rgba(244,239,230,0.38)" ${NSS}/>`);
  }
  for (let bx = -600; bx < 600; bx += 240) {
    for (let by = -540; by < 540; by += 180) {
      const n = 3 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) {
        const w = 40 + rnd() * 80;
        const h = 34 + rnd() * 60;
        const x = bx + 18 + rnd() * (240 - w - 36);
        const y = by + 16 + rnd() * (180 - h - 32);
        const o = 0.2 + rnd() * 0.42;
        parts.push(
          `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="rgba(244,239,230,${o.toFixed(2)})" stroke="rgba(244,239,230,0.55)" ${NSS}/>`,
        );
      }
    }
  }
  return parts.join('');
}

function blockLayer(): string {
  return `
    <g id="xw-zi-block-layer" opacity="0">
      <g transform="translate(501.75 344.82) scale(0.0016) rotate(-28.9)">
        ${blockFootprints()}
      </g>
    </g>`;
}

/* ── Acquisition boxes — map-space rects with corner brackets ─────────────── */

export function cornerBox(id: string, b: Box, extraClass = ''): string {
  const l = Math.min(b.w, b.h) * 0.24;
  const { x, y, w, h } = b;
  const c = (d: string) => `<path d="${d}" fill="none" class="xw-zi-bracket" ${NSS}/>`;
  return `
    <g id="${id}" class="xw-zi-box ${extraClass}" opacity="0">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" class="xw-zi-boxrect" ${NSS}/>
      ${c(`M${x} ${y + l}L${x} ${y}L${x + l} ${y}`)}
      ${c(`M${x + w - l} ${y}L${x + w} ${y}L${x + w} ${y + l}`)}
      ${c(`M${x + w} ${y + h - l}L${x + w} ${y + h}L${x + w - l} ${y + h}`)}
      ${c(`M${x + l} ${y + h}L${x} ${y + h}L${x} ${y + h - l}`)}
    </g>`;
}

/* ── Assembled overlay SVG ────────────────────────────────────────────────── */

export function regionMapSvg(): string {
  const hopBoxes = HOPS.map((hop, i) => cornerBox(`xw-zi-box-${i}`, hop.box)).join('');
  const candBoxes = HOPS.map((hop, i) =>
    hop.candidates
      .map((c, j) => cornerBox(`xw-zi-cand-${i}-${j}`, c.box, 'xw-zi-box--cand'))
      .join(''),
  ).join('');
  return `
    <svg class="xw-zi-map" id="xw-zi-map" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      ${defs()}
      ${graticule()}
      <g id="xw-zi-cam">
        ${regionLayer()}
        ${metroLayer()}
        ${gridLayer()}
        ${blockLayer()}
        ${candBoxes}
        ${hopBoxes}
        ${cornerBox('xw-zi-box-lock', LOCK_BOX)}
      </g>
    </svg>`;
}

/** Faint street-grid wallpaper for the desktop plane (linework only, no mass). */
export function wallpaperSvg(): string {
  return `
    <svg class="xw-desktop-wallpaper" viewBox="-720 -560 1440 1120" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <g transform="rotate(-28.9)" opacity="0.5">
        ${manhattanGridLines('rgba(244,239,230,0.05)', 'rgba(244,239,230,0.05)', 'rgba(244,239,230,0.09)', false)}
      </g>
    </svg>`;
}
