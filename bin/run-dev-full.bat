@echo off
REM ConflixIQ Studio - Full Stack Development Server Launcher for Windows
REM This batch file starts both frontend and backend servers

echo.
echo ====================================
echo ConflixIQ Studio - Full Stack Dev
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

echo Starting ConflixIQ Studio (Full Stack - Frontend + Backend)...
echo.
echo Frontend will be available at: http://localhost:5173/
echo Backend GraphQL server will run in the background
echo Press Ctrl+C to stop the servers
echo.

call npm run dev:full

pause
