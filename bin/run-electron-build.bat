@echo off
REM Conductor Designer - Windows Electron Build Launcher
REM Builds the Windows EXE executable using Electron Builder
REM Uses local temp directory to avoid AppData path issues

echo.
echo ====================================
echo Conductor Designer - Electron Build
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
set "APPDATA=%LOCAL_TEMP_DIR%\appdata"
set "LOCALAPPDATA=%LOCAL_TEMP_DIR%\localappdata"
REM Disable all code signing to avoid symbolic link privilege errors and winCodeSign downloads
set "CSC_LINK="
set "WIN_CSC_LINK="
set "SKIP_NOTARIZATION=true"
set "ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true"
set "DISABLE_CODE_SIGNING=true"
set "NO_CODE_SIGNING=true"
REM Force disable code signing in electron-builder
set "SKIP_CODESIGNTOOL=true"

echo.
echo Building Windows executable with Electron Builder...
echo Using local temp directory: %LOCAL_TEMP_DIR%
echo.

call npm run electron-build

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo Windows build completed successfully!
    echo ====================================
    echo.
    echo Creating ZIP archive...
    powershell -Command "Compress-Archive -Path 'dist\Conductor Designer-1.0.0-portable.exe' -DestinationPath 'dist\Conductor Designer-1.0.0.zip' -Force"
    echo ZIP created successfully!
    echo.
    echo Output directory: dist\
    echo.
    echo Artifacts:
    for /f %%f in ('dir /b dist\*.exe 2^>nul') do (
        echo   - %%f
    )
    for /f %%f in ('dir /b dist\*.zip 2^>nul') do (
        echo   - %%f
    )
    echo.
) else (
    echo.
    echo ====================================
    echo Windows build failed!
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
