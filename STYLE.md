# Personal Portfolio — Style Guide

## Design Foundation: xiaoOS xiaoOS

This portfolio’s visual language is inspired by **xiaoOS (Central Operating System)** from the **xiaoOS** series — the in-world operating system that controls city infrastructure, surveillance, and data. The site is framed as a personal “OS” (xiaoOS) that presents you as a connected, data-driven professional in a high-tech, command-center aesthetic.

**xiaoOS references used:**
- **Map / Blume Complex UI** — Dark base, teal/cyan highlights, uppercase labels, restricted-area red, data overlays.
- **Centralized control / city schematic** — Isometric feel, network lines, cyan callouts, “DOOR LOCK / CAMERAS / SECURITY” style labels.
- **xiaoOS: Building Smart Cities** — Grayscale + electric blue/cyan accent, bold sans-serif headlines, minimal chrome.
- **Traffic / data dashboards** — Black background, blue progress/numbers, circular stats, “VERIFIED OPERATIONS ONLINE” status.
- **“We Are All Connected” / Blume** — Network-dot pattern, urban imagery, light cyan borders, strong headline typography.

The goal is a **sophisticated, high-tech, slightly surveillance/control-room** feel: dark theme by default, limited accent colors, clear hierarchy, and a sense that content is “system data” rather than decorative.

---

## Design Principles

1. **Data-first** — Information is primary; UI supports scanning and hierarchy (labels, values, status).
2. **Strong contrast** — Dark backgrounds with bright accent (cyan/teal, optionally red for warnings).
3. **Uppercase for system UI** — Nav, section headers, labels, and CTAs use UPPERCASE for a technical, command-line tone.
4. **Functional minimalism** — Clean lines, little ornament; borders and corner accents read as “frame” not decoration.
5. **Systemic feel** — Status text, version info, and footer copy reinforce “operating system” rather than generic portfolio.

---

## Color Palette

Aligned with xiaoOS and existing `tailwind.config.js` / `src/styles/main.css`.

| Role | Hex | Usage |
|------|-----|--------|
| **Background (primary)** | `#000000` | Page, cards, panels (dark mode default). |
| **Background (secondary)** | `#0a0a0a` – `#1A1E24` | Subtle variation, overlays. |
| **Surface (light mode)** | `#ffffff` | Cards/panels when theme is light. |
| **Accent (primary)** | `#00FFC2` – `#22d3ee` (cyan/teal) | Active nav, links, highlights, key data, focus rings. |
| **Accent (secondary)** | `#3b82f6` (blue) | Gradients, secondary highlights, data viz. |
| **Warning / restricted** | `#E60026` – `#ef4444` (red) | Errors, “restricted” states, alerts. |
| **Success / online** | `#4ade80` – `#22c55e` (green) | Status: OPERATIONAL, VERIFIED, success. |
| **Caution** | `#f97316` (orange) | Warnings, security notices, demo/CTA emphasis. |
| **Text (primary)** | `#ffffff` | Headings and body on dark. |
| **Text (secondary)** | `#94a3b8` – `#e2e8f0` (gray-300/blue-200) | Descriptions, metadata. |
| **Text (muted)** | `#64748b` (gray-500) | Footer, timestamps. |

**Tailwind usage:** `primary.*`, `cyan.*`, `orange.*`, `green.*`, `red.*` in `tailwind.config.js`. CSS uses `rgba(0, 150, 255, …)` for grid/network tints; keep cyan/teal in the same family for consistency.

---

## Typography

- **Font stack (UI / body):** `font-nexus` — Inter, Roboto, system-ui. Clean, legible sans-serif.
- **Display / headlines:** `font-nexus-display` — Orbitron, Exo 2, Rajdhani. Slightly geometric/tech.
- **Monospace / data:** `font-mono` — Courier New, monospace. Status lines, labels, terminal, code.

**Conventions:**
- **Nav, section titles, panel headers, data labels:** UPPERCASE, `tracking-wider` / `letter-spacing: 0.05em–0.1em`.
- **Headlines:** Bold, large; hero can use gradient (white → blue) and light text-shadow for “glow.”
- **Body:** Regular/medium weight, comfortable line-height; secondary color on dark.
- **Hierarchy:** Size + weight + color (e.g. white for primary, gray/blue-200 for secondary).

