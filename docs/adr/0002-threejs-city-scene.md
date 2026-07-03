# 0002 — One three.js city scene is the cinematic AND the desktop

**Status:** Accepted (2026-07-03)

## Context

The Zoom-In cinematic and the Desktop were built as 2D SVG (flat top-down map,
stepped zoom, SVG wallpaper). Design review against the Watch Dogs / ctOS
references (MK12 opening cinematic, Blume "smart cities" site) concluded the
flat treatment cannot deliver the intended language: a tilted, dimensional
city flown over by a continuously gliding camera, buildings with real height,
app locations pinned to buildings, and — per MK12 — *seamless* transitions
where the intro flight simply ends as the desktop view, with no cut.

`.impeccable.md` says not to introduce a framework for one-off UI without an
explicit project decision. This ADR is that decision.

## Decision

Adopt **three.js** (WebGL) for a single procedural city scene that serves both
roles: the intro flight (region night-lights → dive → buildings rise → lock on
the subject block) and the persistent Desktop backdrop (slow drift, app
tags/pins anchored to buildings, windows floating above).

Constraints on the adoption:

- **Lazy-loaded** in its own chunk (esbuild code-splitting); the base page must
  not pay the three.js download unless the 3D desktop actually activates.
- **Graceful degradation is mandatory**: no WebGL, `prefers-reduced-motion`,
  or the mobile Companion App → the existing 2D SVG cinematic and flat
  wallpaper remain in the codebase as the fallback path, not deleted.
- The scene is **procedural and deterministic** (seeded) — no 3D asset files,
  no model pipeline.
- Rendering pauses when the tab is hidden; reduced-motion gets a static frame.

## Consequences

- Real dependency (~150KB gz chunk) and a GPU requirement for the primary path.
- Two presentation paths (3D primary, 2D fallback) must be kept working.
- The desktop wallpaper, Zoom-In, and app-launch surfaces converge on one
  scene graph — later map-flavored features (Signal View, location-based
  fictions) get a natural home.
