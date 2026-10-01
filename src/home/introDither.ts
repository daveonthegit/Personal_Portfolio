/**
 * Intro dither moments — the ctOS "signal acquisition" grammar on the front door.
 *
 * Two full-screen layers built on the same Bayer matrix as the image feed
 * (`src/utils/dither.ts`), drawn on plain 2D canvases at cell resolution and
 * upscaled crisp. No WebGL, so they never compete with the city's GPU init and
 * work on the SVG fallback path too.
 *
 *  - Handshake: behind the boot geometry, a dim 1-bit carrier field. Each boot
 *    beat is a handshake ping — a ring leaves the centre, the cell size steps
 *    down and the edge noise floor drops — so the link visibly "locks" by the
 *    time System Loading completes. The centre stays black: text keeps contrast.
 *  - Decode: held opaque under the boot from its reveal beat (the boot's fade
 *    would otherwise expose the live city early), then — once the acquisition
 *    starts — the black dissolves into the city in Bayer order behind a top-down
 *    front, cells stepping fine as it goes. It then idles transparent and answers
 *    the flight's snap glitches with brief interference bands until the hand-off.
 *
 * Both are aria-hidden, pointer-transparent siblings below the HUD/boot text,
 * stop their frame loop as soon as their canvas leaves the document, and are
 * never created under reduced motion (the caller gates that).
 */

import { bayerMatrix } from '../utils/dither';

const FRAME_MS = 1000 / 30;
/** Cap on cells per layer: keeps each frame well under a millisecond of JS. */
const MAX_CELLS = 80_000;
const THRESHOLD = Float32Array.from(bayerMatrix(8).flat(), (r) => (r + 0.5) / 64);

/** Unpremultiplied RGBA packed for a little-endian Uint32 view of ImageData. */
const rgba = (r: number, g: number, b: number, a: number) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
/** Warm ink at carrier strength (the boot's white is never reused for texture). */
const INK = rgba(244, 239, 230, 80);
const INK_DIM = rgba(244, 239, 230, 48);
const BLACK = rgba(0, 0, 0, 255);
const DROPOUT = rgba(0, 0, 0, 210);

const threshold = (x: number, y: number) => THRESHOLD[((y & 7) << 3) | (x & 7)] ?? 0.5;

interface Grid {
  cols: number;
  rows: number;
  image: ImageData;
  px: Uint32Array;
}

function createLayer(className: string): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  canvas.className = `xw-intro-dither ${className}`;
  canvas.setAttribute('aria-hidden', 'true');
  return { canvas, ctx };
}

/** Sizes the canvas to whole cells of at least `cell` CSS px covering the viewport. */
function grid(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, cell: number): Grid {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const size = Math.max(cell, Math.ceil(Math.sqrt((w * h) / MAX_CELLS)));
  const cols = Math.max(1, Math.ceil(w / size));
  const rows = Math.max(1, Math.ceil(h / size));
  canvas.width = cols;
  canvas.height = rows;
  canvas.style.width = `${cols * size}px`;
  canvas.style.height = `${rows * size}px`;
  const image = ctx.createImageData(cols, rows);
  return { cols, rows, image, px: new Uint32Array(image.data.buffer) };
}