---

## Layout & Structure

- **Background:** Full-bleed dark with a subtle **grid + network** layer (`nexus-grid-bg`): light grid lines and optional radial “nodes” to suggest data/surveillance.
- **Max width:** Content constrained (e.g. `max-w-6xl` / `max-w-7xl`) for readability.
- **Nav:** Fixed top bar; compact height (e.g. `h-16`). Logo (xiaoOS) left, links right, UPPERCASE. Active tab: underline or dot in accent color.
- **Sections:** Clear vertical rhythm (`py-16`–`py-20`), consistent horizontal padding.
- **Grids:** Use CSS Grid for profile/content split, project cards, skills, status blocks (e.g. `hero-grid`, `projects-grid`, `skills-grid`, `status-grid`).

---

## Component Patterns (Existing Classes)

These map directly to `src/styles/main.css` and templates.

### Navigation
- **Bar:** `nexus-nav` — fixed, top, with blur/border.
- **Container:** `nexus-nav-container` — flex, centered, h-16.
- **Logo:** `nexus-logo`, `nexus-logo-ct`, `nexus-logo-os` — “xiao” + “OS” (xiaoOS-style split).
- **Links:** `nexus-nav-link` — uppercase; `active` + `::after` for accent underline.
- **Mobile:** `nexus-mobile-toggle`, `nexus-mobile-menu` — same typography and accent in drawer.

### Cards & Panels (xiaoOS “frames”)
- **Profile / data card:** `nexus-profile-card` — black bg, white border, **corner accents** (small L-shape at top-left and bottom-right). Header: `nexus-header` (uppercase strip). Content: `profile-content`, `data-grid`, `data-label`, `data-value`.
- **Generic panel:** `nexus-panel` — same idea: border, corner accents, `panel-header`, body (e.g. `bio-text`).
- **Skill / project cards:** `skill-card`, `project-card` — same border + corner treatment; `project-visual`, `project-title`, `tech-tags`, `project-links`.

**Corner accent rule:** Small (e.g. 6–12px) L-shaped border at top-left and bottom-right of the card to suggest “system frame” without full decoration.

### Data Display
- **Label + value:** `data-label` (uppercase, bold) + `data-value` (mono or sans, in bordered box).
- **Status:** `status-online` (green), `status-warning` (orange), `status-error` (red). Use for OPERATIONAL, VERIFIED, etc.
- **Stats / circles:** `data-circle`, `data-value-large`, `data-label-small` — for numeric KPIs in a dashboard style.
- **Lists:** `experience-item`, `education-card` — left border or timeline dot, clear title/date/body hierarchy.

### Forms
- **Inputs:** `form-input`, `form-textarea` — dark bg, light border, light text; focus: accent ring (`ring-blue-400` / cyan).
- **Validation:** valid → green border, invalid → red; keep xiaoOS look (no heavy rounding).
- **Light mode:** `.light-mode .form-input` etc. switch to light bg and dark text; same structure.

### Buttons
- **Primary:** `nexus-btn nexus-btn-primary` — filled (e.g. white on dark) with hover glow.
- **Secondary:** `nexus-btn nexus-btn-secondary` — outline, invert on hover.
- **Style:** Uppercase, `tracking-wide`, border-2; no heavy rounding to keep “system” feel.

### Terminal / Startup
- **Block:** `nexus-terminal` — black, white/cyan border, mono text.
- **Startup animation:** `startup-terminal`, `startup-terminal-header`, `startup-terminal-content` — green/cyan/red by “channel,” optional scanline/glitch.
- **Status line:** `terminal-line`, `terminal-prompt`, `terminal-success` — cyan/green for system messages.

### Surveillance / Theming
- **Overlay panels:** `surveillance-window`, `surveillance-camera`, `surveillance-data` — blurred, semi-transparent, for any “feed” or data-overlay feel.
- **Theme:** Dark by default; `.light-mode` flips nav, cards, text, and borders (e.g. `nexus-nav` → dark bar in light mode, light cards). Accent can stay cyan or shift to blue for contrast.

