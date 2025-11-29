# Distribution & Build Guide

This consolidated guide covers building and distributing Conductor Designer in three formats:
- Web application (static files)
- Windows executable (Electron + electron-builder)
- Portable Docker images (TAR/TAR.GZ) suitable for Rancher Desktop and offline import

It also documents the automated distribution build system that creates all artifacts and maintains an auto-incrementing Build ID.

---

## Quick Index
- Overview
- Build system (auto-incrementing Build IDs)
- Web build
- Windows EXE build
- Docker / Rancher Desktop
- Distribution folder structure
- GitHub Actions automation
- Local workflows & commands
- Troubleshooting

---

## Overview

Conductor Designer can be packaged and distributed in multiple formats to suit different audiences:
- Static web build for hosting on HTTP servers
- Windows installers and portable executables for end users
- Docker images (TAR or compressed TAR.GZ) for containerized deployment and offline import into Rancher Desktop or Docker

A distribution build system is provided to build all formats, gather artifacts into `distribution/builds/`, and automatically increment a Build ID stored in `.build-metadata.json`.

---

## Build System (Auto-incrementing Build IDs)

- Build ID starts at `1000` and increments with each `dist:build-all` build.
- Metadata is stored in `.build-metadata.json` at repository root and auto-committed by CI on pushes.
- Use `npm run dist:build-all` to create a complete distribution (Web + Windows + Docker).

Metadata example (`.build-metadata.json`):

```json
{
  "buildId": 1002,
  "lastBuildDate": "2025-11-29T12:34:56.789Z",
  "version": "1.0.0",
  "artifacts": { /* paths to artifacts */ }
}
```

---

## Web Application

### Build
```bash
npm run build
```
Outputs static files to `dist/`.

### Serve (local)
```bash
cd dist
npx http-server
# Access at http://localhost:8080
```

---

## Windows Executable (Electron)

### Prerequisites
- Node.js 18+, npm
- Windows recommended for local signing/testing

### Dev (Electron)
```bash
npm run electron-dev
```

### Build EXE
```bash
npm run electron-build
```
Creates installers in `dist/` (NSIS installer and portable EXE).

### Notes
- Code signing optional; configure `CSC_LINK` and `CSC_KEY_PASSWORD` in CI

---

## Docker & Rancher Desktop

### Build (local)
```bash
# Using Docker
npm run docker-build

# Using Rancher Desktop
rancher build -t conductor-designer:latest .
```

### Export (portable offline TAR)
```bash
# Uncompressed
npm run docker-export
# Compressed
npm run docker-export:gz
```

### Import on offline machine
```bash
# Docker
docker load -i conductor-designer.tar.gz
# Rancher Desktop
rancher load -i conductor-designer.tar.gz
```

### Run
```bash
docker run -d -p 4000:4000 conductor-designer:latest
# or docker-compose up -d
```

---

## Distribution Folder Structure

After `npm run dist:build-all`, artifacts are organized:

```
distribution/
├── README.md
└── builds/
    ├── BUILD-1001-SUMMARY.md
    ├── web/        # static web files
    ├── windows/    # installers and portable EXE files
    └── docker/     # conductor-designer.tar and conductor-designer.tar.gz
```

Each build includes a summary markdown and the artifacts list.

---

## GitHub Actions Integration

- Workflow builds all distributions on pushes to `main`/`master` and selected branches; artifacts are uploaded to Actions.
- Tagging a commit (e.g., `v1.2.0`) triggers a release with artifacts attached.
- Build metadata `.build-metadata.json` is auto-committed to preserve build history.

---

## Local Commands Reference

| Command | Purpose |
|---|---|
| `npm run build` | Web (Vite) build only |
| `npm run electron-build` | Build Windows EXE |
| `npm run docker-build` | Build Docker image locally |
| `npm run docker-export:gz` | Export compressed Docker TAR | 
| `npm run dist:build-all` | Build all formats and collect into `distribution/builds/` |

---

## Troubleshooting

- Ensure Docker / Rancher Desktop is running for Docker builds.
- For Windows EXE issues, run `npm run electron-build` locally and inspect `dist/`.
- If build ID doesn't increment, verify `.build-metadata.json` permissions and CI auto-commit steps.

---

## Where to find more details
- Archived detailed Windows EXE guide: `ReadMe/archived/BUILD_WINDOWS_EXE.md`
- Archived Docker / Rancher Desktop details: `ReadMe/archived/DOCKER_RANCHER_DESKTOP.md`
- Archived full distribution system: `ReadMe/archived/BUILD_DISTRIBUTION_SYSTEM.md`


---

Legacy, more-detailed files have been archived to `ReadMe/archived/` and removed from the main `ReadMe/` folder.
