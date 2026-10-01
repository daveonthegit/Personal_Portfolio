# Personal Portfolio — David Xiao (xiaoOS)

## Tech Stack

- **Backend:** Go 1.21+ with Gorilla Mux, server-rendered templates
- **Frontend:** Vanilla TypeScript, Tailwind CSS 3.3, GSAP, esbuild
- **Deployment:** Docker, Heroku

## Design Context

**Authoritative design system, tokens, and principles:** `[.impeccable.md](.impeccable.md)` (xiaoOS × Wu Wei — hiring-first, warm dark UI, single cyan accent, IBM Plex Sans + Mono, section rail + scroll-spy).

**3D city/interior model direction, construction invariants and geometry budgets:** [`DESIGN.md`](DESIGN.md).

**In one line:** Recruiters and engineers should trust the craft in 30 seconds; the UI should feel like a plausible command-center product, not a template or spectacle.

**Constraint:** Keep the existing xiaoOS boot sequence (`StartupAnimation` + related CSS); refactor tokens or boot copy around it — do not remove the intro wholesale.

## Scrolling & motion (architecture)

- **Native scrolling:** Document/mobile pages use `document.scrollingElement`; desktop OS windows use their native `.xw-window-body` overflow. Do not attach `touchmove` / `wheel` handlers for scrollspy or reveals; do not fight iOS rubber-band on the root.
- **Smooth scroll:** CSS `scroll-behavior: smooth` only for fine pointers (see `main.css`); hash jumps use `scroll-padding-top` on `html` and `scroll-margin-top` on sections.
- **Viewport units:** Avoid locking the **root** to `100vh` / `100dvh` on `body`. Use `min-height` shells with `svh` where needed (e.g. `.xw-main`); reserve full-viewport **height** for real overlays (boot, modals).
- **Scroll-spy & reveals:** IntersectionObserver only; `data-xw-reveal` toggles on enter/exit on all viewports (reveal replays when scrolling back).
- **Overlays:** `body.xw-mobile-nav-lock` / `overflow: hidden` only while the overlay is open. `.xiaoos-loader-container` sets `pointer-events: none` + `touch-action: none` so the boot layer never captures first-touch scroll; empty `#startup-animation` keeps `pointer-events: none` as a belt-and-braces fallback.
- **Horizontal overflow:** `overflow-x: hidden` lives on `html` only, not `body` — dual-rooted clipping on iOS can ambiguate the native scroller and trigger first-swipe rubber-band.

## Dither feed

`src/utils/dither.ts` is a clean-room ordered-dither treatment; images opt in with `data-xw-dither` (`portrait` | `card` | `decode` | `acquire`) and keep their `<img>`/alt under an aria-hidden canvas. The front-door intro's 2D-canvas moments (boot handshake field, cover decode/interference) live in `src/home/introDither.ts`, driven by `StartupAnimation`'s `onStage` beats and the `xw:intro-glitch` / `xw:intro-lock` events; they must overlap existing beats (never add time), sit beneath boot/HUD text, and are never created under reduced motion. This repo is public: never port, paraphrase or consult code from SavvyBurrow or the CodegridPRO template it derives from (commercial licence).

## Intro and browser validation

- `src/home/bootOverlay.ts` owns the bounded arrival, cancellation, URL normalization and Dossier handoff. Preserve the quiet reduced-motion narrative and native pre-JS bypass when changing it.
- Run Go tests, `npm run type-check`, `npm run test:models`, and `npm run build`. Local Chrome/CDP regression and measurement commands are documented in `README.md`; `docs/intro-ux-review.md` explains baseline evidence and limitations.
- Personal/career data pointers: `config/personal.go`, `projects.go`, and `docs/adr/0001-career-data-exported-from-career-ops.md`. Do not invent project ownership, outcomes or personal facts while editing presentation.

## Resume surfaces

`data/cv.json` (the career-ops export) is the single input; the home page Experience/Skills in `config/personal.go` are a hand-kept mirror of it (README → Resume Management). `npm run build:resume:web` regenerates `static/assets/resume.html`, `static/assets/resume-ats.txt`, and `static/data/cv.json` (the last drops contacts marked `public: false`, since it is served). `resume.pdf`/`resume.tex` come from career-ops and are copied in, never derived here.

Committed resume artifacts are authoritative: the handlers in `main.go` serve them as-is and rebuild only when a file is absent. Do not reintroduce runtime or build-time `resume.tex` → HTML conversion — the removed converter overwrote the committed page with malformed markup. `resume_test.go` locks this down.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
