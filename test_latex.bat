@echo off
echo Testing LaTeX compilation...
cd static\assets
echo Current directory: %CD%
echo.
echo Running pdflatex...
pdflatex -interaction=nonstopmode resume.tex
echo.
echo Exit code: %errorlevel%
echo.
echo Files in directory:
dir *.pdf
dir *.log
echo.
echo Log file contents:
type resume.log
