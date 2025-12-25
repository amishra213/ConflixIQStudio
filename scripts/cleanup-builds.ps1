#!/usr/bin/env powershell

<#
.SYNOPSIS
Clean up build artifacts and optimize folder structure

.DESCRIPTION
This script removes temporary build folders and outdated artifacts,
keeping only the latest SEA build and final release artifacts.

.NOTES
Run this before major rebuilds to free up disk space (~500MB+)
#>

param(
    [switch]$Full,              # Full cleanup including all old builds
    [switch]$Interactive        # Ask before deleting (default: $true)
)

function Write-Status {
    param([string]$Message, [string]$Color = "Green")
    Write-Host "[CLEANUP] " -ForegroundColor Cyan -NoNewline
    Write-Host $Message -ForegroundColor $Color
}

# Cleanup paths
$cleanupPaths = @(
    @{ Path = ".\.build"; Description = "Temporary SEA build cache" },
    @{ Path = ".\distribution"; Description = "Old React build output"; Old = $true },
    @{ Path = ".\dist\sea-build-*\temp-zip-content"; Description = "Temporary zip staging files" }
)

$totalFreed = 0

foreach ($item in $cleanupPaths) {
    $path = $item.Path
    
    if ($item.Path -like "*\*-*") {
        # Handle wildcard paths
        $items = @(Get-ChildItem -Path $path -Directory -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
        
        if ($items.Count -gt 1 -and $Full) {
            # Keep newest, remove others
            [void]$items[0]  # Reference newest item (kept for clarity)
            $remove = $items[1..($items.Count-1)]
            
            foreach ($old in $remove) {
                Write-Status "Removing old: $($old.FullName)" "Yellow"
                $size = (Get-ChildItem -Path $old.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
                Remove-Item -Path $old.FullName -Recurse -Force -ErrorAction SilentlyContinue
                $totalFreed += $size
                Write-Status "  Freed: $([math]::Round($size/1MB, 2)) MB" "Green"
            }
        }
    } else {
        if (Test-Path $path) {
            $size = (Get-ChildItem -Path $path -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
            
            if ($Interactive -and -not $item.Old) {
                $response = Read-Host "Remove $($item.Description) at $path ? (y/n)"
                if ($response -ne 'y') { continue }
            }
            
            Write-Status "Removing: $path - $($item.Description)" "Yellow"
            Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
            $totalFreed += $size
            Write-Status "  Freed: $([math]::Round($size/1MB, 2)) MB" "Green"
        }
    }
}

Write-Status ""
Write-Status "Cleanup Complete!" "Cyan"
Write-Status "Total space freed: $([math]::Round($totalFreed/1MB, 2)) MB"
Write-Status ""
Write-Status "Current folder sizes:"

$folders = @(
    "node_modules",
    "dist",
    ".build",
    "distribution"
)

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        $size = (Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        Write-Status "  $folder`: $([math]::Round($size/1MB, 2)) MB"
    }
}
