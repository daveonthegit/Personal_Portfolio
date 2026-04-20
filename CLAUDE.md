# Personal Portfolio — David Xiao (xiaoOS)

## Tech Stack

- **Backend:** Go 1.21+ with Gorilla Mux, server-rendered templates
- **Frontend:** Vanilla TypeScript, Tailwind CSS 3.3, GSAP, esbuild
- **Deployment:** Docker, Heroku

## Design Context

**Authoritative design system, tokens, and principles:** `[.impeccable.md](.impeccable.md)` (xiaoOS × Wu Wei — hiring-first, warm dark UI, single cyan accent, IBM Plex Sans + Mono, section rail + scroll-spy).

**In one line:** Recruiters and engineers should trust the craft in 30 seconds; the UI should feel like a plausible command-center product, not a template or spectacle.

**Constraint:** Keep the existing xiaoOS boot sequence (`StartupAnimation` + related CSS); refactor tokens or boot copy around it — do not remove the intro wholesale.

## Scrolling & motion (architecture)

- **One native page scroller:** `document.scrollingElement` — do not attach `touchmove` / `wheel` handlers for scrollspy or reveals; do not fight iOS rubber-band on the root.
- **Smooth scroll:** CSS `scroll-behavior: smooth` only for fine pointers (see `main.css`); hash jumps use `scroll-padding-top` on `html` and `scroll-margin-top` on sections.
- **Viewport units:** Avoid locking the **root** to `100vh` / `100dvh` on `body`. Use `min-height` shells with `svh` where needed (e.g. `.xw-main`); reserve full-viewport **height** for real overlays (boot, modals).
- **Scroll-spy & reveals:** IntersectionObserver only; `data-xw-reveal` toggles on enter/exit on all viewports (reveal replays when scrolling back).
- **Overlays:** `body.xw-mobile-nav-lock` / `overflow: hidden` only while the overlay is open. `.xiaoos-loader-container` sets `pointer-events: none` + `touch-action: none` so the boot layer never captures first-touch scroll; empty `#startup-animation` keeps `pointer-events: none` as a belt-and-braces fallback.
- **Horizontal overflow:** `overflow-x: hidden` lives on `html` only, not `body` — dual-rooted clipping on iOS can ambiguate the native scroller and trigger first-swipe rubber-band.