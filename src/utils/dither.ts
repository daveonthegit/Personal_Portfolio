/**
 * Ordered-dither "feed" treatment for a few chosen images (ctOS / DedSec spirit).
 *
 * Clean-room implementation of public-domain techniques: a recursively generated
 * Bayer threshold matrix, 1-bit quantisation against the site's own ink/surface
 * tokens, scanlines, and banded glitch slips. One shared WebGL2 context renders
 * each placement at cell resolution into that placement's own 2D canvas, which CSS
 * upscales with `image-rendering: pixelated` — the retro look is also the budget.
 *
 * Placements opt in with `data-xw-dither` on the image's wrapper:
 *  - `portrait` — the Dossier photo decodes from the feed once the intro hands off
 *    (and whenever it scrolls back in); rare glitch bursts while it is on screen.
 *  - `card`     — project media rest as dithered evidence feeds and resolve to the
 *    real screenshot on hover/focus (touch: while the card crosses mid-screen).
 *  - `decode`   — the project dialog's preview decodes each time it opens.
 *
 * Progressive enhancement: the <img> (with its alt) stays in place under an
 * aria-hidden canvas. No JS, no WebGL2 or a lost context leaves the plain image.
 * Rendering is on demand — only visible placements draw, animation runs only while
 * a transition or glitch is in flight, and reduced motion gets static frames.
 */

type Mode = 'portrait' | 'card' | 'decode';

interface ModeSpec {
  /** CSS pixels per dither cell. */
  cell: number;
  /** Reveal value at rest: 0 = fully dithered, 1 = the clean image. */
  rest: 0 | 1;
  contrast: number;
  bias: number;
  /** Decode (0 → 1) whenever the placement enters view. */
  decodeOnEnter: boolean;
  /** Occasional glitch bursts while visible. */
  ambient: boolean;
}

const MODES: Record<Mode, ModeSpec> = {
  portrait: { cell: 2, rest: 1, contrast: 1.25, bias: 0, decodeOnEnter: true, ambient: true },
  card: { cell: 2, rest: 0, contrast: 1.15, bias: 0, decodeOnEnter: false, ambient: false },
  decode: { cell: 2, rest: 1, contrast: 1.15, bias: 0, decodeOnEnter: true, ambient: false },
};

const FRAME_MS = 1000 / 30;
const DECODE_MS = 900;
const HOVER_MS = 380;
const GLITCH_MS = 220;
/** Longest texture edge; placements render at ~200 cells, so more is wasted memory. */
const MAX_TEXTURE = 640;

/** Bayer index matrix by its recursive definition: M₂ₙ = [[4M, 4M+2], [4M+3, 4M+1]]. */
export function bayerMatrix(n: number): number[][] {
  if (n <= 1) return [[0]];
  const half = n / 2;
  const m = bayerMatrix(half);
  const quadrant = [[0, 2], [3, 1]];
  return Array.from({ length: n }, (_, y) =>
    Array.from({ length: n }, (_, x) =>
      4 * (m[y % half]?.[x % half] ?? 0) + (quadrant[Math.floor(y / half)]?.[Math.floor(x / half)] ?? 0)));
}

const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uImage;
uniform sampler2D uBayer;
uniform vec2 uGrid;
uniform vec4 uCrop;
uniform vec3 uLo;
uniform vec3 uHi;
uniform vec3 uAccent;
uniform float uContrast;
uniform float uBias;
uniform float uGamma;
uniform float uReveal;
uniform float uGlitch;
uniform float uSeed;
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float threshold(vec2 c) { return texelFetch(uBayer, ivec2(mod(c, 8.0)), 0).r; }

