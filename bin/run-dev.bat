@echo off
REM ConflixIQ Studio - Development Server Launcher for Windows
REM This batch file starts the development frontend server

echo.
echo ====================================
echo ConflixIQ Studio - Development
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

echo Starting ConflixIQ Studio development server...
echo.
echo The application will be available at: http://localhost:5173/
echo Press Ctrl+C to stop the server
echo.

call npm run dev:frontend

pause
