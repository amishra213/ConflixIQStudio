@echo off
REM ConflixIQ Studio - Node.js SEA (Single Executable Application) Builder
REM Creates portable Windows EXE and Docker images

echo.
echo ====================================
echo ConflixIQ Studio - SEA Build
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

REM Build the web application first
echo Building web application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Web build failed
    pause
    exit /b 1
)

echo.
echo ====================================
echo Starting Node.js SEA Build
echo ====================================
echo.

REM Build all targets (Windows EXE and Docker)
echo Running SEA builder for all targets...
call tsx scripts/sea-builder.ts all

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo SEA build completed successfully!
    echo ====================================
    echo.
    echo Output directory: dist\sea-build-*\
    echo.
    echo Artifacts created:
    echo   - conflixiq-studio.exe (Windows EXE)
    echo   - conflixiq-studio-portable.jar (Docker JAR)
    echo   - conflixiq-studio-portable.tar (Docker TAR)
    echo   - BUILD-REPORT.md (Build details)
    echo.
) else (
    echo.
    echo ====================================
    echo SEA build failed!
    echo ====================================
    echo.
    pause
    exit /b 1
)

echo Build details available in dist\sea-build-*\BUILD-REPORT.md
echo.
pause
