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

function Create-ReleaseArtifacts {
    Write-Log "Creating release artifacts..."
    
    # Find latest build directory
    $buildDirs = Get-ChildItem 'dist' -Filter 'sea-build-*' -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    if (-not $buildDirs) {
        Write-Log "No build directory found" 'Error'
        return
    }
    
    $buildDir = $buildDirs.FullName
    $releaseDir = Join-Path 'dist' 'release'
    
    # Create release directory
    if (-not (Test-Path $releaseDir)) {
        New-Item -ItemType Directory -Path $releaseDir | Out-Null
    }
    
    # Check for Windows EXE
    $exeFile = Get-ChildItem $buildDir -Filter '*.exe' | Select-Object -First 1
    if ($exeFile) {
        $exeName = "conflixiq-studio-x64-$((Get-Date).ToString('yyyyMMdd')).exe"
        $exePath = Join-Path $releaseDir $exeName
        Copy-Item $exeFile.FullName -Destination $exePath
        Write-Log "Windows EXE created: $exePath" 'Success'
    }
    
    # Create Docker image TAR
    Write-Log "Creating Docker image TAR file..."
    $dockerTarName = "conflixiq-studio-docker-$((Get-Date).ToString('yyyyMMdd')).tar"
    $dockerTarPath = Join-Path $releaseDir $dockerTarName
    
    # Create Dockerfile if it exists in build dir
    $dockerfile = Get-ChildItem $buildDir -Filter 'Dockerfile' | Select-Object -First 1
    if ($dockerfile) {
        # Create a temporary directory for Docker build context
        $dockerContext = Join-Path $buildDir 'docker-context'
        if (-not (Test-Path $dockerContext)) {
            New-Item -ItemType Directory -Path $dockerContext | Out-Null
        }
        
        # Copy Dockerfile
        Copy-Item $dockerfile.FullName -Destination (Join-Path $dockerContext 'Dockerfile')
        
        # Copy necessary files
        $filesToCopy = @('package.json', 'index.js', 'schema.js', 'resolvers.js', 'server-logger.js', 'fileStoreServer.js')
        foreach ($file in $filesToCopy) {
            $srcFile = Get-ChildItem $buildDir -Filter $file | Select-Object -First 1
            if ($srcFile) {
                Copy-Item $srcFile.FullName -Destination (Join-Path $dockerContext $file)
            }
        }
        
        # Copy dist folder if exists
        $distFolder = Get-ChildItem $buildDir -Filter 'dist' -Directory | Select-Object -First 1
        if ($distFolder) {
            Copy-Item $distFolder.FullName -Destination (Join-Path $dockerContext 'dist') -Recurse
        }
        
        Write-Log "Building Docker image..." 'Info'
        
        # Build Docker image
        $imageName = "conflixiq-studio:latest"
        docker build -t $imageName $dockerContext
        
        if ($LASTEXITCODE -eq 0) {
            # Save Docker image to TAR
            Write-Log "Saving Docker image to TAR..." 'Info'
            docker save -o $dockerTarPath $imageName
            
            if (Test-Path $dockerTarPath) {
                $tarSize = [math]::Round((Get-Item $dockerTarPath).Length / 1GB, 2)
                Write-Log "Docker TAR created: $dockerTarPath ($tarSize GB)" 'Success'
            }
        }
        else {
            Write-Log "Docker build failed - TAR will not be created" 'Warning'
        }
        
        # Cleanup
        Remove-Item $dockerContext -Recurse -Force -ErrorAction SilentlyContinue
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
        Write-Log "Build artifacts:" 'Info'
        
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
    
    # Show release artifacts
    $releaseDir = Join-Path 'dist' 'release'
    if (Test-Path $releaseDir) {
        Write-Log ""
        Write-Log "Release artifacts:" 'Success'
        Get-ChildItem $releaseDir -File | ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Log "  - $($_.Name) ($size MB)" 'Success'
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
    
    Create-ReleaseArtifacts
    Write-Log ""
    
    Show-BuildResults
    
    Write-Log ""
    Write-Log "Next steps:" 'Info'
    Write-Log "  1. Check dist/release/ for Windows EXE and Docker TAR" 'Info'
    Write-Log "  2. Test the Windows EXE on a 64-bit system" 'Info'
    Write-Log "  3. Import Docker TAR: docker load < conflixiq-studio-docker-*.tar" 'Info'
    Write-Log "  4. Run Docker: docker run -p 8080:8080 conflixiq-studio:latest" 'Info'
    Write-Log ""
}

# Execute main function
Main
