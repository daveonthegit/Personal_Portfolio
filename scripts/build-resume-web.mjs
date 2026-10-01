#!/usr/bin/env node
/**
 * Generates the web-facing resume surfaces from the career-ops CV export.
 *
 * Input   data/cv.json            full export (includes non-public contacts)
 * Outputs static/assets/resume.html      standalone page, styled by resume.css
 *         static/assets/resume-ats.txt   plain-text version for ATS parsers
 *         static/data/cv.json            public projection consumed by the site
 *
 * The PDF and resume.tex are built upstream (career-ops) and copied in; this
 * script never touches them. Content edits belong in the export, not here.
 * Run: npm run build:resume:web
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cv = JSON.parse(readFileSync(join(root, 'data/cv.json'), 'utf8'));

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2026-06" -> "June 2026"; null -> "Present". */
const month = (ym) => {
  if (!ym) return 'Present';
  const [y, m] = ym.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
};

const range = (start, end) => `${month(start)} – ${month(end)}`;

/** Optional per-role `stack` list (e.g. the PDF's "TypeScript, React, ..." line); empty when absent. */
const stackOf = (e) => e.stack ?? [];

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Contacts the site may publish, in a stable display order. */
const CONTACT_ORDER = ['location', 'email', 'phone', 'portfolio', 'github', 'linkedin'];
const contacts = CONTACT_ORDER.filter((k) => cv.contact?.[k]?.value).map((k) => ({
  key: k,
  value: cv.contact[k].value,
  public: cv.contact[k].public === true,
}));

const hrefFor = ({ key, value }) => {
  if (key === 'email') return `mailto:${value}`;
  if (key === 'phone') return `tel:${value.replace(/[^0-9+]/g, '')}`;
  if (key === 'location') return null;
  return `https://${value.replace(/^https?:\/\//, '')}`;
};

// ---------------------------------------------------------------- HTML

const contactHTML = contacts
  .map((c) => {
    const href = hrefFor(c);
    return href
      ? `<a href="${esc(href)}">${esc(c.value)}</a>`
      : `<span>${esc(c.value)}</span>`;
  })
  .join('\n      <span class="sep" aria-hidden="true">·</span>\n      ');

const experienceHTML = cv.experience
  .map(
    (e) => `      <article class="entry">
        <header class="entry-head">
          <h3>${esc(e.role)} <span class="org">— ${esc(e.company)}</span></h3>
          <p class="meta">${esc(e.location)} · ${esc(range(e.start, e.end))}</p>${
            stackOf(e).length ? `\n          <p class="meta">${esc(stackOf(e).join(' · '))}</p>` : ''
          }
        </header>
        <ul>
${e.bullets.map((b) => `          <li>${esc(b)}</li>`).join('\n')}
        </ul>
      </article>`,
  )
  .join('\n');

const projectsHTML = cv.projects
  .map(
    (p) => `      <article class="entry">
        <header class="entry-head">
          <h3>${esc(p.name)}</h3>
          <p class="meta">${esc((p.technologies ?? []).join(' · '))}</p>
        </header>
        <ul>
${p.bullets.map((b) => `          <li>${esc(b)}</li>`).join('\n')}
        </ul>
      </article>`,
  )
  .join('\n');

const educationHTML = cv.education
  .map(
    (ed) => `      <article class="entry">
        <header class="entry-head">
          <h3>${esc(ed.degree)} <span class="org">— ${esc(ed.institution)}</span></h3>
          <p class="meta">${esc(ed.location)} · ${esc(month(ed.end))}${
            ed.honors?.length ? ` · ${esc(ed.honors.join(', '))}` : ''
          }</p>
        </header>
      </article>`,
  )
  .join('\n');

