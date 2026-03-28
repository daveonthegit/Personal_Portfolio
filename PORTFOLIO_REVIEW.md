# Personal Portfolio Review

Date: 2026-03-27

## Executive Summary

This does not feel production-ready yet. The visual ambition is strong, but the code has real deployment problems: the contact flow is effectively broken, the public mail endpoint is easy to abuse, resume generation does heavyweight work during requests, accessibility is weak, and performance is being undercut by cache-busting and unnecessary global JavaScript.

Biggest risks:

- Contact abuse and failure
- Request-path process execution
- Poor keyboard and mobile usability
- Architecture drift between templates, TypeScript, and tracked build artifacts

Verification completed:

- `go build ./...` passed after fetching modules
- `npm audit --omit=dev` found `0` production vulnerabilities
- `npm run type-check` passed

I could not cleanly verify `npm run build` in this sandbox because `esbuild` hit an access-denied scan and then reported a follow-on `gsap` resolution failure.

## Findings Table

| Severity | Category | Location | Issue | Why it matters | Recommended fix |
|---|---|---|---|---|---|
| High | Security | `main.go:161`, `main.go:527`, `main.go:735` | Public `/contact` endpoint has no CSRF/origin check, no CAPTCHA/honeypot, no rate limit, no body cap, and no server timeouts | A public email-sending route will get spammed and can burn SMTP quota or hang workers | Add `http.MaxBytesReader`, per-IP rate limiting, Turnstile or honeypot protection, Origin/Referer validation, and explicit `http.Server` timeouts |
| High | Code Quality | `main.go:206`, `main.go:296`, `main.go:392` | Resume routes compile LaTeX/HTML during live requests and mutate global cwd with `os.Chdir` | Slow requests, race conditions under concurrency, and brittle process-level behavior | Prebuild resume assets in CI/deploy, serve immutable files, and use `cmd.Dir` instead of `os.Chdir` |
| High | UI/UX | `templates/contact.html:128`, `src/components/ContactFormHandler.ts:23`, `main.go:535` | Contact form is functionally broken: no `name` field exists, but both client and server require one | Visitors cannot successfully submit the form | Add a name input or stop requiring it everywhere; keep validation consistent |
| High | Performance | `main.go:98`, `main.go:116`, `templates/base.html:37`, `templates/base.html:158`, `templates/terminal.html:74`, `src/main.ts:8` | Every request gets a fresh timestamp query param on CSS/JS/images, and all pages load a large JS bundle including root-only startup code | Browser caching is defeated and every page pays for animation code it does not need | Replace runtime timestamps with build hashes and split the startup animation into a root-only bundle |
| Medium | Security | `main.go:660` | Redirect middleware trusts arbitrary `Host` and blindly prepends `www.` | Broken redirects on custom hosts and Host-header redirect abuse patterns | Canonicalize only known hosts, ideally at the reverse proxy |
| Medium | Security | `main.go:694`, `templates/base.html:157`, `templates/terminal.html:68` | No CSP/HSTS/frame protections, plus inline scripts/styles and `hls.js@latest` from CDN | Weakens XSS containment and adds supply-chain risk | Add security headers, remove inline scripts or nonce them, and pin/self-host third-party assets |
| Medium | Security | `main.go:73`, `main.go:546`, `templates/contact.html:143` | Server logs email config metadata and contact PII while the UI claims `NO_LOGS` | Privacy leakage and trust damage | Redact/remove these logs and make the UI truthful |
| Medium | Accessibility | `templates/projects.html:35`, `templates/projects.html:98`, `templates/projects.html:320` | Project cards are mouse-only interactive divs with no keyboard semantics or dialog focus management | Keyboard and assistive-technology users cannot reliably open or close project details | Render cards as buttons/links and treat the overlay as a real dialog with focus trapping and Escape support |
| Medium | Accessibility | `templates/base.html:39`, `templates/contact.html:131`, `src/styles/main.css:367`, `src/styles/nexus-newstyle.css:645`, `templates/home.html:75` | Global scroll is suppressed, focus outlines are removed, and much of the UI uses 8-10px gray text on black | Poor readability, keyboard invisibility, and scroll traps on mobile/assistive tech | Restore visible focus states, allow document scrolling, and raise text size/contrast |
| Medium | UI/UX | `templates/terminal.html:17`, `src/components/StartupAnimation.ts:291`, `templates/home.html:9` | The real homepage is hidden behind a forced boot animation and jargon-heavy labels like `SUBJECT_INFO`, `DOSSIER`, `COMMS_LINK` | Recruiters get delayed and the site obscures what you do instead of clarifying it | Make `/` the actual homepage, keep animation optional/skippable, and use plain-language CTAs |
| Medium | Performance | `src/main.ts:23`, `src/utils/surveillanceWindows.ts:257`, `src/utils/surveillanceWindows.ts:341`, `src/utils/surveillanceWindows.ts:635` | Surveillance feature pulls 511NY/YouTube iframe content, but on the main layout it never mounts because it searches for `.nexus-main` that is not present | Dead code still bloats the bundle, and if fixed naively it would be a major CPU/network/privacy drag | Delete it, or isolate it behind a route-specific lazy import and explicit feature flag |
| Medium | UI/UX | `templates/projects.html:22`, `projects.go:42`, `projects.go:56` | Filter taxonomy omits `mobile` and `ai`, so two of the strongest projects cannot be filtered directly | Weakens information scent and hides strong work | Generate filters from actual project types instead of hardcoding them |
| Medium | UI/UX | `projects.go:184`, `projects.go:198`, `projects.go:240`, `static/images/` | Many project image paths point to files that do not exist | Users get blank/broken project cards and the portfolio looks unfinished | Add CI validation for asset existence and fall back to a real placeholder at render time |

