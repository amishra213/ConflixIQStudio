# ConflixIQ Studio

A comprehensive visual workflow designer for Netflix Conductor - build, edit, and manage Conductor workflows with an intuitive drag-and-drop interface.

![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Features

- **Visual Workflow Designer** - Drag-and-drop workflow creation with React Flow
- **Task Library** - Full support for all Conductor task types (HTTP, Kafka, Sub-Workflow, etc.)
- **Operator Support** - Fork/Join, Switch, Do-While, Dynamic Fork, and more
- **Real-time Validation** - Validate workflows before deployment
- **Execution Monitoring** - View workflow executions and task details
- **Dark Theme** - Modern dark UI optimized for productivity
- **Portable Deployment** - Windows EXE or Docker container

---

## 📦 Installation & Quick Start

### Option 1: Docker (Recommended for All Platforms)

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/amishra213/ConflixIQStudio:latest

# If image is already imported run the container
docker run -d -p 4000:4000 --name conflixiq-studio conflixiq-studio:latest




# Access at http://localhost:4000
```

### Option 2: Windows Executable (Portable)

1. Download the latest `.exe` from [Releases](https://github.com/amishra213/ConflixIQStudio/releases)
2. Extract the ZIP file
3. Double-click `conflixiq-studio-build-XXX.bat` or run the `.exe` directly
4. App opens automatically in your browser at `http://localhost:4000`

**No installation required!** Everything is self-contained and portable.

### Option 3: From Source

```bash
# Clone the repository
git clone https://github.com/amishra213/ConflixIQStudio.git
cd ConflixIQStudio

# Install dependencies
npm install

# Run development server (frontend + backend)
npm run dev:full

# Or run separately:
npm run dev        # Frontend only (http://localhost:5173)
npm run server:dev # Backend only (http://localhost:4000)
```

---

## 🛠️ Building from Source

### Prerequisites

- **Node.js**: 20.0.0 or higher
- **npm**: 8.0.0 or higher
- **Optional**: Docker or Rancher Desktop for container builds

Check your versions:

```bash
node --version    # Should be v20.x or higher
npm --version     # Should be 8.x or higher
```

### Build Commands

```bash
# Build web UI
npm run build

# Build Windows EXE (portable, no installation)
npm run sea:build:windows

# Build Docker image and export TAR
npm run docker-build

# Build all (Windows EXE + Docker)
npm run sea:build
```

### Build Output Locations

After building, you'll find artifacts in:

```
dist/
├── sea-build-[timestamp]/           # Windows EXE build
│   ├── conflixiq-studio-build-XXX.exe
│   ├── conflixiq-studio-build-XXX.bat
│   ├── conflixiq-studio-build-XXX.zip
│   └── BUILD-REPORT.md
└── docker/                          # Docker TAR files
    └── conflixiq-studio-1.0.0-amd64.tar
```

### Running Your Builds

**Windows EXE:**

```cmd
# Method 1: Double-click the .bat file (easiest)
dist\sea-build-YYYY-MM-DD-HH-MM-SS\conflixiq-studio-build-XXX.bat

# Method 2: Run the EXE directly
dist\sea-build-YYYY-MM-DD-HH-MM-SS\conflixiq-studio-build-XXX.exe
```

**Docker:**

```bash
# Load the TAR file
docker load -i dist/docker/conflixiq-studio-1.0.0-amd64.tar

# Run the container
docker run -d -p 4000:4000 conflixiq-studio:latest
```

---

## 🐳 Docker Deployment

### Using Docker CLI

```bash
# Build image
docker build -t conflixiq-studio:latest .

# Run container
docker run -d \
  --name conflixiq-studio \
  -p 4000:4000 \
  -v conductor-logs:/app/logs \
  -v conductor-filestore:/app/.filestore \
  -e CONDUCTOR_API=http://localhost:8080 \
  conflixiq-studio:latest

# View logs
docker logs -f conflixiq-studio

# Stop container
docker stop conflixiq-studio

# Remove container
docker rm conflixiq-studio
```

### Using Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Using Rancher Desktop

Rancher Desktop supports both `nerdctl` and `docker` CLI:

```powershell
# Using nerdctl (Rancher default)
nerdctl build -t conflixiq-studio:latest .
nerdctl run -d --name conflixiq-studio -p 4000:4000 conflixiq-studio:latest

# Or using docker CLI
docker build -t conflixiq-studio:latest .
docker run -d --name conflixiq-studio -p 4000:4000 conflixiq-studio:latest
```

**Rancher Desktop Tips:**

- Enable WSL2 backend for better performance (Windows)
- Allocate sufficient resources (4GB RAM, 2 CPUs recommended)
- Use Docker mode instead of Kubernetes for simpler deployment

---

## 🔧 Configuration

### Environment Variables

| Variable        | Default               | Description                              |
| --------------- | --------------------- | ---------------------------------------- |
| `PORT`          | 4000                  | HTTP server port                         |
| `CONDUCTOR_API` | http://localhost:8080 | Conductor server URL                     |
| `NODE_ENV`      | production            | Environment mode                         |
| `LOG_LEVEL`     | info                  | Logging level (debug, info, warn, error) |

### Connecting to Conductor Server

**Docker:**

```bash
docker run -d -p 4000:4000 \
  -e CONDUCTOR_API=https://conductor.example.com \
  conflixiq-studio:latest
```

**Windows EXE:**

```cmd
set CONDUCTOR_API=https://conductor.example.com
conflixiq-studio.exe
```

**Development:**
Create a `.env` file in the project root:

```properties
CONDUCTOR_API=http://localhost:8080
PORT=4000
LOG_LEVEL=info
```

### Port Configuration

Change the default port (4000) if needed:

```bash
# Docker
docker run -d -p 5000:5000 -e PORT=5000 conflixiq-studio:latest

# Windows
set PORT=5000
conflixiq-studio.exe
```

---

## 📂 Project Structure

```
ConflixIQStudio/
├── src/                          # React frontend source
│   ├── components/               # UI components
│   │   ├── modals/               # Task/operator modals
│   │   ├── workflow/             # Workflow designer components
│   │   └── ui/                   # Reusable UI components
│   ├── pages/                    # Page components
│   │   ├── WorkflowDesigner.tsx  # Main workflow editor
│   │   ├── Executions.tsx        # Workflow execution list
│   │   └── Settings.tsx          # App settings
│   ├── stores/                   # Zustand state management
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions
│   └── types/                    # TypeScript type definitions
├── scripts/                      # Build scripts
│   └── sea-builder.ts            # Node.js SEA builder
├── index.js                      # Backend server (Express + GraphQL)
├── Dockerfile                    # Docker build configuration
├── docker-compose.yml            # Docker Compose configuration
└── package.json                  # npm dependencies and scripts
```

---

## 🚧 Troubleshooting

### Windows EXE Won't Start

1. **Windows Defender blocking:**
   - Windows Security → Virus & threat protection
   - Add exception for `conflixiq-studio.exe`

2. **Port already in use:**

   ```cmd
   # Check what's using port 4000
   netstat -ano | findstr :4000

   # Kill the process (replace PID)
   taskkill /PID [PID] /F

   # Or use a different port
   set PORT=5000
   conflixiq-studio.exe
   ```

3. **Missing files:**
   - Ensure all files from the ZIP are extracted
   - Don't move the EXE outside its folder

### Docker Container Won't Start

1. **Check container logs:**

   ```bash
   docker logs conflixiq-studio
   ```

2. **Port conflict:**

   ```bash
   # Use a different port
   docker run -d -p 5000:5000 -e PORT=5000 conflixiq-studio:latest
   ```

3. **Image not found:**

   ```bash
   # List images
   docker images | grep conductor

   # Pull or build the image
   docker pull ghcr.io/amishra213/ConflixIQStudio:latest
   ```

### Build Fails with EBUSY Error

This happens on Windows when files are locked:

```powershell
# Option 1: Manual cleanup (PowerShell)
Remove-Item -Path ".\.build" -Recurse -Force -ErrorAction SilentlyContinue
npm run sea:build

# Option 2: Run as Administrator
# Right-click PowerShell → Run as Administrator
npm run sea:build

# Option 3: Wait and retry
timeout /t 5 /nobreak
npm run sea:build
```

### Can't Connect to Conductor Server

This is **expected** if you don't have a Conductor server running. The app works offline with reduced functionality.

To connect to a Conductor server:

```bash
# Update environment variable
docker run -d -p 4000:4000 -e CONDUCTOR_API=http://your-conductor-host:8080 conflixiq-studio:latest
```

---

## 📊 Performance

- **Startup Time**: < 1 second
- **Memory Usage**: 30-50 MB
- **File Size**: 60-80 MB (Windows EXE)
- **Docker Image**: ~200 MB

---

## 🧰 Development

### Quick Start for Developers

#### Prerequisites

- **Node.js**: 20+ installed
- **npm**: 8+ installed

#### Install Dependencies

```bash
npm install
```

#### Development Mode

```bash
# Run frontend and backend together (Recommended)
npm run dev:full

# Or run separately:
npm run dev        # Frontend only (http://localhost:5173)
npm run server:dev # Backend only (http://localhost:4000)
```

#### Production Build

```bash
# Build web UI
npm run build

# Build Windows EXE (portable, no installation needed)
npm run sea:build:windows

# Build Docker image
npm run docker-build
```

### Common Development Commands

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

## 📊 Logging Framework

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

| Level     | Severity | Use Case                      | Example                             |
| --------- | -------- | ----------------------------- | ----------------------------------- |
| **DEBUG** | 0        | Development & troubleshooting | "Fetching task definitions from..." |
| **INFO**  | 1        | Normal operations             | "✓ Configuration updated"           |
| **WARN**  | 2        | Warnings & issues             | "Cache size approaching limit"      |
| **ERROR** | 3        | Failures & errors             | "Failed to connect to Conductor"    |

### Features

- ✅ **Color-Coded Output**: Cyan (DEBUG), Green (INFO), Yellow (WARN), Red (ERROR)
- ✅ **Automatic File Rotation**: Daily timestamps + size-based rotation (10MB default)
- ✅ **Log Retention**: Automatic cleanup (7 days default, configurable)
- ✅ **Dual Output**: Console (for viewing) + File (for persistence)
- ✅ **Async I/O**: Non-blocking file writes with sync fallback
- ✅ **6 Environment Variables**: Full configuration control
- ✅ **Zero Overhead**: < 0.1% CPU, ~2MB memory

### Logging Environment Variables

| Variable        | Default  | Description                               |
| --------------- | -------- | ----------------------------------------- |
| `LOG_LEVEL`     | INFO     | Minimum log level (DEBUG/INFO/WARN/ERROR) |
| `LOGS_PATH`     | ./logs   | Log file directory                        |
| `LOG_CONSOLE`   | true     | Enable console output                     |
| `LOG_FILE`      | true     | Enable file output                        |
| `LOG_MAX_SIZE`  | 10485760 | Max file size before rotation (bytes)     |
| `LOG_RETENTION` | 7        | Days to retain logs                       |

### Logging Configuration Examples

**Windows Command Prompt:**

```cmd
set LOG_LEVEL=DEBUG
npm run server:dev
```

**Windows PowerShell:**

```powershell
$env:LOG_LEVEL = "DEBUG"
npm run server:dev
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

### Log Output Examples

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

### Logging Implementation Details

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
   - REST endpoints (/api/config, /api/health, /api/metadata/\*)
   - GraphQL resolvers (workflows, tasks, executions)
   - File operations (/api/filestore/\*)
   - Error handlers with context

3. **Testing**
   - Comprehensive test suite (test-logging.js)
   - All log levels verified
   - File output validation
   - Console color coding confirmed
   - Filtering tests passed

#### Logger Architecture

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

**Log File Structure:**

```
logs/
├── conflixiq-studio-2025-12-04.log   # Today's logs
├── conflixiq-studio-2025-12-03.log   # Yesterday
└── conflixiq-studio-2025-12-02.log   # Previous days
```

### Logging Performance

| Metric        | Value              | Status           |
| ------------- | ------------------ | ---------------- |
| CPU Overhead  | < 0.1%             | ✅ Negligible    |
| Memory Usage  | ~2 MB              | ✅ Minimal       |
| Startup Delay | < 10 ms            | ✅ Imperceptible |
| File I/O      | Async              | ✅ Non-blocking  |
| Disk Usage    | ~10 MB/day at INFO | ✅ Reasonable    |

### Logging Troubleshooting

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
**Node.js Requirement**: 20.0.0+  
**Last Updated**: December 4, 2025
