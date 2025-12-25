@echo off
REM ConflixIQ Studio - Production Build Launcher for Windows
REM This batch file builds the application for production deployment

echo.
echo ====================================
echo ConflixIQ Studio - Production Build
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

REM Create local temp directory to avoid AppData path issues
setlocal enabledelayedexpansion
set "LOCAL_TEMP_DIR=%cd%\.build-temp"
if not exist "%LOCAL_TEMP_DIR%" (
    mkdir "%LOCAL_TEMP_DIR%"
    echo Created local temp directory: %LOCAL_TEMP_DIR%
)

REM Set environment variables to use local temp instead of AppData
set "TEMP=%LOCAL_TEMP_DIR%"
set "TMP=%LOCAL_TEMP_DIR%"
set "USERPROFILE=%LOCAL_TEMP_DIR%"
set "ELECTRON_CACHE=%LOCAL_TEMP_DIR%\electron-cache"
set "ELECTRON_BUILDER_CACHE=%LOCAL_TEMP_DIR%\electron-builder-cache"
set "npm_config_cache=%LOCAL_TEMP_DIR%\npm-cache"
REM Disable all code signing to avoid symbolic link privilege errors and winCodeSign downloads
set "CSC_LINK="
set "WIN_CSC_LINK="
set "SKIP_NOTARIZATION=true"
set "ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true"
set "DISABLE_CODE_SIGNING=true"
set "NO_CODE_SIGNING=true"

echo Building ConflixIQ Studio for production...
echo Using local temp directory: %LOCAL_TEMP_DIR%
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

REM Cleanup temp directory
if exist "%LOCAL_TEMP_DIR%" (
    echo Cleaning up local temp directory...
    rmdir /s /q "%LOCAL_TEMP_DIR%"
)

endlocal
pause
