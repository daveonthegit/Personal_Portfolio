@echo off
REM Build script for LaTeX resume on Windows
REM This script compiles the resume.tex file to PDF

setlocal enabledelayedexpansion

set "RESUME_DIR=static\assets"
set "RESUME_TEX=%RESUME_DIR%\resume.tex"
set "RESUME_PDF=%RESUME_DIR%\resume.pdf"

REM Check if pdflatex is available
where pdflatex >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: pdflatex not found. Please install a LaTeX distribution
    echo Download MiKTeX from https://miktex.org/
    exit /b 1
)

echo Building resume from LaTeX...

REM Create output directory if it doesn't exist
if not exist "%RESUME_DIR%" mkdir "%RESUME_DIR%"

REM Compile LaTeX to PDF
cd "%RESUME_DIR%"
pdflatex -interaction=nonstopmode resume.tex >nul 2>&1

REM Clean up auxiliary files
if exist "*.aux" del "*.aux"
if exist "*.log" del "*.log"
if exist "*.out" del "*.out"
if exist "*.fdb_latexmk" del "*.fdb_latexmk"
if exist "*.fls" del "*.fls"
if exist "*.synctex.gz" del "*.synctex.gz"

if exist "resume.pdf" (
    echo ✅ Resume successfully built: %RESUME_PDF%
) else (
    echo ❌ Failed to build resume PDF
    exit /b 1
)

echo Resume build complete!