### Footer
- **Bar:** `nexus-footer` — top border, dark bg, system-style copy (“SYSTEM STATUS”, “NETWORK”, “BUILD INFO”).
- **Links:** `footer-link` — uppercase, hover to accent (e.g. cyan).
- **Status block:** Reuse `status-online` / small mono text for UPTIME, VERSION, etc.

---

## Component Requirements (Existing)

Requirements for every **existing** component used in the site. New UI must follow these so the xiaoOS look stays consistent.

### Global layout
| Component | Location | Requirements |
|-----------|----------|--------------|
| **Background** | `base.html` | `nexus-grid-bg` — full viewport, fixed, z behind content; grid + optional radial nodes; no pointer events. |
| **Nav bar** | `base.html` | `nexus-nav` + `nexus-nav-container`; logo `nexus-logo` with `nexus-logo-ct` (“xiao”) + `nexus-logo-os` (“OS”); links in `nexus-nav-links`; each link `nexus-nav-link`, active page has class `active`; same structure in light mode (nav inverts). |
| **Mobile menu** | `base.html` | `nexus-mobile-menu` (hidden by default, toggled by JS); same links as desktop; include theme toggle; `nexus-mobile-toggle` button (visible below md breakpoint). |
| **Main** | `base.html` | `nexus-main` — wraps page content; top padding for fixed nav (e.g. mt-16). |
| **Footer** | `base.html` | `nexus-footer` + `footer-content`; system-status grid (SYSTEM STATUS, NETWORK, SECURITY, BUILD INFO); `footer-main` (copyright + `footer-links`); links `footer-link` (uppercase, hover accent). |

### Profile & data cards
| Component | Location | Requirements |
|-----------|----------|--------------|
| **Profile card** | `home.html`, `about.html` | `nexus-profile-card` — border-2 white/dark, corner accents (::before top-left, ::after bottom-right); `nexus-header` strip (e.g. “PROFILE”, “DETAILED PROFILE”); `profile-content`; `profile-image` (bordered, contains img); `data-grid` (grid of fields). |
| **Data field** | Multiple | Each: `data-label` (uppercase, bold) + `data-value` (bordered box); optional `data-link` inside value for mailto/external links. Use `data-field` wrapper where grid layout is used. |
| **Threat level** | `home.html` | `threat-level` — small status strip (e.g. “THREAT LEVEL: MINIMAL”); orange/warning styling, centered text. |

### Panels
| Component | Location | Requirements |
|-----------|----------|--------------|
| **Panel** | All pages | `nexus-panel` — same border + corner accents as profile card; `panel-header` (uppercase strip); body content (e.g. `bio-text`, or custom). Must support light mode (border/corners flip to black). |
| **Bio text** | `home.html`, `about.html` | `bio-text` — readable body copy; secondary text color; comfortable line-height. |

### Skills
| Component | Location | Requirements |
|-----------|----------|--------------|
| **Skills grid** | `home.html`, `about.html` | `skills-grid` — responsive grid (e.g. 1/2/3 cols); each item `skill-card`. |
| **Skill card** | Same | `skill-card` — border + corner accents; `nexus-header` for category name; `skill-content`; each row `skill-item` (label + `skill-level` with `skill-dot` x3); optional “STATUS: OPERATIONAL” row with `status-online`. |

### Projects
| Component | Location | Requirements |
|-----------|----------|--------------|
| **Projects grid** | `home.html`, `projects.html` | `projects-grid` — responsive grid of `project-card`; on Projects page wrapped in `projects-container` (scrollable, max-height). |
| **Project card** | Same | `project-card` — border + corner accents; optional `nexus-header` (“PROJECT N”); `project-content`; `project-visual` (aspect-video, img or placeholder); `project-title`; `project-description` (line-clamp 3); `tech-stack` → `tech-label` + `tech-tags` with `tech-tag`; `project-links` (SOURCE CODE, LIVE DEMO, etc.); `project-link`, `project-link demo` for demo links. On Projects page: `data-type`, `data-status`, `data-demo` for filtering. |
| **Filter controls** | `projects.html` | `nexus-panel` with `panel-header` “FILTER CONTROLS”; `nexus-actions` (flex wrap, gap) with filter buttons. |
| **Filter buttons** | `projects.html` | Category: `nexus-btn nexus-btn-secondary filter-btn` + `data-filter` (all, web, academic, security, research, tool). Status: `nexus-btn nexus-btn-tertiary status-filter-btn` + `data-status` (all, active, in-development, archived). Demo: `nexus-btn nexus-btn-tertiary demo-filter-btn` + `data-demo` (all, live, hosted, video, screenshot). Active filter has class `active`. *Note: `nexus-btn-tertiary` and `status-offline` are used in templates but may need to be added to CSS if not present.* |