const skillsHTML = cv.skills
  .map(
    (s) => `        <div class="skill-row">
          <dt>${esc(s.category)}</dt>
          <dd>${esc(s.items.join(', '))}</dd>
        </div>`,
  )
  .join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(cv.name)} — Resume</title>
    <link rel="stylesheet" href="resume.css">
    <style>
      body { max-width: 52rem; margin: 0 auto; padding: 2.5rem 1.25rem 4rem;
             font-family: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
             font-size: 15px; line-height: 1.55; color: #16181d; background: #fff; }
      h1 { font-size: 2rem; letter-spacing: 0.02em; margin: 0 0 0.4rem; }
      h2 { font-size: 0.85rem; letter-spacing: 0.14em; text-transform: uppercase;
           margin: 2rem 0 0.75rem; padding-bottom: 0.35rem; border-bottom: 1px solid #c9cdd6; }
      h3 { font-size: 1rem; margin: 0; }
      .contact { margin: 0 0 0.5rem; font-size: 0.9rem; }
      .contact a { color: #0b6b7a; }
      .contact .sep { color: #8c929e; margin: 0 0.15rem; }
      .summary { margin: 0.75rem 0 0; }
      .entry { margin: 0 0 1.1rem; }
      .entry-head .org { font-weight: 400; color: #4a5060; }
      .meta { margin: 0.15rem 0 0.4rem; font-size: 0.85rem; color: #5a6070; }
      ul { margin: 0; padding-left: 1.15rem; }
      li { margin: 0 0 0.3rem; }
      .skills { margin: 0; }
      .skill-row { display: flex; gap: 0.6rem; margin: 0 0 0.35rem; flex-wrap: wrap; }
      .skill-row dt { font-weight: 600; min-width: 11rem; }
      .skill-row dd { margin: 0; flex: 1 1 18rem; }
      @media print { body { padding: 0; font-size: 11pt; } }
    </style>
</head>
<body>
    <header class="resume-head">
      <h1>${esc(cv.name)}</h1>
      <p class="contact">
      ${contactHTML}
      </p>${cv.summary ? `\n      <p class="summary">${esc(cv.summary)}</p>` : ''}
    </header>

    <section>
      <h2>Education</h2>
${educationHTML}
    </section>

    <section>
      <h2>Work Experience</h2>
${experienceHTML}
    </section>

    <section>
      <h2>Projects</h2>
${projectsHTML}
    </section>

    <section>
      <h2>Skills</h2>
      <dl class="skills">
${skillsHTML}
      </dl>
    </section>
</body>
</html>
`;

// ---------------------------------------------------------------- ATS text

const lines = [];
lines.push(cv.name);
lines.push(contacts.map((c) => c.value).join(' | '));
if (cv.summary) {
  lines.push('', 'Summary', cv.summary);
}

lines.push('', 'Education');
for (const ed of cv.education) {
  const honors = ed.honors?.length ? ` | ${ed.honors.join(', ')}` : '';
  lines.push(`${ed.degree} | ${ed.institution} | ${ed.location} | ${month(ed.end)}${honors}`);
}

lines.push('', 'Experience');
for (const e of cv.experience) {
  lines.push(`${e.role} | ${e.company} | ${e.location} | ${range(e.start, e.end)}`);
  if (stackOf(e).length) lines.push(`Stack: ${stackOf(e).join(', ')}`);
  for (const b of e.bullets) lines.push(`- ${b}`);
  lines.push('');
}
if (lines.at(-1) === '') lines.pop();

lines.push('', 'Projects');
for (const p of cv.projects) {
  lines.push(`${p.name} | ${(p.technologies ?? []).join(', ')}`);
  for (const b of p.bullets) lines.push(`- ${b}`);
  lines.push('');
}
if (lines.at(-1) === '') lines.pop();

lines.push('', 'Skills');
for (const s of cv.skills) lines.push(`${s.category}: ${s.items.join(', ')}`);

const ats = `${lines.join('\n')}\n`;

// ---------------------------------------------------------------- public cv.json

// static/data/cv.json is served at /static/data/cv.json, so contacts marked
// public:false in the export are dropped. Everything else ships verbatim.
const publicCv = {
  ...cv,
  contact: Object.fromEntries(
    Object.entries(cv.contact ?? {}).filter(([, v]) => v?.public === true),
  ),
};

// ---------------------------------------------------------------- write

const outputs = [
  ['static/assets/resume.html', html],
  ['static/assets/resume-ats.txt', ats],
  ['static/data/cv.json', `${JSON.stringify(publicCv, null, 2)}\n`],
];

for (const [rel, content] of outputs) {
  writeFileSync(join(root, rel), content, 'utf8');
  console.log(`wrote ${rel}`);
}
