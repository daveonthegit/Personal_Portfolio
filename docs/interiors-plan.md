# App Interiors — design plan (next major phase)

Owner's concept (2026-07-03): opening an App from the City doesn't just spawn a
window — the camera dives INTO the building and reveals a 3D interior scene per
app, in the WD2 X-ray-wireframe language (white line-work rooms, glowing
screens). The window/content then lives on a surface inside that room.

## Interiors

| App | Interior | Content surface |
|---|---|---|
| DOSSIER | A lived-in room: desk, chair, lamp, one large monitor (the subject's desk) | The monitor — dossier content on its screen |
| PROJECTS | Server room: racks with blinking units, a wall of displays | Each display = one evidence record; walking the aisle = browsing |
| RESUME | Records office: filing cabinet, document on a light table | The document on the table = the printable resume; drawer = timeline |
| CONTACT | Comms tower interior: radio console, waveform monitor | Console screen = the form; send = transmission beat on the waveform |
| ARCADE | Back-room arcade: two cabinets, neon-less (ink/cyan) | Cabinet screens = the playable games (live captures) |

## Grammar (from the WD2 frame analysis — docs/wd2-cinematic-notes.md)

- Interiors are X-RAY WIREFRAME: white edges on dark, no textures — the same
  "private life scanned" language as the doll/living-room shots.
- Camera: continuous dive from the map into the building (no cut — MK12 rule),
  through the facade (shell fades as camera crosses it), settle on the room.
- The app's DOM window docks onto the in-scene screen surface (screen glows,
  window grows from its projected rect — reuse the tag→panel→window motion).
- "Back to map" ascends out through the roof, facade re-fades in.

## Build order

1. **Dive foundation** (DONE with this commit): tag-open swings/zooms the
   orbit camera toward the app's building before the window opens.
2. Facade-fade + generic interior shell (one room template, reused).
3. DOSSIER room (highest value; the intro already lands on this building).
4. PROJECTS server room (displays ↔ evidence records).
5. RESUME / CONTACT / ARCADE rooms.
6. Mobile adaptation (dive plays, interior as backdrop behind the sheet).

## Constraints

- Procedural + deterministic geometry only (ADR 0002) — no model files.
- Interiors are presentation; the semantic substrate (real pages) is untouched.
- Every dive skippable/instant under user control; recruiter rule holds — the
  content window must be readable within ~1s of the click.
