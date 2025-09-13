@echo off
echo Building Minesweeper TypeScript...

REM Check if tsc is available
where tsc >nul 2>nul
if %errorlevel% neq 0 (
    echo TypeScript compiler not found. Installing locally...
    npm init -y
    npm install typescript --save-dev
    npx tsc
) else (
    tsc
)

if %errorlevel% equ 0 (
    echo Build successful! Generated minesweeper.js
) else (
    echo Build failed!
    pause
)
