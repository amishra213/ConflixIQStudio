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

## Logging Framework

ConflixIQ Studio includes a comprehensive, production-grade logging framework with multiple log levels, automatic file rotation, and retention policies.

### Quick Start

```bash
# Set log level (DEBUG, INFO, WARN, ERROR)
set LOG_LEVEL=DEBUG
npm run server:dev

# View logs in real-time
tail -f logs/conflixiq-studio-2025-12-04.log

# Test the logging framework
node test-logging.js DEBUG
```

### Log Levels

| Level | Severity | Use Case | Example |
|-------|----------|----------|---------|
| **DEBUG** | 0 | Development & troubleshooting | "Fetching task definitions from..." |
| **INFO** | 1 | Normal operations | "✓ Configuration updated" |
| **WARN** | 2 | Warnings & issues | "Cache size approaching limit" |
| **ERROR** | 3 | Failures & errors | "Failed to connect to Conductor" |

### Features

- ✅ **Color-Coded Output**: Cyan (DEBUG), Green (INFO), Yellow (WARN), Red (ERROR)
- ✅ **Automatic File Rotation**: Daily timestamps + size-based rotation (10MB default)
- ✅ **Log Retention**: Automatic cleanup (7 days default, configurable)
- ✅ **Dual Output**: Console (for viewing) + File (for persistence)
- ✅ **Async I/O**: Non-blocking file writes with sync fallback
- ✅ **6 Environment Variables**: Full configuration control
- ✅ **Zero Overhead**: < 0.1% CPU, ~2MB memory

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | INFO | Minimum log level (DEBUG/INFO/WARN/ERROR) |
| `LOGS_PATH` | ./logs | Log file directory |
| `LOG_CONSOLE` | true | Enable console output |
| `LOG_FILE` | true | Enable file output |
| `LOG_MAX_SIZE` | 10485760 | Max file size before rotation (bytes) |
| `LOG_RETENTION` | 7 | Days to retain logs |

### Configuration Examples

**Windows Command Prompt:**
```cmd
set LOG_LEVEL=DEBUG
conflixiq-studio.exe
```

**Windows PowerShell:**
```powershell
$env:LOG_LEVEL = "DEBUG"
conflixiq-studio.exe
```

**Docker:**
```bash
docker run -d -p 4000:4000 -e LOG_LEVEL=DEBUG conflixiq-studio:latest
```

**Custom Log Directory:**
```bash
set LOGS_PATH=C:\AppLogs\ConflixIQ
npm run server:dev
```

### Log Output

Logs are written to both console and file:

**Console (with color coding):**
```
2025-12-04T10:30:15.123Z [INFO ] 🚀 ConflixIQ Studio Server Starting
2025-12-04T10:30:15.200Z [INFO ] ✓ GraphQL proxy ready at http://localhost:4000/graphql
2025-12-04T10:30:16.456Z [DEBUG] Fetching task definitions from http://localhost:8080
2025-12-04T10:30:16.789Z [DEBUG] ✓ Successfully fetched 15 task definitions
```

**File (logs/conflixiq-studio-YYYY-MM-DD.log):**
- Daily log rotation with timestamps
- Size-based rotation (10MB default)
- Automatic retention (7 days default)
- Async file writing for performance

### Viewing Logs

```bash
# View current day's logs
cat logs/conflixiq-studio-2025-12-04.log

# Follow logs in real-time (Windows PowerShell)
Get-Content logs/conflixiq-studio-2025-12-04.log -Wait

# Follow logs in real-time (Linux/Mac)
tail -f logs/conflixiq-studio-2025-12-04.log

# Search for errors
grep ERROR logs/conflixiq-studio-*.log
```

### Implementation Details

#### Core Components

1. **server-logger.js** - Core logging framework
   - 4 log levels with severity filtering
   - Color-coded console output (ANSI codes)
   - Async file I/O with sync fallback
   - Daily and size-based rotation
   - Log retention policies
   - Statistics/monitoring API

2. **Integrated Endpoints** (20+ endpoints)
   - Server startup with configuration
   - REST endpoints (/api/config, /api/health, /api/metadata/*)
   - GraphQL resolvers (workflows, tasks, executions)
   - File operations (/api/filestore/*)
   - Error handlers with context

3. **Testing**
   - Comprehensive test suite (test-logging.js)
   - All log levels verified
   - File output validation
   - Console color coding confirmed
   - Filtering tests passed

#### Architecture

**Logger Methods:**
```javascript
import { serverLogger } from './server-logger.js';

serverLogger.debug('Detailed operational info');
serverLogger.info('Significant events');
serverLogger.warn('Warning conditions');
serverLogger.error('Error conditions');

// Runtime configuration
serverLogger.setLevel('DEBUG');
const stats = serverLogger.getStats();
```

**File Structure:**
```
logs/
├── conflixiq-studio-2025-12-04.log   # Today's logs
├── conflixiq-studio-2025-12-03.log   # Yesterday
└── conflixiq-studio-2025-12-02.log   # Previous days
```

### Performance

| Metric | Value | Status |
|--------|-------|--------|
| CPU Overhead | < 0.1% | ✅ Negligible |
| Memory Usage | ~2 MB | ✅ Minimal |
| Startup Delay | < 10 ms | ✅ Imperceptible |
| File I/O | Async | ✅ Non-blocking |
| Disk Usage | ~10 MB/day at INFO | ✅ Reasonable |

### Troubleshooting

**Not seeing DEBUG messages?**
```bash
set LOG_LEVEL=DEBUG
# Default is INFO, which hides DEBUG
```

**Logs too verbose?**
```bash
set LOG_LEVEL=WARN
# Only shows WARN and ERROR
```

**Where are my logs?**
```
logs/conflixiq-studio-YYYY-MM-DD.log
```

**Custom log directory?**
```bash
set LOGS_PATH=C:\MyLogs
```

---

**Version**: 1.0.0  
**Last Updated**: December 2025
