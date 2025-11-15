# Conductor Designer - Quick Start Script for PowerShell
# Run this script to set up and start the development environment

param(
    [ValidateSet("dev", "dev-full", "build", "install")]
    [string]$Command = "dev"
)

function Write-Header {
    param([string]$Text)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Test-NodeInstalled {
    try {
        $nodeVersion = node --version
        Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ Node.js is not installed or not in PATH" -ForegroundColor Red
        Write-Host "Please install from: https://nodejs.org/" -ForegroundColor Yellow
        return $false
    }
}

function Install-Dependencies {
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
            exit 1
        }
        Write-Host "✓ Dependencies installed" -ForegroundColor Green
    }
    else {
        Write-Host "✓ Dependencies already installed" -ForegroundColor Green
    }
}

function Start-Dev {
    Write-Header "Conductor Designer - Development Server"
    Write-Host "Frontend URL: http://localhost:5173/" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Yellow
    npm run dev:frontend
}

function Start-DevFull {
    Write-Header "Conductor Designer - Full Stack Development"
    Write-Host "Frontend URL: http://localhost:5173/" -ForegroundColor Cyan
    Write-Host "Backend GraphQL: Running" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the servers`n" -ForegroundColor Yellow
    npm run dev:full
}

function Invoke-Production {
    Write-Header "Conductor Designer - Production Build"
    Write-Host "Building for production..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Build completed successfully!" -ForegroundColor Green
        Write-Host "Output directory: dist/" -ForegroundColor Cyan
    }
    else {
        Write-Host "`n✗ Build failed!" -ForegroundColor Red
        exit 1
    }
}

# Main execution
Write-Header "Conductor Designer - Setup"

if (-not (Test-NodeInstalled)) {
    exit 1
}

# Always ensure dependencies are installed
Install-Dependencies

# Execute requested command
switch ($Command) {
    "dev" {
        Start-Dev
    }
    "dev-full" {
        Start-DevFull
    }
    "build" {
        Invoke-Production
    }
    "install" {
        Write-Host "Dependencies installation complete" -ForegroundColor Green
    }
    default {
        Start-Dev
    }
}
