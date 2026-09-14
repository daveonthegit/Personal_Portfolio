# App Interiors — superseded plan (historical)

**Status: superseded and shipped.** This was the pre-implementation plan
(2026-07-03) for the app interiors phase. Its early X-ray-wireframe direction
and staged build order are **not** current requirements — the owner later
selected a detailed architectural miniature in solid geometry.

For the current direction, construction invariants and geometry budgets, see
[`DESIGN.md`](../DESIGN.md). The implementation is `src/os/rooms.ts`,
`roomDetail.ts`, `architecture.ts`, `modelKit.ts`, `screenHints.ts` and
`zoomIn.ts`.

## Why it exists (historical context)

The originating concept: opening an App from the City doesn't just spawn a
window — the camera dives INTO the building and reveals a 3D interior scene per
app, with the window/content living on a surface inside that room. That premise
survived; the visual language did not.

The per-app interior assignments below were the starting point and still explain
why each app has the room it has:

| App | Interior | Content surface |
|---|---|---|
| DOSSIER | A lived-in room: desk, chair, lamp, one large monitor | The monitor — dossier content on its screen |
| PROJECTS | Server room: racks with blinking units, a wall of displays | Each display = one evidence record |
| RESUME | Records office: filing cabinet, document on a light table | The document on the table = the printable resume |
| CONTACT | Comms tower interior: radio console, waveform monitor | Console screen = the form |
| ARCADE | Back-room arcade: two cabinets (ink/cyan) | Cabinet screens = the playable games |

## Constraints that still hold

These were carried forward and are now owned by [`DESIGN.md`](../DESIGN.md):

- Procedural + deterministic geometry only (ADR 0002) — no model files.
- Interiors are presentation; the semantic substrate (real pages) is untouched.
- Every dive skippable/instant under user control; the content window must be
  readable within ~1s of the click.
