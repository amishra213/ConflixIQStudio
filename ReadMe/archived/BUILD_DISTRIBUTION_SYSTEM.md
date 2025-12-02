# Comprehensive Distribution Build System

This document describes the automated build system that creates all distribution packages (Web, Windows EXE, Docker) in a single comprehensive distribution folder with auto-incrementing Build IDs.

## Overview

The build system automatically:

1. **Increments Build ID** - Each build gets a unique ID (1001, 1002, etc.)
2. **Builds all packages** - Web app, Windows EXE, Docker images
3. **Organizes artifacts** - Everything in `distribution/builds/` folder
4. **Creates summaries** - Build metadata and summary files
5. **Generates metadata** - Tracks all artifacts and build history

## Quick Start

### Build All Distributions Locally

```bash
npm run dist:build-all
```

This command:

- Increments the build ID automatically
- Builds the web application
- Creates Windows EXE installers
- Builds and exports Docker images
- Organizes everything in `distribution/builds/`
- Generates build summary and metadata files

### Check Current Build ID

```bash
cat .build-metadata.json
```

### Output Structure

```
distribution/
├── README.md                          # Distribution guide
└── builds/
    ├── BUILD-1001-SUMMARY.md         # First build summary
    ├── BUILD-1002-SUMMARY.md         # Second build summary
    ├── web/                          # Web app files
    │   ├── index.html
    │   ├── assets/
    │   └── ...
    ├── windows/                      # Windows installers
    │   ├── Conductor Designer Setup 1.0.0.exe
    │   └── Conductor Designer-1.0.0-portable.exe
    └── docker/                       # Docker images
        ├── conductor-designer.tar       # Full uncompressed (~600MB)
        └── conductor-designer.tar.gz    # Compressed (~150MB)
```

## Build ID System

### Auto-Incrementing

- Starts at: `1000`
- Increments on each build: 1001, 1002, 1003, etc.
- Stored in: `.build-metadata.json`
- Metadata auto-committed to git (on pushes)

### Metadata File (.build-metadata.json)

```json
{
  "buildId": 1002,
  "lastBuildDate": "2025-11-29T12:34:56.789Z",
  "version": "1.0.0",
  "artifacts": {
    "web": ["distribution/builds/web"],
    "windows": [
      "distribution/builds/windows/Conductor Designer Setup 1.0.0.exe",
      "distribution/builds/windows/Conductor Designer-1.0.0-portable.exe"
    ],
    "docker": [
      "distribution/builds/docker/conductor-designer.tar",
      "distribution/builds/docker/conductor-designer.tar.gz"
    ]
  }
}
```

## Distribution Packages

### 1. Web Application

**Location**: `distribution/builds/web/`

Complete static web application files:

- HTML/CSS/JavaScript bundles
- Assets and images
- Ready to serve with any HTTP server

**Usage**:

```bash
# Serve locally
cd distribution/builds/web
npx http-server
# Access at http://localhost:8080
```

### 2. Windows Executable

**Location**: `distribution/builds/windows/`

Two installer types:

- **NSIS Installer** (`.exe`) - Full Windows installer with uninstall
- **Portable** (`.exe`) - Standalone, no installation required

**Features**:

- Auto-start menu shortcuts
- Desktop shortcuts
- Uninstall support (NSIS version)
- No internet required to run

**Usage**:

```bash
# Run installer
./distribution/builds/windows/Conductor\ Designer\ Setup\ 1.0.0.exe

# Or portable version
./distribution/builds/windows/Conductor\ Designer-1.0.0-portable.exe
```

### 3. Docker Images

**Location**: `distribution/builds/docker/`

Two formats:

- **TAR** (`conductor-designer.tar`) - Full uncompressed (~600MB)
- **TAR.GZ** (`conductor-designer.tar.gz`) - Compressed (~150MB)

**Features**:

- Works offline (after import)
- Compatible with Docker and Rancher Desktop
- All dependencies included
- Multi-platform (linux/amd64, linux/arm64)

**Usage**:

```bash
# Load compressed image (recommended)
docker load -i distribution/builds/docker/conductor-designer.tar.gz

# Or load uncompressed
docker load -i distribution/builds/docker/conductor-designer.tar

# Run container
docker run -d -p 4000:4000 conductor-designer:latest

# Access at http://localhost:4000
```

---

(Truncated for archive copy)
