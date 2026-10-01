# Intro dither moments — evidence (2026-10-01)

Captured with local Chrome headless 154 over CDP screencast (`Page.startScreencast`), desktop 1440×900 DPR 1 and mobile 390×844 DPR 2 touch, against `PORT=18437 go run .`. Pairs are **before (left) / after (right)** at the same time since navigation.

| File | What it shows |
|---|---|
| `intro-desktop.gif`, `intro-mobile.gif` | Full front-door intro, after this change (boot → city acquisition → Dossier). |
| `desktop-1-handshake-glyph.png`, `mobile-1-handshake-glyph.png` | Boot ~1.0s: coarse carrier field and a handshake ping around the glyph; centre stays black. |
| `desktop-2-handshake-system.png` | Boot ~1.75s (System Loading): field has stepped to fine cells, noise floor low. |
| `desktop-3-decode.png`, `mobile-3-decode.png` | ~3.3s: before, the city canvas pops in; after, it decodes from the black cover in Bayer order. |
| `desktop-4-acquire-before-after.png`, `desktop-4-acquire-sequence.png` | Lock-on: the profiler photo walks its cell handshake (12→8→5→3→2 px) into the clean photo. |
| `reduced-motion-quiet.png` | `prefers-reduced-motion: reduce`: unchanged quiet narrative, no intro dither layers, clean photo. |

Arrival timings in these runs (`xw:intro-ready`, detail `complete` in every run):

| Run | Desktop | Mobile |
|---|---|---|
| Before | 7.460s / 7.447s | 7.170s |
| After | 7.446s / 7.450s | 7.185s / 7.171s |

The handshake canvas mounts ~90ms after navigation; the decode layer is held under the boot from its reveal beat (~2.43s).
