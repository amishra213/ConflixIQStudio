@echo off
REM ConflixIQ Studio - Node.js SEA Windows EXE Builder
REM Creates portable Windows executable

echo.
echo ====================================
echo ConflixIQ Studio - SEA Windows EXE
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
echo Building Windows EXE with Node.js SEA...
echo.

REM Build Windows target only
call tsx scripts/sea-builder.ts windows

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo Windows EXE build completed successfully!
    echo ====================================
    echo.
    echo Output directory: dist\sea-build-*\
    echo.
    echo The following files have been created:
    for /d %%d in (dist\sea-build-*) do (
        echo   Location: %%d
        for /f %%f in ('dir /b %%d\*.exe 2^>nul') do (
            echo     - %%f
        )
        for /f %%f in ('dir /b %%d\*.zip 2^>nul') do (
            echo     - %%f
        )
    )
    echo.
    echo Benefits:
    echo   - 40-50%% smaller than Electron builds
    echo   - No external runtime dependencies
    echo   - Direct Node.js execution
    echo   - Fully portable
    echo.
) else (
    echo.
    echo ====================================
    echo Windows EXE build failed!
    echo ====================================
    echo.
    pause
    exit /b 1
)

pause