### Buttons
| Component | Location | Requirements |
|-----------|----------|--------------|
| **Primary** | Multiple | `nexus-btn nexus-btn-primary` — solid fill (white on dark); uppercase; border-2; hover glow. |
| **Secondary** | Multiple | `nexus-btn nexus-btn-secondary` — transparent, bordered; invert on hover. |
| **Tertiary** | `projects.html` | `nexus-btn nexus-btn-tertiary` — used for filter toggles (status/demo); visually lighter than secondary. Define in CSS if missing. |

### Status & stats
| Component | Location | Requirements |
|-----------|----------|--------------|
| **Status grid** | `home.html`, `contact.html`, `projects.html` | `status-grid` — 2/4 col grid of `status-item`; each has label + value. |
| **Status item** | Same | `status-item` — bordered box; use `data-stat` + `data-stat-label` for numeric stats, or `status-online` / `status-warning` for text. |
| **Status text** | Multiple | `status-online` (green), `status-warning` (orange), `status-error` (red); `status-offline` for “ARCHIVED” (use gray/muted if not defined). `status-text` for label, `status-value` for value. |
| **Stats grid** | `about.html` | `stats-grid` — 2-col; `stat-item` with `stat-value` (e.g. `stat-experience`, `stat-projects`) and `stat-label`. |

### Forms
| Component | Location | Requirements |
|-----------|----------|--------------|
| **Form container** | `contact.html` | `nexus-panel` with `panel-header` “SECURE MESSAGE FORM”; form id `contact-form` (required for ContactFormHandler). |
| **Form group** | Same | `form-group`; `data-label form-label` (uppercase); `form-input` or `form-textarea`; validation states via valid/invalid, focus ring accent. |
| **Form actions** | Same | `nexus-actions` with submit `nexus-btn nexus-btn-primary` (id `submit-btn`) and reset `nexus-btn nexus-btn-secondary`. |
| **Form message** | Same | `#form-message` — hidden by default; ContactFormHandler shows success/error here. |

### Terminal (inline)
| Component | Location | Requirements |
|-----------|----------|--------------|
| **Terminal block** | `home.html`, `contact.html`, `projects.html` | `nexus-terminal` — black bg, white/cyan border, mono font; contains `terminal-line` elements. |
| **Terminal line** | Same | `terminal-line`; optional `terminal-prompt` (e.g. “root@xiaoos:~$”); `terminal-success` for checkmarks; `terminal-highlight` for “>”; `terminal-pulse` for cursor/blink. |

### Experience & education
| Component | Location | Requirements |
|-----------|----------|--------------|
| **Experience panel** | `about.html` | `nexus-panel`; `panel-header` “EMPLOYMENT HISTORY”; `experience-container` (scrollable); each `experience-item` (timeline dot + `experience-card`). |
| **Experience card** | Same | `experience-card`; `experience-header` (position + company + dates); `experience-position`, `experience-company`, `experience-dates`; `experience-location`; `experience-description` with `experience-bullet`; `experience-tech` with `tech-tag`. |
| **Education panel** | `about.html` | `nexus-panel`; `panel-header` “EDUCATION RECORDS”; `education-container`; each `education-item` → `education-card` with `education-institution`, `education-degree`, `education-dates`, `education-location`, optional `education-gpa`. |

### Security & notices
| Component | Location | Requirements |
|-----------|----------|--------------|
| **Security notice** | `contact.html` | `security-notice` — bordered, orange accent; `security-notice-header` “SECURITY NOTICE”; `security-notice-text`. |

