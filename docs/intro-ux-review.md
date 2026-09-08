# Intro and UX review — September 2026

## Summary and delivery status

The xiaoOS identity remains: X-grid → strike bars → diamond/shape sequence → System Loading → city acquisition → Dossier. The implementation shortens the choreography rather than deleting it, improves failure access and keyboard/navigation behavior, and makes supported work details easier to find.

**Visual confirmation remains outstanding:** System Loading captures omit the Bypass control and static bottom copy despite DOM visibility and hit-testing observations. Those observations are not proof of visible rendering. The one authorized surface/view comparison was inconclusive; do not declare this a capture-tool defect or certify persistent visual bypass access. See [capture comparison](evidence/intro-ux/capture-comparison.json). Work and local preview are preserved; no merge or deployment has occurred.

## Prioritized findings and changes

| Priority | Evidence / problem | Implementation and remaining qualification |
|---|---|---|
| P1 | Front-door overlay lasted ~14s desktop / ~16s constrained mobile, even on the smoother repeat path. | Retimed the existing boot and acquisition; bounded scene wait and independent eight-second animation watchdog. Final normal measurements complete naturally, not through the watchdog. |
| P1 | Exit/failure handling was split across boot and scene timelines; pending work could outlive cancellation. | Native pre-JS bypass, Escape cancellation across nested timelines/imports, empty-cover CSS fail-open, late-entry guard, static reduced-motion narrative without WebGL. **Visual bypass continuity still needs confirmation.** |
| P1 | Project detail links, modal Tab flow and dismissal had concrete failures; retry-click navigation could reopen a dismissed record. | Await panel readiness instead of retry-clicking; contain modal Tab focus; Escape retains the Projects app and restores the card or visible Signal node. Native project documents remain available without enhancement. |
| P2 | Mobile intro ended on the map rather than useful profile content; redundant floating Map shortcut overlapped content. | Front-door arrival opens Dossier; dock retains Map access. Direct Map navigation, section hashes and intro query parameters are preserved. Removed the overlapping duplicate shortcut. |
| P2 | Featured-grid selector specificity retained narrow desktop columns on phones; filters appeared after featured content. | Full-width mobile featured cards, earlier toolbar, native compact filter select, explicit selected states, tighter heading spacing. Tested at 320, 390, 768 and 1440px. |
| P2 | Faint metadata had insufficient contrast; small controls and lost focus weakened keyboard use. | Faint ink changed from `#6e675e` to `#9b9388`; focus rings and 44px primary controls; dock-label backing; app-close focus restoration and skip-to-main focus. Reveals enhance already-visible content. |
| P2 | Home emphasized long introductory prose over role, evidence and project substance. | Scannable role/scope and existing work outcome, expandable approach/build notes, working record links, repository-backed portfolio description, optimized previews and portrait. No new personal claims. |
| P2 | App fetches lacked clear pending feedback and could resolve out of navigation order. | Loading status, latest-navigation-wins request guard, connected-window checks and initial Dossier caching. |

Calculated faint-token contrast on the three dark surfaces improves from **3.27–3.55:1** to **6.02–6.52:1**, using WCAG relative luminance. This is a token check, not a complete accessibility certification. The existing warm dark palette, cyan accent and IBM Plex type pairing remain.

## Diagnosis: trigger, masking and counterfactual

1. **Duration was primarily choreography.** The smoother baseline repeat still took 13.96s on desktop. Its city rAF p95 was ~16.7ms, so eliminating isolated stalls alone would not meet the courtesy budget.
2. **First-use rendering was a separate trigger.** Baseline long tasks coincided with initialization and the detailed-city transition. An additional 16-second desktop CPU profile mapped sampled work to three.js `texSubImage2D`, `onFirstUse`, matrix updates and rendering. [Source-mapped profile summary](evidence/intro-ux/profile-summary.json) records sampled self time, not GPU execution time.
3. **Repeat visits masked cold costs.** First desktop baseline had 193/335/344ms long tasks; its repeat had one 100ms task. HTTP cache was disabled, but browser/GPU/shader caches were not reset. A warm repeat is not proof that the cold path is smooth.
4. **Implementation targets those mechanisms.** Prepare detail and region shader variants before flight, yield between texture uploads, defer Projects-room preview textures until entering that room, and avoid rendering a hidden mobile map. Animated strike/progress widths use transforms where appropriate. The deprecated three.js Clock was replaced with Timer without a dependency upgrade.
5. **Counterfactual:** merely warming the original experience still yielded ~14s arrival. Retiming while retaining the full WebGL narrative yields ~7.7s desktop; every final timing run records `xw:intro-city = webgl` and `xw:intro-ready = complete`. Neither SVG fallback nor the deadline is responsible for those measured reductions.

Relevant historical intent is documented in `CONTEXT.md` and [city ADR](adr/0002-threejs-city-scene.md): the cinematic is part of the product. The updated reduced-motion presentation preserves its stages without requiring disruptive motion.

## Reproducible measurements

Baseline checkout: `b5c7b9f7baa37903de93fae4d7a3015d3f1ad2d3`. Two baseline and two final runs per profile, using the same local server and dedicated Chrome headless 152.0.7977.76 on macOS.

| Setting | Desktop | Constrained mobile |
|---|---|---|
| Viewport / DPR | 1440×900 / 1 | 390×844 / 3, touch |
| CPU slowdown | 1× | 4× |
| Network latency | 0ms | 150ms |
| Download / upload | Unthrottled | 200,000 / 93,750 bytes/s |
| HTTP cache | Disabled | Disabled |

