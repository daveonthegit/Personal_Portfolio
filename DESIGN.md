# xiaoOS architectural miniature

## Scope and authority

This records the owner-approved 3D model direction. The portfolio's authoritative design system remains [`.impeccable.md`](.impeccable.md); product context is in [`PRODUCT.md`](PRODUCT.md). No typography, UI palette, document layout or navigation redesign is introduced here.

## Commitment

- **Artifact:** hiring-first portfolio with a navigable 3D desktop.
- **Audience:** recruiters and engineers; content stays primary.
- **Personality:** futuristic, creative, resourceful, restrained.
- **Essence:** inhabited architectural miniature.
- **Owner selection:** detailed procedural miniature, rather than textured realism or scan/wireframe reconstruction.
- **Physical references:** Manhattan setback towers, loft window bays, rooftop water tanks, suspension bridges, and equipment-room construction.
- **Signature:** the city resolves into inhabited rooms containing the actual application screens.

## Visual system

Keep IBM Plex Sans + Mono, existing `--xw-*` type/spacing tokens, warm dark UI, hairline edges and semantic cyan. Model finishes are centralized in `src/os/modelKit.ts`: stone, light trim, metal, dark surfaces, window recesses and muted park foliage. These are material colors under scene lighting, not replacements for CSS tokens. New physical details do not emit cyan or introduce animated telemetry.

Detail should read at three distances: skyline silhouettes, facade bays and roof equipment, then furniture controls and construction seams. Landmark-inspired crowns and crossings are stylized studies, not a geographically accurate NYC dataset. Avoid claiming exact building locations or architectural replicas.

## Construction and motion

- `architecture.ts`: deterministic towers, lofts, crowns, roof plant, park and crossings.
- `modelKit.ts`: static geometry merged by material finish; dispose construction geometry after merging. Facade windows are planes, not six-sided boxes.
- `roomDetail.ts`: shared architectural trim and room-specific equipment; preserve the screen meshes used for app handoff and clicks.
- `screenHints.ts`: small, screen-anchored Open / View project / Play buttons, neutral at rest and cyan on hover/focus. No pulse or glow. Hide outside the active room, offscreen, back-facing, or until project records are available. Labels and canvas clicks share actions; native buttons provide keyboard activation.
- Complete building geometry rises together, keeping roof details attached. App facade details share the shell's fade material. Keep shells in the transparent shader path, without depth writes, to avoid opaque bands masking rooms when opacity reaches zero.
- The skyline is built in time-budgeted slices (`buildSkyline`, `SKYLINE_SLICE_MS` of construction per slice with `SKYLINE_SLICE_MAX` as a hard cap for a stalled clock, one slice per animation frame). Folding parts into one geometry per finish (`ModelKit.compact()`) takes its own slice once enough have piled up, so a merge never stacks on top of a construction slice, and the finished model still costs one draw per finish.
- A plain massing proxy — one merged box per lot, one draw — is attached synchronously at mount and retired when the detailed batches land. The first rendered frame therefore always shows a complete skyline: on the intro path, on the non-intro wallpaper mount (`shell.ts`), and on the Escape/native bypass, which reveals the desktop immediately and is never made to wait for or synchronously flush the detailed model.
- Room detail is shared, but rooms own their own signal: the projects racks' shared trim stays behind `RACK_FACE` so the per-project units and status LEDs remain the frontmost geometry, `rackUnitBand(projectCount)` reserves the rack-face rows those units claim so the shared trim can sit proud of the face without burying them (and without being sealed inside the opaque rack box), and `addRoomDetail(..., { ceiling: false })` omits raceways and suspended luminaires in the open-top Dossier the intro camera descends through.
- Preserve the bounded intro, Escape/native bypass, reduced-motion narrative, document fallbacks and lazy project-preview loading. No new motion or asset downloads.

## Validation and audit

`npm run test:models` checks finite geometry, bounded vertex/draw counts and room handoff contracts. A synthetic 450-building fixture has five draw batches and about 555k vertices; park/crossings have five batches and about 18k vertices. Budgets are set just above those measured values, and vertices-per-draw is asserted so the batching claim cannot pass on an unbatched model. This is a geometry budget, not an FPS claim.

The same suite also asserts behaviour that previously regressed: the sliced build produces the same batches and vertex count as the single-task build under both an injected stalled clock and an injected over-budget clock, with each slice's actual lot consumption observed and held to the cap or the budget; the massing proxy is present from before the first slice and retired only on the last; a ray from the projects room's arrival camera reaches every project unit and LED with nothing in front of it, while a sweep of the same rack face still strikes the shared rack trim, so neither can be hidden inside the other; and an open-top room carries no geometry at ceiling-fixture height.

Skyline construction cost, measured on the 450-lot fixture on this repo's Node/three build (Apple silicon, four runs): one blocking task of **212-231 ms** if built in a single pass, versus a **1.8-2.3 ms** synchronous mount (the massing proxy only) followed by **27-30 slices with a 6.1-6.2 ms median**. Construction slices land on the budget; the outliers are the merge slices, which are bounded by the fold threshold rather than by the clock and measure **10-18 ms** including the final merge. Limitations: this measures geometry construction and merging on a desktop-class CPU in Node, not GPU upload, and no physical low-end device was benchmarked; a 4x-slower CPU would scale these roughly linearly, so merge slices would still drop frames there — the massing proxy, not the slice size, is what keeps the city looking complete meanwhile. The intro's bounded arrival, native/Escape bypass, reduced-motion narrative and camera/screen handoffs are unchanged — they never read the skyline's children, only the group's scale.

Local Chrome inspection covered the city and all five interiors. It exposed facade occlusion during entry; keeping the fading shader path stable corrected it. The existing 20-check browser suite passed, including the bounded arrival, fallback/reduced-motion paths, responsive documents and absence of uncaught exceptions. Go tests, type checking and production build are also required.

Scope-specific visual audit: 8/10. Architectural detail now carries the identity rather than generic blocks; real preview images remain the only project-screen imagery. Remaining limitations: stylized geography, deliberately low-poly furniture/figure, existing close interior camera framing, and no physical-device GPU benchmark (construction cost is measured in Node only). UI-wide accessibility certification is not implied by this model pass.

## Change record

- Architectural miniature pass: richer skyline/rooflines, two suspension crossings, park/pier detail, room construction and equipment, shared static batches, corrected facade fade and screen placement.
- Slice-budget and proxy pass: elapsed-time slice budget with a hard cap, merge folding on its own slice, a synchronous massing proxy so no path ever renders an empty city, rack trim proud of the face but clear of the reserved project bays, and per-slice consumption asserted from outside.
- Mount-cost and occlusion pass: skyline construction sliced across frames with amortized merging, projects rack detail recessed behind the project units, ceiling fixtures gated on rooms with a lid, geometry budgets tightened to measured values with behavioural regression coverage.
- Screen affordance pass: restrained anchored actions, checked in local Chrome across Resume, Projects and Arcade; dedicated browser regression checks keyboard game launch, project record activation and immediate exit hiding.