/** A ~30fps loop that ends by itself once `tick` returns false or the canvas is gone. */
function loop(canvas: HTMLCanvasElement, tick: (now: number) => boolean): () => void {
  let raf = 0;
  let last = 0;
  const frame = (now: number) => {
    raf = 0;
    if (!canvas.isConnected) return;
    if (now - last >= FRAME_MS) {
      last = now;
      if (!tick(now)) return;
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
}

/* ───────────────────────────── boot handshake ───────────────────────────── */

/** Cell size (CSS px) and edge noise floor per boot beat: coarse and noisy → locked. */
const HANDSHAKE: ReadonlyArray<readonly [cell: number, noise: number]> = [
  [22, 0.62], [15, 0.48], [10, 0.36], [7, 0.24], [5, 0.15], [4, 0.08],
];
const PING_MS = 900;
const SLIP_MS = 140;

export interface Handshake {
  /** Advance to boot beat `stage` (0–5): ping, step the cell down, glitch once. */
  step(stage: number): void;
  stop(): void;
}

export function mountHandshake(host: HTMLElement, stage: number): Handshake | null {
  const layer = createLayer('xw-intro-handshake');
  if (!layer) return null;
  const { canvas, ctx } = layer;
  host.prepend(canvas);

  let g: Grid = grid(canvas, ctx, HANDSHAKE[0]![0]);
  let dist = new Float32Array(0);
  let edge = new Float32Array(0);
  let noise = 0;
  const pings: number[] = [];
  let slipT0 = -Infinity;
  let seed = 1;

  const rebuild = (cell: number) => {
    g = grid(canvas, ctx, cell);
    dist = new Float32Array(g.cols * g.rows);
    edge = new Float32Array(g.cols * g.rows);
    const aspect = g.cols / g.rows;
    for (let y = 0; y < g.rows; y++) {
      for (let x = 0; x < g.cols; x++) {
        const dx = ((x + 0.5) / g.cols - 0.5) * 2 * Math.min(1, aspect);
        const dy = ((y + 0.5) / g.rows - 0.5) * 2 * Math.min(1, 1 / aspect);
        const d = Math.hypot(dx, dy);
        const i = y * g.cols + x;
        dist[i] = d;
        // Clear in the middle (boot text, bars and hint), dense toward the corners.
        const e = Math.min(1, Math.max(0, (d - 0.55) / 0.75));
        edge[i] = e * e * (3 - 2 * e);
      }
    }
  };

  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const draw = (now: number): boolean => {
    while (pings.length && now - (pings[0] ?? 0) > PING_MS) pings.shift();
    const { cols, rows, px } = g;
    const slipping = now - slipT0 < SLIP_MS;
    // Per-frame static: a fresh seed each frame so the floor crawls like a live feed.
    seed = (Math.floor(now / FRAME_MS) * 2654435761) >>> 0;
    for (let y = 0; y < rows; y++) {
      const slip = slipping && rand() < 0.18 ? Math.floor((rand() - 0.5) * cols * 0.2) : 0;
      for (let x = 0; x < cols; x++) {
        const sx = Math.min(cols - 1, Math.max(0, x + slip));
        const i = y * cols + sx;
        const d = dist[i] ?? 0;
        let lum = (edge[i] ?? 0) * noise * (0.35 + 0.65 * rand());
        // Pings only light up once clear of the centre, where the boot glyphs sit.
        const open = Math.min(1, Math.max(0, (d - 0.24) / 0.22));
        if (open > 0) for (const t0 of pings) {
          const age = (now - t0) / PING_MS;
          const ring = 1 - Math.abs(d - age * 1.6) / 0.09;
          if (ring > 0) lum += ring * (1 - age) * 0.9 * open;
        }
        px[y * cols + x] = lum > threshold(x, y) ? (lum > 0.8 ? INK : INK_DIM) : 0;
      }
    }
    ctx.putImageData(g.image, 0, 0);
    return true;
  };

  const stopLoop = loop(canvas, draw);

  const step = (n: number) => {
    const beat = HANDSHAKE[Math.min(HANDSHAKE.length - 1, Math.max(0, n))]!;
    rebuild(beat[0]);
    noise = beat[1];
    const now = performance.now();
    pings.push(now);
    slipT0 = now;
  };
  step(stage);

  return {
    step,
    stop() {
      stopLoop();
      canvas.remove();
    },
  };
}

/* ─────────────────────────── cover decode + interference ─────────────────────────── */

const DECODE_MS = 520;
/** Cells step down as the front passes: the picture arrives in ever finer grain. */
const DECODE_CELLS = [16, 10, 6, 3] as const;
const BURST_MS = 130;

export interface Decode {
  /**
   * Move into `cover` (beneath its HUD) and dissolve into whatever is under it —
   * the city canvas, or the fallback map — then stay as a transparent
   * interference layer until the hand-off. Call in the task the cover turns clear.
   */
  start(cover: HTMLElement, signal?: AbortSignal): void;
  cancel(): void;
}

/** An opaque black layer just under the boot cover, waiting for `start`. */
export function mountDecode(): Decode | null {
  const layer = createLayer('xw-intro-decode');
  if (!layer) return null;
  const { canvas, ctx } = layer;
  canvas.classList.add('xw-intro-decode--held');
  document.body.appendChild(canvas);

  let cellIndex = 0;
  let g = grid(canvas, ctx, DECODE_CELLS[0]);
  g.px.fill(BLACK);
  ctx.putImageData(g.image, 0, 0);

  let t0 = 0;
  let burstT0 = -Infinity;
  let burstSeed = 0;
  let idle = false;

  const decodeFrame = (now: number) => {
    // A frame's timestamp can predate start(): clamp so the first step is the coarsest.
    const p = Math.min(1, Math.max(0, (now - t0) / DECODE_MS));
    const want = Math.min(DECODE_CELLS.length - 1, Math.floor(p * DECODE_CELLS.length));
    if (want !== cellIndex) {
      cellIndex = want;
      g = grid(canvas, ctx, DECODE_CELLS[want]!);
    }
    const { cols, rows, px } = g;
    const front = p * 1.12 - 0.06;
    for (let y = 0; y < rows; y++) {
      const v = y / rows;
      for (let x = 0; x < cols; x++) {
        // Same key shape as the image decode: a top-down sweep with a dithered edge.
        const key = 0.55 * v + 0.45 * threshold(x >> 1, y >> 1);
        px[y * cols + x] = key < front ? (key > front - 0.025 ? INK_DIM : 0) : BLACK;
      }
    }
    ctx.putImageData(g.image, 0, 0);
  };

  const burstFrame = (now: number) => {
    const { cols, rows, px } = g;
    px.fill(0);
    if (now - burstT0 < BURST_MS) {
      let s = (burstSeed + Math.floor(now / 45)) >>> 0;
      const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      const bands = 2 + Math.floor(rnd() * 3);
      for (let b = 0; b < bands; b++) {
        const top = Math.floor(rnd() * rows);
        const height = 1 + Math.floor(rnd() * Math.max(2, rows * 0.03));
        const shift = Math.floor(rnd() * 8);
        for (let y = top; y < Math.min(rows, top + height); y++) {
          for (let x = 0; x < cols; x++) {
            const t = threshold(x + shift, y);
            px[y * cols + x] = t < 0.42 ? DROPOUT : t > 0.9 ? INK : 0;
          }
        }
      }
    }
    ctx.putImageData(g.image, 0, 0);
  };

  let stopLoop: () => void = () => undefined;
  let signal: AbortSignal | undefined;
  let cover: HTMLElement | null = null;
  const tick = (now: number): boolean => {
    if (signal?.aborted) { teardown(); return false; }
    if (now - t0 < DECODE_MS) { decodeFrame(now); return true; }
    if (!idle) {
      idle = true;
      g = grid(canvas, ctx, DECODE_CELLS[DECODE_CELLS.length - 1]!);
    }
    burstFrame(now);
    // Idle between bursts: no frames until the next glitch asks for one.
    return now - burstT0 < BURST_MS;
  };

  const onGlitch = () => {
    if (!idle || document.hidden) return;
    const resume = performance.now() - burstT0 >= BURST_MS;
    burstT0 = performance.now();
    burstSeed = (burstT0 * 1000) >>> 0;
    if (resume) stopLoop = loop(canvas, tick);
  };

  function teardown(): void {
    stopLoop();
    canvas.remove();
    cover?.removeEventListener('xw:intro-glitch', onGlitch);
    window.removeEventListener('xw:intro-ready', teardown);
    signal?.removeEventListener('abort', teardown);
  }

  return {
    start(target, abort) {
      if (cover || !canvas.isConnected || abort?.aborted) { teardown(); return; }
      cover = target;
      signal = abort;
      // Above the fallback map's SVG, below every HUD element and its text.
      canvas.classList.remove('xw-intro-decode--held');
      const map = target.querySelector(':scope > .xw-zi-map');
      if (map) map.after(canvas);
      else target.prepend(canvas);
      t0 = performance.now();
      target.addEventListener('xw:intro-glitch', onGlitch);
      window.addEventListener('xw:intro-ready', teardown, { once: true });
      signal?.addEventListener('abort', teardown, { once: true });
      stopLoop = loop(canvas, tick);
    },
    cancel: teardown,
  };
}
