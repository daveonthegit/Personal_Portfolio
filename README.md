# David Xiao - Personal Portfolio

A modern personal portfolio built with **Go** backend and **TypeScript** frontend, featuring LaTeX resume integration.

## 🚀 Features

- **Go Web Server** with clean routing and template rendering
- **TypeScript Frontend** with modern build system (esbuild + Tailwind CSS)
- **LaTeX Resume Integration** - Edit `static/assets/resume.tex` and auto-build to PDF
- **Responsive Design** with dark/light theme support
- **Interactive Components**: Contact form, project filtering, smooth animations
- **Resume Serving**: Multiple formats (HTML, PDF, LaTeX source)

## 🛠️ Tech Stack

**Backend:**
- Go 1.21+ with Gorilla Mux
- HTML templates
- Static file serving

**Frontend:**
- TypeScript with esbuild
- Tailwind CSS with PostCSS
- Alpine.js for interactivity

**Resume System:**
- LaTeX source editing
- Automated PDF generation
- Multiple format serving

## 📋 Prerequisites

1. **Go 1.21+** - [Download here](https://golang.org/dl/)
2. **Node.js 18+** - [Download here](https://nodejs.org/)
3. **LaTeX Distribution** (optional, for resume PDF generation):
   - **Windows**: [MiKTeX](https://miktex.org/)
   - **macOS**: `brew install --cask mactex`
   - **Linux**: `sudo apt-get install texlive-full`
   
   **Note**: The portfolio works without LaTeX. You can manually compile your resume or use online LaTeX editors.

## 🚀 Quick Start

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
   go run main.go
   ```

5. **Visit your portfolio:**
   Open http://localhost:8080

## 📝 Development Workflow

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

# Build resume PDF only
npm run build:resume
```

## 📄 Resume Management

Your resume is managed via LaTeX for professional typesetting:

### Edit Your Resume:
1. Open `static/assets/resume.tex`
2. Update your information
3. Run `npm run build:resume` to generate PDF

### Resume URLs:
- **HTML Resume Page**: `/resume`
- **PDF Download**: `/resume/pdf` 
- **LaTeX Source**: `/resume/tex`

### Resume Build Process:
The build system automatically:
1. Compiles `resume.tex` to `resume.pdf` using pdflatex
2. Cleans up auxiliary files
3. Makes both formats available via web routes

### LaTeX Alternatives:
If you don't want to install LaTeX locally, you can:
- Use [Overleaf](https://www.overleaf.com/) to compile your resume online
- Use [LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop) in VS Code
- Manually compile and place the PDF in `static/assets/resume.pdf`

## 🎨 Customization

### Personal Information:
Edit `config/personal.go` to update:
- Contact details
- Bio and summary
- Skills and technologies
- Work experience
- Education
- Interests

### Projects:
Update the `loadProjects()` function in `main.go` or create a separate data file.

### Styling:
- Main styles: `src/styles/main.css`
- Tailwind config: `tailwind.config.js`
- Colors and themes can be customized in the Tailwind config

### Templates:
HTML templates will be in `templates/` directory (to be created).

## 🌐 Deployment

### Docker Deployment:
```bash
# Build Docker image
docker build -t david-portfolio .

# Run container
docker run -p 8080:8080 david-portfolio
```

### Environment Variables:
- `PORT`: Server port (default: 8080)

## 📁 Project Structure

```
Personal_Portfolio/
├── config/
│   └── personal.go          # Your personal information
├── static/
│   ├── assets/
│   │   ├── resume.tex       # Your LaTeX resume (edit this!)
│   │   └── resume.pdf       # Generated PDF
│   ├── css/
│   │   └── main.css         # Compiled CSS
│   └── js/
│       └── main.js          # Compiled JavaScript
├── src/                     # TypeScript source
│   ├── components/          # Alpine.js components
│   ├── styles/              # CSS source
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── scripts/                 # Build scripts
├── templates/               # HTML templates (to be created)
├── main.go                  # Go web server
├── go.mod                   # Go dependencies
├── package.json             # Node.js dependencies
└── README.md                # This file
```

## 🔧 Available Scripts

- `npm run build` - Build everything (TS, CSS, Resume)
- `npm run dev` - Development mode with auto-reload
- `npm run build:ts` - Build TypeScript only
- `npm run build:css` - Build CSS only
- `npm run build:resume` - Build resume PDF only
- `npm run type-check` - TypeScript type checking

## 🎯 Next Steps

1. **Customize Personal Info**: Update `config/personal.go`
2. **Edit Resume**: Modify `static/assets/resume.tex`
3. **Create Templates**: Add HTML templates in `templates/`
4. **Add Images**: Place project images in `static/images/`
5. **Deploy**: Set up hosting (Vercel, Netlify, Docker, etc.)

## 📞 Contact

- **Email**: dxiao3043@gmail.com
- **LinkedIn**: [david-on-linked](https://linkedin.com/in/david-on-linked)
- **GitHub**: [daveonthegit](https://github.com/daveonthegit)

---

Built with ❤️ using Go, TypeScript, and LaTeX