## Deep Review By Category

### Security

The most practical security problem is the public contact endpoint. It sends email but has none of the controls you would normally require on a public site. Redirect handling also trusts the `Host` header, and the app ships with almost no hardening headers.

What I verified:

- `npm audit --omit=dev` returned `0` production vulnerabilities
- `go build ./...` succeeded after modules were fetched

Primary issues:

- No abuse protection on `/contact`
- No explicit server timeouts
- No CSP, HSTS, frame protection, or similar hardening headers
- Inline scripts make CSP adoption harder
- CDN `latest` dependency usage increases supply-chain risk
- Contact and environment-related logging exposes more than it should

### Code Quality / Maintainability

The codebase is split across Go templates, inline scripts, bundled TypeScript, tracked `dist/` output, and tracked binaries. That creates multiple sources of truth and makes future changes riskier than they need to be.

Primary issues:

- Duplicate theme handlers:
  - `src/utils/themeHandler.ts`
  - `src/components/ThemeHandler.ts`
- Mixed logic placement between templates and TS
- Broken `/debug` route points at a file that is not present
- Tracked generated artifacts and binaries make the repo noisier and easier to break
- Resume generation logic mixes request handling with build orchestration

### Performance

You are paying a lot of cost for a mostly static portfolio. The biggest problems are disabled caching, global loading of startup animation code, and runtime work on the server that should have been prebuilt.

Primary issues:

- Per-request timestamp query params defeat browser caching
- `main.js` is large for the app size
- `main.css` is also heavy for a portfolio
- GSAP startup animation is bundled for every page
- Unused `hls.js` is loaded globally
- Surveillance code adds bundle weight without delivering value
- Resume generation executes expensive commands on request paths

### UI/UX

The site is visually distinctive, but the theme often beats the content instead of serving it. A recruiter should understand who you are, what you build, and where to click next within seconds. Right now the information architecture is theatrical first and informative second.

Primary issues:

- Forced startup animation delays access to core content
- Navigation labels are stylish but unclear
- Strongest project categories are not reflected in the filters
- Missing images make parts of the projects section feel unfinished
- Resume iframe is fragile, especially on mobile
- Contact page promises “secure” behavior that the implementation does not support

### Accessibility

This is one of the weaker areas in the current codebase.

Primary issues:

- Focus outlines are explicitly removed
- Keyboard access is incomplete in projects overlay flow
- Labels on the contact form are not associated with inputs via `for`
- Text is often too small and low-contrast
- Global body overflow rules can create scroll traps
- Heavy animation exists without visible reduced-motion handling

## Top Priority Fixes

1. Fix the contact form contract so submissions can actually succeed.
2. Protect `/contact` with anti-abuse controls and server timeouts.
3. Move resume generation out of request handling.
4. Remove runtime timestamp cache-busting and use build hashes.
5. Stop loading GSAP/startup animation code on non-root pages.
6. Replace clickable project `div`s with accessible controls and a real dialog.
7. Add CSP, HSTS, Referrer-Policy, Permissions-Policy, and frame protections.
8. Replace Host-header-based redirect construction with explicit canonical host handling.
9. Reduce the sci-fi jargon on primary navigation and make `/` the real homepage.
10. Clean up dead/stale code and tracked build artifacts.

## Quick Wins

- Remove `hls.js@latest` from `templates/base.html`; it is not used.
- Add `for` attributes to contact labels and `method="post"` to the form.
- Restore visible focus rings instead of `outline: none`.
- Add `aria-label` text to the project close button and support Escape.
- Validate project image paths in a small test or build script.
- Derive project filters from `Project.Type` values.
- Replace relative OG image paths with absolute URLs and fix hardcoded domain mismatches.
- Remove or fix the broken `/debug` route.
- Delete stale files under `dist/` from source control.
- Treat the malformed `static/assets/resume.html` output as broken fallback content, not a reliable feature.

## What I Could Not Fully Verify

- I did not render the site in a live browser here, so color contrast and layout judgments are based on code rather than pixel-perfect screenshots.
- I could not conclusively determine whether the `esbuild` failure is a real repo issue or a sandbox artifact, so the full frontend build should be re-run locally outside this environment.
