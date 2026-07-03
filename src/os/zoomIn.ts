/**
 * Zoom-In cinematic — stepped acquisition ladder (region → metro → grid → block).
 *
 * Grammar (per design session):
 *  - SEARCH at every rung: candidate boxes flicker across wrong targets before
 *    the real box draws and commits.
 *  - STEPPED camera: each dive is a run of discrete zoom snaps — reprojection,
 *    not a camera flight — with a 1-frame jitter on every snap.
 *  - LOCK-ON finale: oversized corner brackets converge onto the subject block
 *    in snap steps, a profiler card (photo, name, role — real data) slides out
 *    of the locked box, and the CARD expands into the Dossier window.
 *
 * Performance notes: no SVG filters (blur re-rasterizes per transform); hidden
 * layers use autoAlpha so they stop painting; dives repaint only on snap steps.
 *
 * Rules (CONTEXT.md): skippable at any moment (button/Escape); plays only on
 * the front door; readouts are true values derived from the camera transform.
 */

import { gsap } from 'gsap';
import { regionMapSvg, HOPS, NYC } from './map';
import { PROJ } from './mapdata';

const DIVE_STEPS = 6;

/** Mount the opaque overlay beneath the boot cover (z below its 10000). */
export function mountZoomInCover(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'xw-zoomin';
  overlay.innerHTML = `
    ${regionMapSvg()}
    <div class="xw-zi-sweep" id="xw-zi-sweep" aria-hidden="true"></div>
    <div class="xw-zi-chip" id="xw-zi-chip" aria-hidden="true"></div>
    <div id="xw-zi-lock" aria-hidden="true">
      <span class="xw-zi-bkt xw-zi-bkt--tl"></span>
      <span class="xw-zi-bkt xw-zi-bkt--tr"></span>
      <span class="xw-zi-bkt xw-zi-bkt--bl"></span>
      <span class="xw-zi-bkt xw-zi-bkt--br"></span>
      <span class="xw-zi-lockrect" id="xw-zi-lockrect"></span>
      <span class="xw-zi-connector" id="xw-zi-connector"></span>
      <div class="xw-zi-card" id="xw-zi-card">
        <img class="xw-zi-card-photo" src="/static/images/Profile_Picture.jpg" alt="" />
        <div class="xw-zi-card-body">
          <span class="xw-zi-card-name">XIAO, DAVID</span>
          <span class="xw-zi-card-line">WEB DEVELOPER — SECCO SQUARED</span>
          <span class="xw-zi-card-line">NEW YORK, NY</span>
          <span class="xw-zi-card-foot">ACCESSING FILE…</span>
        </div>
      </div>
    </div>
    <div class="xw-zi-readout" aria-hidden="true">
      <span id="xw-zi-coords"></span>
      <span id="xw-zi-alt"></span>
    </div>
    <div class="xw-zi-status" id="xw-zi-status" role="status" aria-live="polite"></div>
    <button type="button" class="xw-zi-skip" id="xw-zi-skip">Bypass ▸</button>`;
  document.body.appendChild(overlay);
  return overlay;
}

export function removeZoomIn(overlay: HTMLElement): void {
  overlay.remove();
}

interface Cam {
  cx: number;
  cy: number;
  s: number;
}

interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

function formatAlt(s: number): string {
  const km = 240 / s;
  if (km >= 10) return `ALT ${Math.round(km)} KM`;
  if (km >= 1) return `ALT ${km.toFixed(1)} KM`;
  return `ALT ${Math.round(km * 1000)} M`;
}

function formatCoords(cam: Cam): string {
  const lat = PROJ.nyc.lat - (cam.cy - NYC.y) / PROJ.pxPerLat;
  const lon = PROJ.nyc.lon + (cam.cx - NYC.x) / PROJ.pxPerLon;
  return `${lat.toFixed(4)}° N  ${Math.abs(lon).toFixed(4)}° W`;
}

/**
 * Run the ladder on a previously mounted overlay. `onReveal` fires when the
 * desktop handoff starts (mark boot done / canonicalize URL there).
 */
