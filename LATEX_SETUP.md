# LaTeX Setup for Resume Generation

## Recommended LaTeX Distributions (in order of preference):

### 1. **Tectonic** (Recommended - No Installation Required)
- **Download**: https://tectonic-typesetting.github.io/
- **Why**: Self-contained, modern, no complex installation
- **Install**: Just download the executable and add to PATH

### 2. **MiKTeX** (Windows Native)
- **Download**: https://miktex.org/download
- **Why**: Windows-optimized, automatic package management
- **Install**: Download installer, run as administrator

### 3. **TeX Live** (Cross-platform)
- **Download**: https://www.tug.org/texlive/
- **Why**: Most complete, cross-platform
- **Install**: Download installer, full installation

## Quick Setup (Tectonic - Recommended):

1. Download Tectonic from https://tectonic-typesetting.github.io/
2. Extract to `C:\tectonic\`
3. Add `C:\tectonic\` to your PATH environment variable
4. Restart your terminal/command prompt
5. Test with: `tectonic --version`

## Alternative: Use Existing Build Script

If you prefer not to install LaTeX, you can use the existing build script:

```bash
# Run the build script manually
scripts\build-resume.bat
```

This will create `static/assets/resume.pdf` which the server can then serve.

## Testing LaTeX Installation:

```bash
# Test if LaTeX is working
cd static\assets
pdflatex --version
# or
lualatex --version
# or
xelatex --version
# or
latexmk --version
```

## Troubleshooting:

- **"Command not found"**: LaTeX not in PATH
- **"Permission denied"**: Run as administrator
- **"Package not found"**: Install missing packages or use MiKTeX (auto-installs packages)
