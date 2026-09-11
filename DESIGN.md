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
- Preserve the bounded intro, Escape/native bypass, reduced-motion narrative, document fallbacks and lazy project-preview loading. No new motion or asset downloads.

## Validation and audit

`npm run test:models` checks finite geometry, bounded vertex/draw counts and room handoff contracts. A synthetic 450-building fixture has five draw batches and about 555k vertices; park/crossings have five batches and about 18k vertices. This is a geometry budget, not an FPS claim.

Local Chrome inspection covered the city and all five interiors. It exposed facade occlusion during entry; keeping the fading shader path stable corrected it. The existing 20-check browser suite passed, including the bounded arrival, fallback/reduced-motion paths, responsive documents and absence of uncaught exceptions. Go tests, type checking and production build are also required.

Scope-specific visual audit: 8/10. Architectural detail now carries the identity rather than generic blocks; real preview images remain the only project-screen imagery. Remaining limitations: stylized geography, deliberately low-poly furniture/figure, existing close interior camera framing, and no physical-device GPU benchmark. UI-wide accessibility certification is not implied by this model pass.

## Change record

- Architectural miniature pass: richer skyline/rooflines, two suspension crossings, park/pier detail, room construction and equipment, shared static batches, corrected facade fade and screen placement.
- Screen affordance pass: restrained anchored actions, checked in local Chrome across Resume, Projects and Arcade; dedicated browser regression checks keyboard game launch, project record activation and immediate exit hiding.
