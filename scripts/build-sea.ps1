#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Conductor Designer - Node.js SEA (Single Executable Application) Builder
    PowerShell version for Windows platforms

.DESCRIPTION
    Builds portable Windows EXE and Docker images using Node.js SEA
    
.PARAMETER Target
    Build target: 'all', 'windows', or 'docker'
    
.PARAMETER IncludeUI
    Include web UI in build (default: $true)
    
.PARAMETER NoCompress
    Disable compression in build process
    
.EXAMPLE
    .\build-sea.ps1 -Target all
    .\build-sea.ps1 -Target windows
    .\build-sea.ps1 -Target docker -IncludeUI $false
#>

param(
    [ValidateSet('all', 'windows', 'docker')]
    [string]$Target = 'all',
    
    [bool]$IncludeUI = $true,
    
    [switch]$NoCompress
)

$ErrorActionPreference = 'Stop'

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('Info', 'Success', 'Warning', 'Error')]
        [string]$Level = 'Info'
    )
    
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $prefix = switch ($Level) {
        'Info' { '[SEA Build]' }
        'Success' { '[SEA ✓]' }
        'Warning' { '[SEA ⚠]' }
        'Error' { '[SEA ✗]' }
    }
    
    $color = switch ($Level) {
        'Info' { 'Cyan' }
        'Success' { 'Green' }
        'Warning' { 'Yellow' }
        'Error' { 'Red' }
    }
    
    Write-Host "$timestamp $prefix $Message" -ForegroundColor $color
}

function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Log "Node.js version: $nodeVersion" 'Success'
    }
    catch {
        Write-Log "Node.js is not installed or not in PATH" 'Error'
        Write-Log "Install from: https://nodejs.org/" 'Warning'
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Log "NPM version: $npmVersion" 'Success'
    }
    catch {
        Write-Log "npm is not installed or not in PATH" 'Error'
        exit 1
    }
    
    # Check Docker (optional)
    try {
        $dockerVersion = docker --version
        Write-Log "Docker found: $dockerVersion" 'Success'
    }
    catch {
        if ($Target -in @('docker', 'all')) {
            Write-Log "Docker not found (Docker build will be limited)" 'Warning'
        }
    }
}

function Install-Dependencies {
    if (-not (Test-Path 'node_modules' -PathType Container)) {
        Write-Log "Installing dependencies..."
        npm install
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Failed to install dependencies" 'Error'
            exit 1
        }
        
        Write-Log "Dependencies installed successfully" 'Success'
    }
    else {
        Write-Log "Dependencies already installed" 'Info'
    }
}

function Invoke-WebUIBuild {
    Write-Log "Building web application..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Web build failed" 'Error'
        exit 1
    }
    
    Write-Log "Web build completed successfully" 'Success'
}

function Start-SEABuild {
    Write-Log "Starting Node.js SEA build process..."
    Write-Log "Build target: $Target" 'Info'
    Write-Log "Include UI: $IncludeUI" 'Info'
    
    $buildArgs = @($Target)
    if (-not $IncludeUI) { $buildArgs += '--no-ui' }
    if ($NoCompress) { $buildArgs += '--no-compress' }
    
    Write-Log "Running: tsx scripts/sea-builder.ts $($buildArgs -join ' ')" 'Info'
    tsx scripts/sea-builder.ts @buildArgs
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "SEA build failed" 'Error'
        exit 1
    }
}

function Show-BuildResults {
    Write-Log ""
    Write-Log "╔════════════════════════════════════════════╗"
    Write-Log "║   SEA BUILD COMPLETED SUCCESSFULLY        ║"
    Write-Log "╚════════════════════════════════════════════╝" 'Success'
    
    # Find latest build
    $buildDirs = Get-ChildItem 'dist' -Filter 'sea-build-*' -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    if ($buildDirs) {
        $buildDir = $buildDirs.FullName
        Write-Log "Output directory: $buildDir" 'Success'
        
        # List artifacts
        Write-Log ""
        Write-Log "Artifacts created:" 'Info'
        
        Get-ChildItem $buildDir -File | ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Log "  - $($_.Name) ($size MB)" 'Success'
        }
        
        # Display build report
        $reportFile = Join-Path $buildDir 'BUILD-REPORT.md'
        if (Test-Path $reportFile) {
            Write-Log ""
            Write-Log "Build Report:" 'Info'
            Get-Content $reportFile | Select-Object -First 30 | ForEach-Object { Write-Log "  $_" }
        }
    }
}

function Main {
    Clear-Host
    
    Write-Log ""
    Write-Log "╔════════════════════════════════════════════╗"
    Write-Log "║  Conductor Designer - Node.js SEA Build   ║"
    Write-Log "║    Creates portable EXE & Docker images   ║"
    Write-Log "╚════════════════════════════════════════════╝" 'Info'
    Write-Log ""
    
    # Run build pipeline
    Test-Prerequisites
    Write-Log ""
    
    Install-Dependencies
    Write-Log ""
    
    Invoke-WebUIBuild
    Write-Log ""
    
    Start-SEABuild
    Write-Log ""
    
    Show-BuildResults
    
    Write-Log ""
    Write-Log "Next steps:" 'Info'
    Write-Log "  1. Check dist/sea-build-*/BUILD-REPORT.md for details" 'Info'
    Write-Log "  2. Test the Windows EXE or Docker image" 'Info'
    Write-Log "  3. Distribute to users" 'Info'
    Write-Log ""
}

# Execute main function
Main