void main() {
  vec2 cell = vec2(floor(gl_FragCoord.x), uGrid.y - 1.0 - floor(gl_FragCoord.y));

  // Glitch: a few horizontal bands slip sideways; some take the accent.
  float bandRows = 2.0 + floor(hash(vec2(uSeed, 7.0)) * 6.0);
  float band = floor(cell.y / bandRows);
  float hit = hash(vec2(band, uSeed)) < uGlitch * 0.3 ? 1.0 : 0.0;
  float tint = hit * step(0.55, hash(vec2(band, uSeed + 2.0)));
  float slip = floor((hash(vec2(band, uSeed + 1.0)) - 0.5) * uGrid.x * 0.16) * hit;
  vec2 src = vec2(clamp(cell.x + slip, 0.0, uGrid.x - 1.0), cell.y);

  vec3 rgb = texture(uImage, uCrop.xy + (src + 0.5) / uGrid * uCrop.zw).rgb;
  // Per-image gamma pulls the mean toward mid-density; the cap keeps white
  // surfaces stippled rather than a solid slab against the dark UI.
  float lum = pow(dot(rgb, vec3(0.2126, 0.7152, 0.0722)), uGamma);
  lum = clamp((lum - 0.5) * uContrast + 0.5 + uBias, 0.0, 1.0) * 0.74;

  vec3 col = lum > threshold(cell) ? mix(uHi, uAccent, tint) : uLo;
  col = mix(col, uLo, step(2.0, mod(cell.y, 3.0)) * 0.25);

  // Decode front: a top-down sweep with a dithered edge; glitched bands stay feed.
  float key = 0.55 * (cell.y / uGrid.y) + 0.45 * threshold(floor(cell / 2.0) + 3.0);
  bool clear = key < uReveal * 1.02 - 0.01 && hit < 0.5;
  outColor = clear ? vec4(0.0) : vec4(col, 1.0);
}`;

type RGB = [number, number, number];

interface Texture { tex: WebGLTexture; w: number; h: number; gamma: number }

/** Mean luminance a dithered image is normalised toward. */
const TARGET_MEAN = 0.3;

interface DrawParams {
  cols: number;
  rows: number;
  crop: [number, number, number, number];
  lo: RGB;
  hi: RGB;
  accent: RGB;
  contrast: number;
  bias: number;
  reveal: number;
  glitch: number;
  seed: number;
}

class Renderer {
  readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext;
  private readonly uniforms = new Map<string, WebGLUniformLocation | null>();
  private readonly textures = new Map<string, Texture>();
  private readonly scratch = document.createElement('canvas');
  private readonly stats = document.createElement('canvas').getContext('2d', { willReadFrequently: true });

  private constructor(gl: WebGL2RenderingContext, private readonly program: WebGLProgram) {
    this.gl = gl;
    this.canvas = gl.canvas as HTMLCanvasElement;
    gl.useProgram(program);
    for (const name of ['uImage', 'uBayer', 'uGrid', 'uCrop', 'uLo', 'uHi', 'uAccent', 'uContrast', 'uBias', 'uGamma', 'uReveal', 'uGlitch', 'uSeed']) {
      this.uniforms.set(name, gl.getUniformLocation(program, name));
    }
    gl.uniform1i(this.u('uImage'), 0);
    gl.uniform1i(this.u('uBayer'), 1);

    const ranks = bayerMatrix(8).flat().map((r) => Math.round(((r + 0.5) / 64) * 255));
    const bayer = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bayer);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 8, 8, 0, gl.RED, gl.UNSIGNED_BYTE, new Uint8Array(ranks));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindVertexArray(gl.createVertexArray());
  }

  static create(onLost: () => void): Renderer | null {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        powerPreference: 'low-power',
      });
    } catch {
      gl = null;
    }
    if (!gl) return null;
    const program = link(gl);
    if (!program) {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return null;
    }
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      onLost();
    }, { once: true });
    return new Renderer(gl, program);
  }

  private u(name: string): WebGLUniformLocation | null {
    return this.uniforms.get(name) ?? null;
  }

  /** The image's texture, uploading (downscaled) on first use; null until decoded. */
  texture(img: HTMLImageElement): Texture | null {
    const key = img.currentSrc || img.src;
    if (!key || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return null;
    const cached = this.textures.get(key);
    if (cached) return cached;

    const scale = Math.min(1, MAX_TEXTURE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    this.scratch.width = w;
    this.scratch.height = h;
    const ctx = this.scratch.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, w, h);
    try {
      ctx.drawImage(img, 0, 0, w, h);
    } catch {
      return null;
    }

    const gl = this.gl;
    const tex = gl.createTexture();
    if (!tex) return null;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.scratch);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const entry = { tex, w: img.naturalWidth, h: img.naturalHeight, gamma: this.gammaFor(this.scratch) };
    this.textures.set(key, entry);
    return entry;
  }

  /** Gamma mapping the image's mean luminance to TARGET_MEAN, from a 16×16 sample. */
  private gammaFor(source: HTMLCanvasElement): number {
    const ctx = this.stats;
    if (!ctx) return 1;
    ctx.canvas.width = ctx.canvas.height = 16;
    ctx.drawImage(source, 0, 0, 16, 16);
    const px = ctx.getImageData(0, 0, 16, 16).data;
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) {
      sum += (0.2126 * (px[i] ?? 0) + 0.7152 * (px[i + 1] ?? 0) + 0.0722 * (px[i + 2] ?? 0)) / 255;
    }
    const mean = Math.min(0.97, Math.max(0.03, sum / (px.length / 4)));
    return Math.min(2.2, Math.max(0.6, Math.log(TARGET_MEAN) / Math.log(mean)));
  }

  /** Draws one placement into the shared buffer and copies it to `target`. */
  draw(texture: Texture, p: DrawParams, target: CanvasRenderingContext2D): void {
    const gl = this.gl;
    if (this.canvas.width < p.cols || this.canvas.height < p.rows) {
      this.canvas.width = Math.max(this.canvas.width, p.cols);
      this.canvas.height = Math.max(this.canvas.height, p.rows);
    }
    gl.viewport(0, 0, p.cols, p.rows);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture.tex);
    gl.uniform2f(this.u('uGrid'), p.cols, p.rows);
    gl.uniform4f(this.u('uCrop'), ...p.crop);
    gl.uniform3f(this.u('uLo'), ...p.lo);
    gl.uniform3f(this.u('uHi'), ...p.hi);
    gl.uniform3f(this.u('uAccent'), ...p.accent);
    gl.uniform1f(this.u('uContrast'), p.contrast);
    gl.uniform1f(this.u('uBias'), p.bias);
    gl.uniform1f(this.u('uGamma'), texture.gamma);
    gl.uniform1f(this.u('uReveal'), p.reveal);
    gl.uniform1f(this.u('uGlitch'), p.glitch);
    gl.uniform1f(this.u('uSeed'), p.seed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // The viewport sits at the buffer's bottom-left; copy within the same task.
    target.clearRect(0, 0, p.cols, p.rows);
    target.drawImage(this.canvas, 0, this.canvas.height - p.rows, p.cols, p.rows, 0, 0, p.cols, p.rows);
  }

  dispose(): void {
    this.textures.forEach((t) => this.gl.deleteTexture(t.tex));
    this.textures.clear();
    this.gl.deleteProgram(this.program);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

function link(gl: WebGL2RenderingContext): WebGLProgram | null {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

/* ─────────────────────────────── colour tokens ─────────────────────────────── */

const probe = document.createElement('canvas').getContext('2d');

function parseColor(value: string, fallback: RGB): RGB {
  if (!probe || !value.trim()) return fallback;
  probe.fillStyle = '#000';
  probe.fillStyle = value.trim();
  const v = String(probe.fillStyle);
  if (v.startsWith('#') && v.length === 7) {
    return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16) / 255) as RGB;
  }
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (!m?.[1]) return fallback;
  const [r, g, b, a = '1'] = m[1].split(',').map((s) => s.trim());
  if (Number(a) === 0) return fallback;
  return [Number(r) / 255, Number(g) / 255, Number(b) / 255];
}

const luminance = (c: RGB) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

/** Surface (the wrapper's background), ink and accent; lighter of ink/surface lights up. */
function readPalette(host: HTMLElement): { lo: RGB; hi: RGB; accent: RGB } {
  const root = getComputedStyle(document.documentElement);
  const surface = parseColor(getComputedStyle(host).backgroundColor, parseColor(root.getPropertyValue('--xw-bg'), [0.04, 0.04, 0.035]));
  const ink = parseColor(root.getPropertyValue('--xw-ink'), [0.96, 0.94, 0.9]);
  const accent = parseColor(root.getPropertyValue('--xw-accent'), [0, 0.82, 1]);
  return luminance(ink) >= luminance(surface) ? { lo: surface, hi: ink, accent } : { lo: ink, hi: surface, accent };
}

/** UV crop replicating `object-fit: cover` with the image's object-position. */
function coverCrop(img: HTMLImageElement, boxW: number, boxH: number, tex: Texture): [number, number, number, number] {
  const scale = Math.max(boxW / tex.w, boxH / tex.h);
  const fx = Math.min(1, boxW / (tex.w * scale));
  const fy = Math.min(1, boxH / (tex.h * scale));
  const [px, py] = getComputedStyle(img).objectPosition.split(/\s+/).map((v) => (v.endsWith('%') ? parseFloat(v) / 100 : 0.5));
  return [(1 - fx) * (px ?? 0.5), (1 - fy) * (py ?? 0.5), fx, fy];
}

/* ──────────────────────────────── placements ──────────────────────────────── */

interface Placement {
  host: HTMLElement;
  img: HTMLImageElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  spec: ModeSpec;
  palette: ReturnType<typeof readPalette>;
  cols: number;
  rows: number;
  visible: boolean;
  /** Reveal transition: from → to, starting at `t0` and lasting `dur` ms. */
  from: number;
  to: number;
  t0: number;
  dur: number;
  glitchT0: number;
  glitchPeak: number;
  dirty: boolean;
  ambientTimer?: number;
  cleanup: Array<() => void>;
}

const ease = (p: number) => 1 - (1 - p) ** 3;

function revealAt(pl: Placement, now: number): number {
  const p = pl.dur > 0 ? Math.min(1, Math.max(0, (now - pl.t0) / pl.dur)) : 1;
  return pl.from + (pl.to - pl.from) * ease(p);
}

function glitchAt(pl: Placement, now: number): number {
  const p = (now - pl.glitchT0) / GLITCH_MS;
  return p >= 0 && p < 1 ? pl.glitchPeak * (1 - p) : 0;
}

function animating(pl: Placement, now: number): boolean {
  return (pl.dur > 0 && now - pl.t0 < pl.dur) || glitchAt(pl, now) > 0;
}

export function initDither(): () => void {
  const body = document.body;
  if (!body || typeof IntersectionObserver === 'undefined' || typeof ResizeObserver === 'undefined') return () => undefined;

  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const touch = matchMedia('(hover: none)').matches;
  const placements = new Map<HTMLElement, Placement>();
  let renderer: Renderer | null = null;
  let disabled = false;
  let raf = 0;
  let lastFrame = 0;
  let scanQueued = false;

  const reduced = () => reducedQuery.matches;
  const bootDone = () => body.classList.contains('xw-boot-done');

  const ensureRenderer = (): Renderer | null => {
    if (renderer || disabled) return renderer;
    renderer = Renderer.create(() => teardown());
    if (!renderer) disabled = true;
    return renderer;
  };

  const draw = (pl: Placement, now: number) => {
    pl.dirty = false;
    const reveal = revealAt(pl, now);
    const glitch = glitchAt(pl, now);
    if (reveal >= 1 && glitch === 0) {
      pl.canvas.classList.add('is-clear');
      return;
    }
    const r = ensureRenderer();
    const tex = r?.texture(pl.img);
    if (!r || !tex || pl.cols < 1 || pl.rows < 1) {
      // Not decoded yet (or no GPU): the plain image shows meanwhile.
      pl.canvas.classList.add('is-clear');
      pl.dirty = true;
      return;
    }
    r.draw(tex, {
      cols: pl.cols,
      rows: pl.rows,
      crop: coverCrop(pl.img, pl.cols, pl.rows, tex),
      ...pl.palette,
      contrast: pl.spec.contrast,
      bias: pl.spec.bias,
      reveal,
      glitch,
      seed: Math.floor(now / 70) % 997,
    }, pl.ctx);
    pl.canvas.classList.remove('is-clear');
  };

  const frame = (now: number) => {
    raf = 0;
    if (now - lastFrame < FRAME_MS) {
      raf = requestAnimationFrame(frame);
      return;
    }
    lastFrame = now;
    let more = false;
    placements.forEach((pl) => {
      if (!pl.visible) return;
      const active = animating(pl, now);
      if (active || pl.dirty) draw(pl, now);
      if (active) {
        // One more frame after the last animated one settles exactly at rest.
        pl.dirty = true;
        more = true;
      }
    });
    if (more && !disabled) raf = requestAnimationFrame(frame);
  };

  const schedule = () => {
    if (!raf && !disabled) raf = requestAnimationFrame(frame);
  };

  /** Moves a placement's reveal toward `to`; reduced motion jumps straight there. */
  const transition = (pl: Placement, to: number, dur: number, from?: number) => {
    const now = performance.now();
    const motion = !reduced();
    pl.from = motion ? from ?? revealAt(pl, now) : to;
    pl.to = to;
    pl.t0 = now;
    pl.dur = motion ? dur : 0;
    pl.dirty = true;
    schedule();
  };

  const glitch = (pl: Placement, peak: number) => {
    if (reduced() || document.hidden) return;
    pl.glitchT0 = performance.now();
    pl.glitchPeak = peak;
    schedule();
  };

  const decode = (pl: Placement) => {
    transition(pl, 1, DECODE_MS, 0);
    glitch(pl, 0.7);
  };

  const scheduleAmbient = (pl: Placement) => {
    window.clearTimeout(pl.ambientTimer);
    pl.ambientTimer = window.setTimeout(() => {
      if (pl.visible && bootDone() && !document.hidden && !animating(pl, performance.now())) glitch(pl, 0.55);
      scheduleAmbient(pl);
    }, 5000 + Math.random() * 6000);
  };

  const viewIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const pl = placements.get(entry.target as HTMLElement);
      if (!pl) return;
      const was = pl.visible;
      pl.visible = entry.isIntersecting;
      if (!pl.visible) {
        // Offscreen: settle at rest. Decoders pre-draw their feed now so the
        // clean image never flashes before the replay on return.
        const replays = pl.spec.decodeOnEnter && bootDone() && !reduced();
        pl.from = pl.to = replays ? 0 : pl.spec.rest;
        pl.dur = 0;
        pl.glitchPeak = 0;
        pl.dirty = true;
        if (replays && was) draw(pl, performance.now());
        return;
      }
      // A swapped, still-loading source must not show the previous image's feed.
      if (!renderer?.texture(pl.img)) pl.canvas.classList.add('is-clear');
      if (!was && pl.spec.decodeOnEnter && bootDone() && !reduced()) decode(pl);
      else schedule();
    });
  }, { rootMargin: '120px 0px' });

  // Touch has no hover: a card resolves while it crosses the middle of the screen.
  const bandIO = touch
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const pl = placements.get(entry.target as HTMLElement);
        if (pl) transition(pl, entry.isIntersecting ? 1 : 0, HOVER_MS);
      });
    }, { rootMargin: '-38% 0px -38% 0px' })
    : null;

  const resizeIO = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const pl = placements.get(entry.target as HTMLElement);
      if (!pl) return;
      const { width, height } = entry.contentRect;
      const cols = Math.max(1, Math.round(width / pl.spec.cell));
      const rows = Math.max(1, Math.round(height / pl.spec.cell));
      if (cols === pl.cols && rows === pl.rows) return;
      pl.cols = pl.canvas.width = cols;
      pl.rows = pl.canvas.height = rows;
      pl.dirty = true;
    });
    schedule();
  });

  const mount = (host: HTMLElement) => {
    const mode = host.dataset.xwDither as Mode;
    const spec = MODES[mode];
    const img = host.querySelector<HTMLImageElement>('img');
    if (!spec || !img) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'xw-dither-canvas is-clear';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    img.after(canvas);
    host.classList.add('xw-dither');

    // The portrait waits under the boot cover as feed, then decodes on hand-off.
    const startDithered = spec.rest === 0 || (mode === 'portrait' && !bootDone() && !reduced());
    const rest = startDithered ? 0 : spec.rest;
    const pl: Placement = {
      host, img, canvas, ctx, spec,
      palette: readPalette(host),
      cols: 0, rows: 0, visible: false,
      from: rest, to: rest, t0: 0, dur: 0,
      glitchT0: 0, glitchPeak: 0,
      dirty: true,
      cleanup: [],
    };
    placements.set(host, pl);

    const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
      el.addEventListener(type, fn);
      pl.cleanup.push(() => el.removeEventListener(type, fn));
    };

    // New source (the dialog swaps it per project) or a late lazy decode.
    on(img, 'load', () => {
      pl.dirty = true;
      if (pl.visible && spec.decodeOnEnter && bootDone() && !reduced()) decode(pl);
      else schedule();
    });

    if (mode === 'card') {
      const card = host.closest<HTMLElement>('.xw-work-card, .xw-proj-card') ?? host;
      if (bandIO) {
        bandIO.observe(host);
        pl.cleanup.push(() => bandIO.unobserve(host));
      } else {
        on(card, 'pointerenter', (e) => { if (e.pointerType !== 'touch') { transition(pl, 1, HOVER_MS); glitch(pl, 0.35); } });
        on(card, 'pointerleave', (e) => { if (e.pointerType !== 'touch' && !card.contains(document.activeElement)) transition(pl, 0, HOVER_MS); });
      }
      on(card, 'focusin', () => transition(pl, 1, HOVER_MS));
      on(card, 'focusout', (e) => { if (!card.contains(e.relatedTarget as Node | null)) transition(pl, 0, HOVER_MS); });
    }

    if (spec.ambient) {
      scheduleAmbient(pl);
      on(host, 'pointerenter', (e) => { if (e.pointerType === 'mouse' && !animating(pl, performance.now())) glitch(pl, 0.6); });
    }

    viewIO.observe(host);
    resizeIO.observe(host);
  };

  const unmount = (pl: Placement) => {
    window.clearTimeout(pl.ambientTimer);
    pl.cleanup.forEach((fn) => fn());
    viewIO.unobserve(pl.host);
    resizeIO.unobserve(pl.host);
    pl.canvas.remove();
    pl.host.classList.remove('xw-dither');
    placements.delete(pl.host);
  };

  const scan = () => {
    scanQueued = false;
    if (disabled) return;
    placements.forEach((pl) => { if (!pl.host.isConnected) unmount(pl); });
    document.querySelectorAll<HTMLElement>('[data-xw-dither]').forEach((host) => {
      if (!placements.has(host)) mount(host);
    });
  };

  const queueScan = () => {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(scan);
  };

  // Windows adopt fetched articles and panels re-render: track placements as they come and go.
  const domMO = new MutationObserver(queueScan);
  domMO.observe(body, { childList: true, subtree: true });

  // Theme switches swap the tokens the palette is read from.
  const themeMO = new MutationObserver(() => {
    placements.forEach((pl) => { pl.palette = readPalette(pl.host); pl.dirty = true; });
    schedule();
  });
  themeMO.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  themeMO.observe(body, { attributes: true, attributeFilter: ['class'] });

  // Each intro hand-off (including Replay) decodes the portrait again.
  const onIntroReady = () => {
    placements.forEach((pl) => {
      if (pl.host.dataset.xwDither !== 'portrait') return;
      if (pl.visible && !reduced()) decode(pl);
      else { pl.from = pl.to = 1; pl.dur = 0; pl.dirty = true; }
    });
    schedule();
  };
  window.addEventListener('xw:intro-ready', onIntroReady);

  const onVisibility = () => { if (!document.hidden) schedule(); };
  document.addEventListener('visibilitychange', onVisibility);

  function teardown(): void {
    disabled = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    placements.forEach(unmount);
    domMO.disconnect();
    themeMO.disconnect();
    viewIO.disconnect();
    bandIO?.disconnect();
    resizeIO.disconnect();
    window.removeEventListener('xw:intro-ready', onIntroReady);
    document.removeEventListener('visibilitychange', onVisibility);
    renderer?.dispose();
    renderer = null;
  }

  scan();
  return teardown;
}