The common arrival metric is **navigation → overlay gone**, sampled by rAF. It is not LCP. Baseline mobile arrival exposed the map; final arrival exposes Dossier. Each run observes approximately 26 seconds, including post-intro activity.

| Metric | Desktop before → after | Mobile before → after |
|---|---|---|
| Overlay gone, run 1 | 14.028s → 7.706s | 16.094s → 10.006s |
| Overlay gone, repeat | 13.956s → 7.688s | 16.107s → 10.023s |
| City-phase rAF p95 | ~16.7–16.8ms → ~16.8ms | ~16.8ms → ~16.8ms |
| City-phase maximum rAF interval, two runs | 333 / 100ms → 16.8 / 16.8ms | 100 / 150ms → 133 / 133ms |
| Same-origin decoded resource bytes during observation | ~5.94MB → ~1.11MB | ~4.45MB → ~0.93MB |
| Same-origin JavaScript bytes | 718,872 → 725,161 | 718,872 → 725,161 |

The loading-cost reduction is chiefly image derivatives and deferred room previews, **not** a smaller JS bundle. Originals remain. The portfolio preview was refreshed from the actual local site; other image derivatives use existing assets.

Final desktop runs recorded no >50ms long tasks. **Mobile jank is not eliminated:** final runs retain **142–147ms scene-preparation tasks**, plus initial loading/startup work; the repeat also has a 52ms task. This work occurs before the WebGL flight mark. Aggregate arrival is faster, but the evidence does not establish universally smoother mobile rendering.

### Limits

- Only two recorded runs per profile; no statistical performance guarantee.
- Headless desktop CPU/network emulation is not a physical phone, iOS Safari, or a cold mobile GPU. rAF intervals are not direct GPU frame measurements.
- Shader/process caches remain warm across runs. The first baseline and final results are not equivalent cold-GPU trials.
- Same-origin resource totals exclude cross-origin font accounting and do not represent production compressed transfer sizes.
- The eight-second watchdog begins when the frontend starts. Normal constrained loading adds ~2.4s before that. CSS also uncovers an empty overlay if entry JS is missing; late JS must not replay over already-exposed content.
- System Loading visual continuity is unresolved. Existing screenshots omit static layers; DOM geometry cannot distinguish a real compositor/animation issue from capture behavior. The authorized single surface/view comparison timed out after 30 seconds and created no images. No additional capture attempt or OS permission was used.

## Evidence and checks

- Desktop arrival: [before](evidence/intro-ux/before-desktop.png) / [after](evidence/intro-ux/after-desktop.png).
- Mobile arrival: [before](evidence/intro-ux/before-mobile.png) / [after](evidence/intro-ux/after-mobile.png).
- Projects: [before desktop](evidence/intro-ux/before-projects.png), [after desktop](evidence/intro-ux/after-desktop-projects.png), [after mobile](evidence/intro-ux/after-mobile-projects.png).
- Preserved boot: [X-grid / bars](evidence/intro-ux/after-boot-grid.png), [System Loading capture with unresolved omission](evidence/intro-ux/after-boot-system.png).
- [Reduced-motion acquisition](evidence/intro-ux/after-reduced-motion.png), [SVG fallback](evidence/intro-ux/after-svg-fallback.png).
- Raw timings/resources/marks: `evidence/intro-ux/{before,before-repeat,after,after-repeat}-{desktop,mobile}.json`.
- [Initial failing regressions](evidence/intro-ux/regression-before.txt); [20 passing browser checks](evidence/intro-ux/browser-checks.json).

Verified before capture recovery: `npm run build`, `npm run type-check`, `go test ./...`, `go vet ./...`; all 20 browser checks passed, including normal completion, Replay/Enter/Escape, pending imports, missing/late entry, reduced motion, fallback, deep links, modal focus, filters/Signal, window cache/focus, fetch races, contact validation, mobile touch/Map and responsive documents. Normal browser paths recorded no uncaught exceptions, console warnings/errors or failed HTTP responses. A passing DOM/interaction suite does **not** resolve the visual capture finding.

No live contact message was sent; SMTP delivery is not verified. No dependencies were installed/upgraded, security middleware changed, independent review rounds commissioned, or production deployment performed. The existing Browserslist data-age warning remains.

Reproduction commands and dedicated-browser prerequisites are in [README](../README.md#intro-accessibility-and-browser-checks). Wait for the local server to return HTTP 200 before starting browser checks; the harness now reports navigation failures explicitly.

## Content provenance and remaining source gaps

- Role, scope, current work outcome, dates and biography come from `config/personal.go`. The hero outcome reuses the first current-experience bullet; it is not a newly inferred metric.
- Project descriptions, technologies, dates and links come from `projects.go`; implementation notes expand those existing descriptions. The portfolio's description additionally reflects this repository's Go templates, TypeScript shell and procedural city.
- Career source authority remains [ADR 0001](adr/0001-career-data-exported-from-career-ops.md). No career-ops files were edited.
- For firstmate: individual ownership boundaries on team projects, validated project outcomes/adoption, and publishable process artifacts need additional source material before richer case studies can claim them. Do not infer these from a technology list or team repository.

Next verification: captain confirmation of Bypass/static-copy visibility during System Loading, followed by physical-device cold-render profiling if further motion optimization is desired. The local preview remains available at `http://localhost:18437/` and direct Dossier at `http://localhost:18437/home#file`.
