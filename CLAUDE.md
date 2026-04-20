# Personal Portfolio — David Xiao (xiaoOS)

## Tech Stack

- **Backend:** Go 1.21+ with Gorilla Mux, server-rendered templates
- **Frontend:** Vanilla TypeScript, Tailwind CSS 3.3, GSAP, esbuild
- **Deployment:** Docker, Heroku

## Design Context

**Authoritative design system, tokens, and principles:** [`.impeccable.md`](.impeccable.md) (xiaoOS × Wu Wei — hiring-first, warm dark UI, single cyan accent, IBM Plex Sans + Mono, section rail + scroll-spy).

**In one line:** Recruiters and engineers should trust the craft in 30 seconds; the UI should feel like a plausible command-center product, not a template or spectacle.

**Constraint:** Keep the existing xiaoOS boot sequence (`StartupAnimation` + related CSS); refactor tokens or boot copy around it — do not remove the intro wholesale.