### Status bar (compact)
| Component | Location | Requirements |
|-----------|----------|--------------|
| **Nexus status bar** | `projects.html` | `nexus-status-bar` — one-line mono text (e.g. “DATABASE_ACCESS: AUTHORIZED | CLEARANCE_LEVEL: 3”); small, accent color. |

### TypeScript / JS components
| Component | Source | Requirements |
|-----------|--------|--------------|
| **ContactFormHandler** | `src/components/ContactFormHandler.ts` | Init on DOMContentLoaded. Binds to `#contact-form`, `#submit-btn`, `#form-message`. On submit: validate, POST `/contact` JSON, show success/error in form-message; disable submit while sending; reset form on success. |
| **ThemeHandler** | `src/utils/themeHandler.ts` | Init via `initThemeHandler()`. Reads `localStorage.theme`, default dark; applies `light-mode` to `document.documentElement` and `document.body` when light. Listens to `#theme-toggle` and `#mobile-theme-toggle`; updates `.theme-icon-dark` / `.theme-icon-light` visibility. |
| **StartupAnimation** | `src/components/StartupAnimation.ts` | Creates `#startup-animation` overlay with class `startup-animation-overlay`; main terminal `startup-terminal startup-terminal-main main-terminal-base`; header “xiaoOS v2.1 - Main Terminal”; content div for typed lines. Runs OS loading sequence then removes overlay. |
| **SmoothScroll** | `src/utils/smoothScroll.ts` | Smooth scroll behavior for in-page links. |
| **AnimationObserver** | `src/utils/animationObserver.ts` | Scroll-triggered animations for content. |
| **GlitchAnimations** | `src/utils/glitchAnimations.ts` | Glitch effects (used sparingly for xiaoOS feel). |
| **SurveillanceWindows** | `src/utils/surveillanceWindows.ts` | Surveillance-window effects; init after short delay. |

---

## Page Requirements (Existing)

Structure and required elements for each **existing** page. Templates extend `base.html` and render inside `nexus-main`.

### Home (`/home`), template: `home.html`
| Area | Requirements |
|------|--------------|
| **Hero** | `hero-section`; optional status block (top-right): SYSTEM_ID, STATUS, UPTIME with `text-green-400` for OPERATIONAL. |
| **Layout** | `hero-grid` — left: one `nexus-profile-card` (PROFILE header, image, data-grid: NAME, STATUS, LOCATION, ROLE, EXPERIENCE, FOCUS; threat-level strip). Right: `main-content` — `nexus-title` (“SYSTEM ONLINE” + highlight), `nexus-subtitle` (title), one `nexus-panel` (PROFILE DATA + bio-text), `nexus-actions` (VIEW PROJECTS, CONTACT ME). |
| **Skills** | `section` + `container`; `section-header` with `nexus-header` “TECHNICAL SKILLS” and `section-title` “SKILLS & EXPERTISE”; `skills-grid` of `skill-card` per category; each card has STATUS: OPERATIONAL. |
| **Projects** | `section`; `section-header` (FEATURED PROJECTS, RECENT WORK); `projects-grid` with first 3 projects; each `project-card` with project-content, panel-header, project-visual, project-title, project-description, tech-stack, project-links; “VIEW ALL PROJECTS” `nexus-btn nexus-btn-primary`. |
| **Communication** | `section`; single `nexus-panel` (max-width 800px, centered); panel-header “GET IN TOUCH”; section-title “LET’S CONNECT”; `nexus-terminal` with short status lines; section-description; “CONTACT ME” button; `status-grid` (STATUS, RESPONSE TIME, PRIORITY). |

### About (`/about`), template: `about.html`
| Area | Requirements |
|------|--------------|
| **Header** | `section` + `container`; `section-header`; `nexus-header` “PERSONNEL FILE”; `section-title` “SUBJECT DOSSIER”. |
| **Layout** | `hero-grid` — left: one `nexus-profile-card` (DETAILED PROFILE, image, data-grid: FULL NAME, PROFESSION, LOCATION, CONTACT, CLEARANCE, STATUS; `stats-grid` with WORK EXPERIENCE count, PROJECTS count). Right: stacked panels. |
| **Panels** | (1) `nexus-panel` BIOGRAPHICAL DATA + bio-text. (2) EMPLOYMENT HISTORY + `experience-container` (experience-item → experience-card). (3) EDUCATION RECORDS + `education-container` (education-item → education-card). (4) TECHNICAL COMPETENCIES + `skills-grid` of skill-cards. (5) If interests exist: PERSONAL INTERESTS + tech-tags. |

