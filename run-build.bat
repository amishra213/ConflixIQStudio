@echo off
REM Conductor Designer - Production Build Launcher for Windows
REM This batch file builds the application for production

echo.
echo ====================================
echo Conductor Designer - Production Build
echo ====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Building Conductor Designer for production...
echo.

call npm run build

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo Build completed successfully!
    echo ====================================
    echo.
    echo Output directory: dist\
    echo.
) else (
    echo.
    echo ====================================
    echo Build failed!
    echo ====================================
    echo.
)

pause