export function playZoomIn(overlay: HTMLElement, onReveal: () => void): void {
  const cam$ = overlay.querySelector<SVGGElement>('#xw-zi-cam');
  const chip = overlay.querySelector<HTMLElement>('#xw-zi-chip');
  const status = overlay.querySelector<HTMLElement>('#xw-zi-status');
  const coords = overlay.querySelector<HTMLElement>('#xw-zi-coords');
  const alt = overlay.querySelector<HTMLElement>('#xw-zi-alt');
  const skipBtn = overlay.querySelector<HTMLButtonElement>('#xw-zi-skip');
  const card = overlay.querySelector<HTMLElement>('#xw-zi-card');

  if (!cam$ || !chip || !status || !coords || !alt || !skipBtn || !card) {
    overlay.remove();
    onReveal();
    return;
  }

  const cam: Cam = { cx: NYC.x, cy: NYC.y, s: 1 };
  const applyCam = () => {
    cam$.setAttribute(
      'transform',
      `translate(${500 - cam.cx * cam.s} ${350 - cam.cy * cam.s}) scale(${cam.s})`,
    );
    coords.textContent = formatCoords(cam);
    alt.textContent = formatAlt(cam.s);
  };
  applyCam();

  let finished = false;
  let revealed = false;
  let lockTl: gsap.core.Timeline | null = null;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    onReveal();
  };
  const finish = (fast: boolean) => {
    if (finished) return;
    finished = true;
    tl.kill();
    lockTl?.kill();
    document.removeEventListener('keydown', onKey);
    reveal();
    gsap.to(overlay, {
      opacity: 0,
      duration: fast ? 0.15 : 0.3,
      ease: 'power2.out',
      onComplete: () => overlay.remove(),
    });
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') finish(true);
  };
  document.addEventListener('keydown', onKey);
  skipBtn.addEventListener('click', () => finish(true));

  const setStatus = (text: string) => {
    status.textContent = text;
  };

  /** Place the HTML label chip against a box's current screen rect. */
  const placeChip = (boxId: string, text: string) => {
    const rectEl = overlay.querySelector<SVGGraphicsElement>(`#${boxId} .xw-zi-boxrect`);
    if (!rectEl) return;
    const r = rectEl.getBoundingClientRect();
    chip.textContent = text;
    chip.style.left = `${Math.max(8, r.left)}px`;
    chip.style.top = `${Math.max(8, r.top - 30)}px`;
    gsap.set(chip, { opacity: 1 });
  };
  const hideChip = () => gsap.set(chip, { opacity: 0 });

  /** 1-frame reprojection jitter — fired on every zoom snap. */
  const glitch = () => {
    gsap.fromTo(
      '#xw-zi-map',
      { x: gsap.utils.random(-4, 4, 1), y: gsap.utils.random(-2, 2, 1) },
      { x: 0, y: 0, duration: 0.07 },
    );
  };

  /** Stepped dive: discrete zoom snaps, log-interpolated scale. */
  const steppedDive = (to: { cx: number; cy: number; s: number }, duration: number) => {
    // `from` is captured at tween START (the timeline is built up-front, but
    // each dive must begin from wherever the previous dive left the camera).
    const from = { cx: 0, cy: 0, s: 1 };
    const proxy = { t: 0 };
    let lastStep = -1;
    return gsap.to(proxy, {
      t: 1,
      duration,
      ease: 'none',
      onStart: () => {
        from.cx = cam.cx;
        from.cy = cam.cy;
        from.s = cam.s;
        lastStep = -1;
      },
      onUpdate: () => {
        const q = Math.min(DIVE_STEPS, Math.floor(proxy.t * DIVE_STEPS)) / DIVE_STEPS;
        const step = Math.round(q * DIVE_STEPS);
        if (step === lastStep) return;
        lastStep = step;
        cam.s = from.s * Math.pow(to.s / from.s, q);
        cam.cx = from.cx + (to.cx - from.cx) * q;
        cam.cy = from.cy + (to.cy - from.cy) * q;
        applyCam();
        if (step > 0) glitch();
      },
      onComplete: () => {
        cam.s = to.s;
        cam.cx = to.cx;
        cam.cy = to.cy;
        applyCam();
      },
    });
  };

  gsap.set('#xw-zi-map', { opacity: 0 });
  gsap.set('.xw-zi-city', { opacity: 0 });
  gsap.set('#xw-zi-sweep', { opacity: 0 });
  // Hidden layers stop painting entirely until their rung (autoAlpha ⇒ visibility).
  gsap.set('#xw-zi-metro-layer, #xw-zi-grid-layer, #xw-zi-block-layer', { autoAlpha: 0 });
  gsap.set('.xw-zi-bkt, #xw-zi-lockrect, #xw-zi-connector, #xw-zi-card', { autoAlpha: 0 });

  const tl = gsap.timeline();

  // ── View 0: the seaboard resolves, night lights first ──
  tl.add(() => setStatus('Acquiring — northeast corridor'), 0)
    .to('#xw-zi-map', { opacity: 1, duration: 0.25 }, 0)
    .to('#xw-zi-sweep', { opacity: 1, duration: 0.3 }, 0.1)
    .to('.xw-zi-city', { opacity: 1, duration: 0.15, stagger: 0.05 }, 0.1);

  // Layer crossfades per dive.
  const diveFades: Array<Array<[string, number]>> = [
    [['#xw-zi-region-labels', 0], ['#xw-zi-lights', 0], ['#xw-zi-metro-layer', 1], ['#xw-zi-graticule', 0]],
    [['#xw-zi-region-layer', 0], ['#xw-zi-metro-layer', 0.45], ['#xw-zi-metro-labels', 0], ['#xw-zi-grid-layer', 1]],
    [['#xw-zi-metro-layer', 0], ['#xw-zi-block-layer', 1]],
  ];

  HOPS.forEach((hop, i) => {
    const boxSel = `#xw-zi-box-${i}`;

    // Search: flicker across the wrong targets first.
    hop.candidates.forEach((cand, j) => {
      const candSel = `#xw-zi-cand-${i}-${j}`;
      tl.add(() => placeChip(`xw-zi-cand-${i}-${j}`, cand.label))
        .to(candSel, { opacity: 1, duration: 0.04 })
        .to({}, { duration: 0.08 })
        .to(candSel, { opacity: 0, duration: 0.03 })
        .add(() => glitch());
    });

    // Commit: the real box draws…
    tl.add(() => placeChip(`xw-zi-box-${i}`, hop.label))
      .fromTo(boxSel, { opacity: 0 }, { opacity: 1, duration: 0.12 })
      .to({}, { duration: 0.14 })
      // …and the camera snaps into it.
      .add(() => {
        setStatus(hop.status);
        hideChip();
      })
      .to('#xw-zi-sweep', { opacity: 0, duration: 0.15 }, '<')
      .add(steppedDive(hop.cam, 0.6))
      .to(boxSel, { opacity: 0, duration: 0.2 }, '<+0.15');
    (diveFades[i] ?? []).forEach(([sel, target]) => {
      tl.to(sel, { autoAlpha: target, duration: 0.45 }, '<');
    });
    tl.to('#xw-zi-sweep', { opacity: i < HOPS.length - 1 ? 1 : 0.4, duration: 0.25 }, '<');
  });

  tl.add(() => lockOn());

  /* ── Lock-on finale: converging brackets → profiler card → window ────────── */

  const bracketFrame = (r: RectLike, spread: number) => {
    // Rect inflated by `spread` px, brackets pinned to its corners.
    const x0 = r.left - spread;
    const y0 = r.top - spread;
    const x1 = r.left + r.width + spread;
    const y1 = r.top + r.height + spread;
    gsap.set('.xw-zi-bkt--tl', { left: x0 - 18, top: y0 - 18 });
    gsap.set('.xw-zi-bkt--tr', { left: x1, top: y0 - 18 });
    gsap.set('.xw-zi-bkt--bl', { left: x0 - 18, top: y1 });
    gsap.set('.xw-zi-bkt--br', { left: x1, top: y1 });
  };

  const lockOn = () => {
    if (finished) return;
    const anchor = overlay
      .querySelector<SVGGraphicsElement>('#xw-zi-box-lock .xw-zi-boxrect')
      ?.getBoundingClientRect();
    if (!anchor) {
      finish(false);
      return;
    }

    setStatus('Subject located');
    const spreads = [240, 96, 30, 6];
    lockTl = gsap.timeline();

    spreads.forEach((spread, i) => {
      lockTl!
        .add(() => {
          bracketFrame(anchor, spread);
          if (i === 0) gsap.set('.xw-zi-bkt', { autoAlpha: 1 });
          glitch();
        })
        .to({}, { duration: 0.09 });
    });

    lockTl
      .add(() => {
        overlay.querySelector('#xw-zi-lock')?.classList.add('xw-zi-lock--captured');
        gsap.set('#xw-zi-lockrect', {
          autoAlpha: 1,
          left: anchor.left - 6,
          top: anchor.top - 6,
          width: anchor.width + 12,
          height: anchor.height + 12,
        });
      })
      .to({}, { duration: 0.14 })
      // Connector line extends out of the locked box…
      .add(() => {
        gsap.set('#xw-zi-connector', {
          autoAlpha: 1,
          left: anchor.left + anchor.width + 6,
          top: anchor.top + anchor.height / 2,
          width: 0,
        });
      })
      .to('#xw-zi-connector', { width: 36, duration: 0.12 })
      // …into the profiler card.
      .add(() => {
        gsap.set(card, {
          left: anchor.left + anchor.width + 42,
          top: Math.max(16, anchor.top - 24),
        });
      })
      .fromTo(card, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.2 })
      .add(() => setStatus('Subject located — opening file'))
      .to({}, { duration: 0.6 })
      .add(() => cardToWindow());
  };

  /** The profiler card becomes the Dossier window. */
  const cardToWindow = () => {
    if (finished) return;
    finished = true;
    document.removeEventListener('keydown', onKey);

    reveal(); // desktop beneath becomes the live page (URL, boot classes)

    const winEl = document.querySelector<HTMLElement>('.xw-window[data-app="dossier"]');
    const target = winEl?.getBoundingClientRect();

    const mtl = gsap.timeline({ onComplete: () => overlay.remove() });
    mtl.to(
      '#xw-zi-map, .xw-zi-readout, #xw-zi-status, #xw-zi-chip, .xw-zi-skip, #xw-zi-sweep, .xw-zi-bkt, #xw-zi-lockrect, #xw-zi-connector',
      { opacity: 0, duration: 0.18 },
    );

    if (!target) {
      // Companion App / no window (mobile): the card just hands off.
      mtl.to(overlay, { opacity: 0, duration: 0.3 }, '<+0.1');
      return;
    }

    mtl
      .to('.xw-zi-card-photo, .xw-zi-card-body', { opacity: 0, duration: 0.22 }, '<')
      .to(card, {
        left: target.left,
        top: target.top,
        width: target.width,
        height: target.height,
        duration: 0.5,
        ease: 'power3.inOut',
      }, '<+0.05')
      .to(overlay, { opacity: 0, duration: 0.22 });
  };
}
