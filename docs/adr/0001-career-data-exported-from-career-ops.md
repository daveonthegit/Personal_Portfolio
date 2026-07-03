# 0001 — Career data is exported from career-ops, not maintained here

**Status:** Accepted (2026-07-02)

## Context

The portfolio needs structured career data (roles, dates, bullets, education, skills)
to drive both the printable resume document and the interactive timeline lens of the
Resume app, with cross-links into project Evidence Records by date. The canonical CV
already lives in the private `career-ops` repo as `cv.md` (user-owned, stable heading
structure), which has its own LaTeX/PDF tooling. Maintaining a second hand-edited copy
here guarantees drift; parsing `cv.md`'s markdown directly from this repo couples a
public site build to a private repo's prose formatting.

## Decision

`career-ops` gains an export script that emits a structured artifact (`cv.json`/`cv.yaml`)
with stable IDs and date ranges. That artifact is committed into this repo (or pulled at
deploy) and is the single source for: the resume document view, the timeline lens, and
PDF generation. `cv.md` remains the only place career truth is edited.

Contact fields in the export carry an explicit `public` flag; private-by-default, so
nothing personal flows to the public site unintentionally.

## Consequences

- One editing home (career-ops); the portfolio consumes typed data.
- The export format is a contract — changes to it must update both repos.
- Portfolio builds do not require career-ops to be present; they use the committed artifact.
- The portfolio's standalone LaTeX resume pipeline is superseded by generation from the artifact.