### Projects (`/projects`), template: `projects.html`
| Area | Requirements |
|------|--------------|
| **Header** | `section` + `container`; `section-header` (relative); optional `nexus-status-bar` top-right (“DATABASE_ACCESS: AUTHORIZED | CLEARANCE_LEVEL: 3”); `nexus-header` “PROJECT DATABASE”; `section-title` “DEVELOPMENT ARCHIVE”; `section-description`. |
| **Stats** | `status-grid` (4 items): Total Projects, Technologies, Success Rate, Latest Build. |
| **Filters** | `nexus-panel` FILTER CONTROLS; three rows of buttons: category (filter-btn), status (status-filter-btn), demo type (demo-filter-btn); active state class `active`. |
| **Terminal** | `nexus-terminal` with query_project_database-style lines; dynamic project count in last line (updated by filter script). |
| **List** | `projects-container` > `projects-grid`; each project `project-card` with `data-type`, `data-status`, `data-demo`; nexus-header “PROJECT {{.ID}}”; project-content (visual, title, description, tech-stack, project-links, status row with status-online/warning/offline + date). |
| **Footer** | “PROJECT DATABASE ACCESS LOG”, Last Updated, Access Level. |
| **Script** | Inline filter script: filter by data-type, data-status, data-demo; toggle `active` on buttons; show/hide cards; update terminal line with visible count. |

### Contact (`/contact`), template: `contact.html`
| Area | Requirements |
|------|--------------|
| **Header** | `section` + `container`; `section-header`; `nexus-header` “COMMUNICATION PROTOCOL”; `section-title` “ESTABLISH CONNECTION”; `section-description`. |
| **Layout** | `hero-grid` — left: (1) `nexus-panel` SYSTEM STATUS with skill-item rows (Communication, Encryption, Response Time, Availability) and status-online/warning. (2) `nexus-panel` DIRECT CHANNELS with data-label + data-value (EMAIL, LINKEDIN, GITHUB, LOCATION) and data-link where applicable. (3) `security-notice`. Right: (1) `nexus-terminal` (initialize_secure_channel, SSL/TLS, etc.). (2) `nexus-panel` SECURE MESSAGE FORM with form id `contact-form`, fields name/email/subject/message, submit “TRANSMIT MESSAGE”, reset “CLEAR FORM”, and `#form-message`. |
| **Quick actions** | Centered `nexus-header` “QUICK ACTIONS”; `nexus-actions` (DIRECT EMAIL, LINKEDIN, RESUME, PROJECTS). |

### Resume (`/resume`), template: `resume.html`
| Area | Requirements |
|------|--------------|
| **Header** | `section` + `container`; `section-header`; `nexus-header` “PERSONNEL DOCUMENTATION”; `section-title` “PROFESSIONAL RESUME”; `section-description`. |
| **Actions** | Centered `nexus-panel` DOCUMENT ACCESS; nexus-btn-primary “DOWNLOAD PDF” (href /resume/download); nexus-btn-secondary “PRINT” (onclick window.print); small text: Last Updated, Version, Classification status-online. |
| **Preview** | `nexus-panel` RESUME PREVIEW; iframe `src="/resume/pdf"` (title “Resume Preview”), fixed height (e.g. 800px). |
| **CTA** | Centered `nexus-panel` “INTERESTED IN WORKING TOGETHER?” + short copy + “GET IN TOUCH” to /contact. |
| **Print** | Inline `<style>` @media print: hide nexus-nav, nexus-footer; force white bg, black text; hide panel-header; ensure iframe/content prints. |

