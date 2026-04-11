# Personal Portfolio — David Xiao (xiaoOS)

## Tech Stack

- **Backend:** Go 1.21+ with Gorilla Mux, server-rendered templates
- **Frontend:** Vanilla TypeScript, Tailwind CSS 3.3, GSAP, esbuild
- **Deployment:** Docker, Heroku

## Design Context

### Users

**Primary goal: get hired.** Audience is recruiters, hiring managers, and engineers screening candidates — mostly desktop, professional evaluation. Must scan fast (role, stack, proof) and feel **credible and in control** in the first 30 seconds; still reward a deeper read. Secondary: collaborators evaluating fit.

### Brand Personality

**Futuristic · Creative · Hacker** — resourceful and systems-minded, not edgy. **First-impression target: confidence** (trustworthy engineer), not gimmickry.

### Aesthetic Direction

**xiaoOS — refined command-center interface.** Designed product, not movie prop. Dark by default. Spirit: Bloomberg-like density, CLI confidence, mission-control clarity. **Avoid:** generic portfolio templates, AI-default visuals (gradient text, glass-everywhere, neon slop), gamer chrome, spectacle without substance.

### Design Principles

1. **Hiring-first clarity** — signal before spectacle.  
2. **Functional beauty** — every element earns its place.  
3. **Plausible fiction** — consistent OS-like UI and copy.  
4. **Information density** — data-rich, never cluttered.  
5. **Refined restraint** — surgical accents.  
6. **Earn the wow** — coherence and craft, not one-off tricks.

### Accessibility

Best-effort: semantics, focus, contrast, `prefers-reduced-motion` for heavy motion — not a formal WCAG certification unless scoped later.

### Constraints

- **Startup animation:** Preserve the existing xiaoOS boot / loader (`StartupAnimation` + related CSS). Token refactors and optional boot **copy** tweaks are fine; do not replace the intro wholesale.
