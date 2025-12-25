@echo off
REM ConflixIQ Studio - Node.js SEA Docker Image Builder
REM Creates portable Docker images using Node.js SEA

echo.
echo ====================================
echo ConflixIQ Studio - SEA Docker Build
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

REM Check if Docker is installed (optional but recommended)
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Docker is not installed or not in PATH
    echo Some Docker features will be skipped
    echo Install Docker from: https://www.docker.com/
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
echo Building Docker images with Node.js SEA...
echo.

REM Build Docker target only
call tsx scripts/sea-builder.ts docker

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo Docker build completed successfully!
    echo ====================================
    echo.
    echo Output directory: dist\sea-build-*\
    echo.
    echo The following files have been created:
    for /d %%d in (dist\sea-build-*) do (
        echo   Location: %%d
        for /f %%f in ('dir /b %%d\*.jar 2^>nul') do (
            echo     - %%f (Docker JAR)
        )
        for /f %%f in ('dir /b %%d\*.tar 2^>nul') do (
            echo     - %%f (Docker TAR)
        )
    )
    echo.
    echo Usage:
    echo   1. Load the Docker image:
    echo      docker load -i conflixiq-studio-portable.tar
    echo.
    echo   2. Run the container:
    echo      docker run -d -p 4000:4000 conflixiq-studio:latest
    echo.
    echo   3. Access the application:
    echo      http://localhost:4000
    echo.
) else (
    echo.
    echo ====================================
    echo Docker build failed!
    echo ====================================
    echo.
    pause
    exit /b 1
)

pause
