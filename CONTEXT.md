# CONTEXT.md — xiaoOS Surveillance Portfolio

Ubiquitous language for the xiaoOS fiction. Glossary only — no implementation details.

## Terms

**xiaoOS**
The fictional surveillance operating system that *is* the portfolio site. The whole
experience presents as this one piece of plausible software (ctOS-inspired), not as a
website with a theme.

**Boot Sequence**
The existing intro cutscene (X-grid → strike bars → diamond → "System Loading").
Preserved per project constraint; the surveillance experience begins where it ends.

**Zoom-In**
The cinematic that follows the Boot Sequence: one continuous, banking camera flight
over the City (the MK12 "seamless interconnectedness" grammar — no cuts). It opens on
night-lights geography, searches (candidate boxes flicker over wrong targets), dives as
the city resolves and buildings rise, converges lock brackets on the subject block, and
slides out a profiler card that expands into the open Dossier window — then the camera
simply settles into the Desktop view; the flight ends where the visitor lives. Glitch
is an accent at commit moments, not the movement itself. The subject block is abstract
(no address claim). Part of the default arrival path; the visitor never has to hunt.

**Desktop**
The persistent shell the visitor lives in after the Zoom-In. Its backdrop is the City —
the same 3D scene the intro flight ends on (no cut between cinematic and desktop).
Apps open on top of it.

**City**
The procedural 3D scene (white block-mass buildings, tilted flown-over camera) that is
both the Zoom-In's stage and the Desktop's backdrop. App locations live in it as
Pins with Tags. Falls back to the 2D map presentation where WebGL, motion, or the
form factor rule it out.

**Pin / Tag**
An App's location in the City: a marker at a building (Pin) with a white plain-English
callout above it (Tag — "DOSSIER", "PROJECTS"…). Clicking one opens a small data panel
that expands into the App's Window. The Dock remains as the secondary, utilitarian
launcher and taskbar.

**App**
A unit of content presented as software within xiaoOS (e.g. Dossier, Projects, Contact).
On desktop form factor an App opens as a Window; on mobile it opens as a full-screen
Sheet — same App, two presentations.

**Window**
Desktop-pointer presentation of an App: positioned, layered, closable.

**Sheet**
Mobile presentation of an App: full-screen, one at a time, task-switched — like a
native phone OS app. Never overlapping draggable windows on touch.

**Companion App**
The mobile form of xiaoOS as a whole: designed as its own mobile-first product (the
"phone app" of the surveillance system), not the Desktop scaled down. The CITY MAP is
its main navigation — the home screen is the fullscreen rotatable City with Tags; the
dossier document lives behind its Tag; every other view carries a "back to map" control
alongside the bottom tab bar. Same intro cinematic as the Desktop, played fullscreen.

**Dossier**
The surveillance file on David Xiao — the subject file the system "already has."
Opens automatically at the end of the Zoom-In; carries the hiring-critical content
(profile, work, experience). The system finds you; the visitor never searches.

**Subject**
David Xiao, as the person the fiction observes. There is exactly one Subject.

**Living Dossier**
The Dossier behaves as if the system is still compiling it: fields type in on open,
observation timestamps tick live, playful redactions unredact on hover (revealing the
mundane and human), and real recent activity (e.g. latest public commit) surfaces as
new observations. Surveillance is ongoing, not archival.

**Observer Mirror**
One contained panel of the Dossier that flips the lens: the visitor's own
session details (browser, OS, viewport, local time, locale) shown as an "observer log."
Strictly client-side, never transmitted or stored, always accompanied by the in-fiction
disclaimer that the system does not retain it. One panel, one wink — never the theme.

**Evidence Record**
A project, presented as a recovered artifact in the Projects App: observation metadata
(first observed, status, detected signatures) around real proof (links, footage, demos).
The default, scannable view of the Projects App.

**Live Capture**
Opening the Subject's actual running software in a child window from its Evidence
Record. Live projects can be observed running; dead ones show a lost feed. The fiction's
strongest credibility move: the proof is executable.

**Signal View**
The alternate lens of the Projects App: Evidence Records as a graph, linked by
*distinctive* shared technology (common base tech carries no edges). Optional depth —
never the default, never required to scan.

## Rules

**Chrome earns its information (no-slop rule)**
Every readout in the OS chrome is *true*: the clock is the real time, counts are real
counts (projects, commits), observations are real events. No invented blinking numbers,
no wallpaper jargon, no decorative fake data. If a status element can't be backed by a
real value, it doesn't ship. Density stays low — a few true details beat many fake ones.

**Legibility over fiction (recruiter rule)**
The fiction never costs a recruiter comprehension. Navigation and section labels stay
plain-English (`PROJECTS`, `CONTACT`, `RESUME`); surveillance flavor lives in the chrome
*around* labels (status readouts, timestamps, monitoring ticks), never in renamed
navigation. A 30-second skim must still work.

**The fiction is operable by everyone**
The FULL intro (Boot Sequence + Zoom-In) always plays on the front door — it is never
skipped by the system, including under `prefers-reduced-motion` (owner's decision,
2026-07: the cinematic is the product). The visitor's ways out are Bypass and Escape,
available from the first frame. Every App is keyboard-operable (dock tabbable, Escape
closes the focused window). Assistive tech reads the semantic substrate, never the
chrome. Sound is on by default but begins only at the visitor's first gesture (browser
policy), with a persistent mute.

**The intro is a bounded courtesy**
Boot Sequence + Zoom-In together stay under ~8 seconds, are skippable from the first
frame, and play only on the front door (`/`). Deep links and return paths are
cinematic-free; a replay control lives inside the OS for people who want the show again.

**Machine-readable substrate**
The fiction is a presentation layer. Every App's content also exists as a plain,
semantic, crawlable document at its own URL — readable by search engines, AI agents,
and assistive technology without executing the visual experience. The two never trade
off: degrading one to serve the other is a design bug.

**Default path carries the visitor**
No hunting. Boot Sequence → Zoom-In → Dossier open happens without user input on first
arrival. Interactivity is optional depth, not a gate in front of the content.
