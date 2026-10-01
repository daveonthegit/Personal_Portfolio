# David Xiao - Personal Portfolio

A modern personal portfolio built with **Go** backend and **TypeScript** frontend, serving a resume generated from the career-ops export.

## Features

- **Go Web Server** with clean routing and template rendering
- **TypeScript Frontend** with modern build system (esbuild + Tailwind CSS)
- **Resume surfaces** - PDF, HTML and ATS text generated from the career-ops CV export
- **xiaoOS interface** with a warm dark palette, desktop windows and mobile documents
- **Interactive Components**: Contact form, project filtering, smooth animations
- **Resume Serving**: Multiple formats (HTML, PDF, LaTeX source)

## Tech Stack

**Backend:**
- Go 1.21+ with Gorilla Mux
- HTML templates
- Static file serving

**Frontend:**
- TypeScript with esbuild
- Tailwind CSS with PostCSS
- Vanilla TypeScript, GSAP and a lazy-loaded three.js city

**Resume System:**
- `data/cv.json` career-ops export as the single input
- Deterministic web/ATS generation, committed artifacts served as-is
- Multiple format serving

## Prerequisites

1. **Go 1.21+** - [Download here](https://golang.org/dl/)
2. **Node.js 18+** - [Download here](https://nodejs.org/)
3. **LaTeX Distribution** (optional, for resume PDF generation):
   - **Windows**: [MiKTeX](https://miktex.org/)
   - **macOS**: `brew install --cask mactex`
   - **Linux**: `sudo apt-get install texlive-full`
   
   **Note**: The portfolio works without LaTeX. You can manually compile your resume or use online LaTeX editors.

## Quick Start

1. **Clone and setup:**
   ```bash
   git clone <your-repo>
   cd Personal_Portfolio
   
   # Install Go dependencies
   go mod tidy
   
   # Install Node.js dependencies
   npm install
   ```

2. **Build frontend assets:**
   ```bash
   npm run build
   ```

3. **Optional - Build resume PDF (requires LaTeX):**
   ```bash
   # If you have LaTeX installed
   npm run build:resume
   
   # Or build everything including resume
   npm run build:full
   ```

4. **Run the server:**
   ```bash
   go run .
   ```

5. **Visit your portfolio:**
   Open http://localhost:8080

## Development Workflow

### For Development with Auto-reload:
```bash
npm run dev
```

This starts:
- TypeScript compilation with watch mode
- CSS compilation with watch mode  
- Go server

### Building Individual Components:
```bash
# Build TypeScript only
npm run build:ts

# Build CSS only
npm run build:css

# Build resume PDF from LaTeX (only needed if the PDF is missing)
npm run build:resume

# Regenerate resume HTML, ATS text and served cv.json
npm run build:resume:web
```

## Intro, accessibility and browser checks

- `/` plays the preserved X-grid → strike bars → diamond → System Loading boot, then the city acquisition and Dossier arrival. `/home` and other document routes do not replay it; `/home#file` opens the Dossier directly on mobile. Section hashes and `?noboot=1` also bypass the intro without losing the destination.
- **Bypass intro** is a server-rendered link, available before JavaScript downloads. Escape cancels the entire chain, including pending imports and nested timelines. **Replay intro** starts a fresh front-door visit.
- The animation budget is eight seconds **after the frontend starts**, not a promise about network load time. An independent watchdog releases the document if animation stalls; an empty boot cover also fails open through CSS when the entry script cannot load.
- Reduced motion keeps a short, static sequence of the same narrative stages, without flashes, camera movement or a WebGL download. Unavailable or late WebGL uses the SVG acquisition. The city prepares shader variants and uploads textures across tasks; Projects-room textures load only when that room is entered.
- Inside a city room, small screen-anchored buttons (**Open**, **View project**, **Play**) mark the clickable screens. They are ordinary focusable buttons, so Enter works where a click does; clicking the screen itself runs the same action.
- Project build notes use native disclosure elements. Full project documents remain readable when the interactive index fails. Reveals enhance already-visible content, never gate it. The project dialog contains Tab focus and returns focus on Escape; app windows restore focus to their dock controls.

Build and run the usual Go/TypeScript checks:

```bash
npm run build
npm run type-check
npm run test:models
go test ./...
go vet ./...
```

The procedural miniature's design and geometry budgets are recorded in [`DESIGN.md`](DESIGN.md). `npm run test:models` validates batched geometry and the interior screen/handoff contracts without a browser.

Optional real-browser regression/measurement commands require **Node 22+** (built-in WebSocket), an existing Chrome/Chromium, a local server, and a dedicated browser profile. No additional test packages are required. For example on macOS, in separate terminals:

```bash
PORT=18437 go run .
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --remote-debugging-port=18438 \
  --user-data-dir="$PWD/.local/chrome-checks" --no-first-run about:blank
npm run test:browser
npm run measure:intro -- after desktop
npm run measure:intro -- after mobile
```

`PORTFOLIO_URL` and `CHROME_PORT` override the regression script's endpoints. The measurement script accepts the server URL as its third argument and uses Chrome port 18438. Both tools write to `docs/evidence/intro-ux/`; screenshots are verified as nonempty files. Tests never send a contact message. Use a **dedicated** browser, not your everyday profile.

Review, measurement settings, limitations and before/after screenshots: [Intro and UX review](docs/intro-ux-review.md). Design context: [PRODUCT.md](PRODUCT.md) and [.impeccable.md](.impeccable.md). Impeccable's optional live config targets `templates/base.html`; live script injection was not enabled and the Go CSP in `middleware.go` was not changed.

## Resume Management

The resume comes from the `career-ops` CV export, not from hand-editing files here.

### Update Your Resume:
1. Regenerate `data/cv.json` from the approved `cv.md` with `node <career-ops>/export-cv.mjs --out data/cv.json` (full export, no `--public`), and copy the approved `resume.pdf` and `resume.tex` into `static/assets/`.
2. Run `npm run build:resume:web` to regenerate `static/assets/resume.html`, `static/assets/resume-ats.txt` and the served `static/data/cv.json` (which drops contacts marked `public: false`).
3. Mirror the title, experience bullets and skills in `config/personal.go` — the home page Dossier and Experience sections render from it, not from the export.
4. Commit the regenerated artifacts — they are what the server ships.

### Resume URLs:
- **Resume page**: `/resume` (iframes the PDF)
- **PDF, inline**: `/resume/pdf`
- **PDF, download**: `/resume/download`
- **Generated HTML**: `/resume/html`
- **LaTeX source**: `/static/assets/resume.tex`

### Build Process:
The committed `resume.pdf` and `resume.html` are authoritative and served as-is; the server never rebuilds them over a newer `resume.tex`. `npm run build:resume` (LaTeX) only matters when `resume.pdf` is missing entirely, and it no longer produces HTML. See [AGENTS.md](AGENTS.md) for the invariant and the regression test that locks it down.

### LaTeX Alternatives:
If you don't want to install LaTeX locally, you can:
- Use [Overleaf](https://www.overleaf.com/) to compile the `.tex` online
- Use [LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop) in VS Code
- Manually compile and place the PDF at `static/assets/resume.pdf`

## Customization

### Personal Information:
Edit `config/personal.go` to update:
- Contact details
- Bio and summary
- Skills and technologies
- Work experience
- Education
- Interests

### Projects:
Update `LoadProjects()` in `projects.go`. Reuse supported project facts; do not infer individual ownership or outcomes for team projects.

### Styling:
- Main styles: `src/styles/main.css`
- Tailwind config: `tailwind.config.js`
- Colors and themes can be customized in the Tailwind config

### Templates:
Go HTML templates live in `templates/`; `base.html` is the shared document shell.

## Deployment

### Heroku Deployment (Recommended):
See `DEPLOYMENT.md` for detailed Heroku deployment instructions using your student account.

Quick setup:
```bash
heroku create your-portfolio-name
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/go
git push heroku main
```

### Docker Deployment:
```bash
# Build Docker image
docker build -t david-portfolio .

# Run container
docker run -p 8080:8080 david-portfolio
```

### Environment Variables:
- `PORT`: Server port (default: 8080)

## Project Structure

```
Personal_Portfolio/
├── config/
│   └── personal.go          # Your personal information
├── static/
│   ├── assets/
│   │   ├── resume.tex       # LaTeX source, copied from career-ops
│   │   └── resume.pdf       # Approved PDF, served as-is
│   ├── css/
│   │   └── main.css         # Compiled CSS
│   └── js/
│       └── main.js          # Compiled JavaScript
├── src/                     # TypeScript source
│   ├── components/          # TypeScript components
│   ├── styles/              # CSS source
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── scripts/                 # Build scripts
├── templates/               # Server-rendered HTML templates
├── main.go                  # Go web server
├── go.mod                   # Go dependencies
├── package.json             # Node.js dependencies
└── README.md                # This file
```

## Available Scripts

- `npm run build` - Build TypeScript and CSS (resume compilation is separate)
- `npm run dev` - Development mode with auto-reload
- `npm run build:ts` - Build TypeScript only
- `npm run build:css` - Build CSS only
- `npm run build:resume` - Build resume PDF from LaTeX (only needed if the PDF is missing)
- `npm run build:resume:web` - Regenerate resume HTML, ATS text and served cv.json from `data/cv.json`
- `npm run type-check` - TypeScript type checking

## Contact

- **Email**: dxiao3043@gmail.com
- **LinkedIn**: [david-on-linked](https://linkedin.com/in/david-on-linked)
- **GitHub**: [daveonthegit](https://github.com/daveonthegit)
