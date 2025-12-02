# Netflix Conductor Hub - Developer Guide

This folder contains detailed documentation for developers working on Conductor Designer.

## Quick Links

- **[Build Guide](BUILD_GUIDE.md)** - Build Windows EXE and Docker images
- **[Docker Deployment](DOCKER_RANCHER_DEPLOYMENT.md)** - Deploy with Docker or Rancher Desktop
- **[Extending Modals](EXTENDING_MODALS_FOR_VARIANTS.md)** - Customize for Conductor variants

## Getting Started

> **Prerequisites:**
>
> - [Node.js](https://nodejs.org/en/) 20+ installed
> - npm 8+ installed

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
# Run frontend and backend together
npm run dev:full

# Or run separately:
npm run dev        # Frontend only (http://localhost:5173)
npm run server:dev # Backend only (http://localhost:4000)
```

### Production Build

```bash
# Build web UI
npm run build

# Build Windows EXE (portable, no installation needed)
npm run sea:build:windows

# Build Docker image
npm run docker-build
```

## Distribution

### Windows Users

Build and distribute the Windows EXE:

```bash
npm run sea:build:windows
```

Output: `dist/sea-build-*/conductor-designer-build-XXX.zip`

Users just extract and run - no installation required!

### Docker Users

```bash
# Build and export TAR
npm run docker-build

# Or pull from registry
docker pull ghcr.io/amishra213/ConflixIQStudio:latest
```

## Common Commands

| Command                     | Description               |
| --------------------------- | ------------------------- |
| `npm run dev`               | Start frontend dev server |
| `npm run dev:full`          | Start frontend + backend  |
| `npm run build`             | Build production web UI   |
| `npm run sea:build:windows` | Build Windows EXE         |
| `npm run docker-build`      | Build Docker image + TAR  |
| `npm run format`            | Format code with Prettier |
| `npm run lint`              | Run ESLint                |
| `npm run type-check`        | TypeScript type checking  |

---

**Version**: 1.0.0  
**Last Updated**: December 2025