### Base layout (all pages)
| Area | Requirements |
|------|--------------|
| **Shell** | `nexus-grid-bg`; `nexus-nav`; `nexus-mobile-menu`; `nexus-main` (content injected by route); `nexus-footer` with system-status grid and footer-main/footer-links. |
| **Nav links** | HOME (/home), ABOUT (/about), PROJECTS (/projects), RESUME (/resume), CONTACT (/contact). Active link gets class `active` via `{{if eq .TemplateName "…"}}`. |
| **Footer** | Four status columns (SYSTEM STATUS, NETWORK, SECURITY, BUILD INFO); copyright “xiaoOS PORTFOLIO SYSTEM”; links EMAIL, LINKEDIN, GITHUB, RESUME. |

### Terminal / Landing (`/`), template: `terminal.html`
| Area | Requirements |
|------|--------------|
| **Note** | Standalone page (does not extend `base.html`); used as entry/landing at `/`. |
| **Layout** | Full-page black, mono font; `#startup-animation` overlay (class `startup-animation-overlay`) for StartupAnimation; nav and main initially hidden (opacity 0, transform). |
| **Nav** | `nexus-nav` with `nexus-nav-brand` / `nexus-nav-logo` (name text); `nexus-nav-menu` (Home, About, Projects, Contact, Resume); `nexus-nav-toggle` for mobile. |
| **Main** | `nexus-main` > `nexus-container` > `nexus-hero` > `nexus-hero-content`; `nexus-hero-title` (main + sub); `nexus-hero-description`; `nexus-hero-actions` with “Enter Portfolio” (primary) and “About Me” (secondary). |

---

## Project Structure (Where Style Lives)

| What | Where |
|------|--------|
| **Global styles, components, utilities** | `src/styles/main.css` |
| **Colors, fonts, shadows, keyframes** | `tailwind.config.js` |
| **Layout, nav, footer, scripts** | `templates/base.html` |
| **Page content** | `templates/home.html`, `about.html`, `projects.html`, `contact.html`, `resume.html`; `terminal.html` (standalone landing at `/`) |
| **Built CSS** | `static/css/main.css` (from build) |
| **Theme / startup / glitch** | `src/components/ThemeHandler.ts`, `StartupAnimation.ts`; `src/utils/themeHandler.ts`, `glitchAnimations.ts`, `surveillanceWindows.ts` |

When adding or changing UI:
1. Prefer existing `nexus-*` and section classes.
2. Use Tailwind tokens from `tailwind.config.js` (primary, cyan, orange, etc.).
3. Keep uppercase for nav, headers, and data labels.
4. Preserve corner accents and border style on new cards/panels.

---

## Animation & Effects

- **Grid / network:** Low-opacity pulse or static grid (`nexus-grid-bg`, `networkPulse`) to suggest live data.
- **Hover:** Subtle border glow (cyan) and light shadow on cards and buttons; avoid flashy motion.
- **Loading / entry:** `nexus-load`, `fade-in-up`, `xiaoosLoad` — short, subtle (e.g. 0.5–0.8s).
- **Terminal:** Typing/cursor and optional scanline/glitch for startup only; keep main content calm.
- **Data flow:** Optional thin gradient lines (`connection-line`, `network-connection`) for “data stream” feel; keep opacity low so they don’t dominate.

---

## Accessibility & Responsiveness

- **Contrast:** Ensure white/light text on dark and dark text on light meet WCAG AA where possible; accent (cyan) on black should be checked for focus/links.
- **Focus:** Visible focus ring (accent color); never remove outline without a clear replacement.
- **Touch:** Minimum ~44px tap targets for nav, buttons, and links on mobile.
- **Breakpoints:** Follow existing `main.css` (e.g. 480px, 768px, 1024px) for nav collapse, grid columns, and font size; keep xiaoOS look (uppercase, borders) at all sizes.

---

## Summary: “xiaoOS” in One Sentence

The portfolio presents you as a **personal operating system**: dark, high-contrast, data-oriented UI with cyan/teal accents, uppercase system labels, framed cards with corner accents, and status/terminal touches — all inspired by xiaoOS’ xiaoOS so the site feels like a command center rather than a generic CV.

Use this doc as the single source of truth for visual and interaction decisions; when in doubt, prefer clarity and system-like consistency over extra decoration.
