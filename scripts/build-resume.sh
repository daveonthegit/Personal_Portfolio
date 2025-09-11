#!/bin/bash

# Build script for LaTeX resume
# This script compiles the resume.tex file to PDF and optionally to HTML

set -e

RESUME_DIR="static/assets"
RESUME_TEX="$RESUME_DIR/resume.tex"
RESUME_PDF="$RESUME_DIR/resume.pdf"

# Check if pdflatex is available
if ! command -v pdflatex &> /dev/null; then
    echo "Error: pdflatex not found. Please install a LaTeX distribution (e.g., TeX Live, MiKTeX)"
    echo "On Windows: Install MiKTeX from https://miktex.org/"
    echo "On macOS: brew install --cask mactex"
    echo "On Ubuntu/Debian: sudo apt-get install texlive-full"
    exit 1
fi

echo "Building resume from LaTeX..."

# Create output directory if it doesn't exist
mkdir -p "$RESUME_DIR"

# Compile LaTeX to PDF
cd "$RESUME_DIR"
pdflatex -interaction=nonstopmode resume.tex > /dev/null 2>&1

# Clean up auxiliary files
rm -f *.aux *.log *.out *.fdb_latexmk *.fls *.synctex.gz

if [ -f "resume.pdf" ]; then
    echo "✅ Resume successfully built: $RESUME_PDF"
else
    echo "❌ Failed to build resume PDF"
    exit 1
fi

# Optional: Convert to HTML using pandoc if available
if command -v pandoc &> /dev/null; then
    echo "Converting to HTML..."
    pandoc resume.tex -o resume.html --standalone --css=resume.css
    echo "✅ HTML version created: $RESUME_DIR/resume.html"
fi

echo "Resume build complete!"
