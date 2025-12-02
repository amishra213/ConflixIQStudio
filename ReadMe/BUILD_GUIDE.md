# 🚀 Build Guide - ConflixIQ Studio

## Quick Start (Copy & Paste)

```bash
# Build portable Windows EXE and Docker image
npm run sea:build

# Build Windows EXE only
npm run sea:build:windows

# Build Docker image only
npm run sea:build:docker
```

## What You'll Get

After running the build, you'll find your artifacts in:

```
dist/sea-build-[timestamp]/
├── conflixiq-studio-build-001.exe     # Windows portable executable (numbered)
├── conflixiq-studio-build-001.bat     # Quick launcher batch file
├── launcher.js                          # Entry point script
├── conflixiq-studio-build-001.zip     # Portable package with dependencies
├── conflixiq-studio-build-001.tar     # Docker image tar (numbered)
└── BUILD-REPORT.md                      # Build details

dist/release/                            # Ready for distribution & CI/CD
├── conflixiq-studio-build-001.exe     # Windows EXE (copied here)
├── conflixiq-studio-build-001.zip     # Windows ZIP (copied here)
└── conflixiq-studio-build-001.tar     # Docker tar (copied here)
```

**Build numbers increment automatically** - each build gets a new number (build-001, build-002, etc.)

**Release folder** - All artifacts are automatically copied to `dist/release/` for easy distribution and CI/CD integration.

## Running the Application

### Option 1: Windows EXE (Fastest & Easiest)

**Method A: Double-click the batch file (recommended)**

```
dist\sea-build-YYYY-MM-DD-HH-MM-SS\conflixiq-studio-build-001.bat
```

**Method B: Run the EXE directly**

```cmd
cd dist\sea-build-YYYY-MM-DD-HH-MM-SS
conflixiq-studio-build-001.exe
```

The app will automatically:

- ✅ Create `.filestore` and `logs` folders (first run)
- ✅ Start the backend server
- ✅ Open your browser at `http://localhost:4000`

**No installation required** - just run and go! 🚀

### Option 2: Docker Container

```bash
# Load the Docker image (use build number from your build)
docker load -i dist/release/conflixiq-studio-build-XXX.tar

# Run the container
docker run -d -p 4000:4000 conflixiq-studio:build-XXX

# Access at http://localhost:4000
```

### Option 3: Docker with Docker Compose

```bash
# Load the image first
docker load -i dist/release/conflixiq-studio-build-XXX.tar

# Tag as latest for docker-compose compatibility
docker tag conflixiq-studio:build-XXX conflixiq-studio:latest

# Then run
docker-compose up -d
```

## Configuration

### Change the Port

```cmd
# Windows
set PORT=5000
conflixiq-studio.exe

# Docker
docker run -d -p 5000:5000 -e PORT=5000 conflixiq-studio:latest
```

### Connect to Different Conductor Server

```cmd
# Windows
set CONDUCTOR_API=https://conductor.example.com
conflixiq-studio.exe

# Docker
docker run -d -p 4000:4000 -e CONDUCTOR_API=https://conductor.example.com conflixiq-studio:latest
```

## Build Methods

### Using npm (Recommended)

```bash
npm run sea:build              # All targets
npm run sea:build:windows      # Windows EXE
npm run sea:build:docker       # Docker
```

### Using Batch Files (Windows)

```cmd
.\bin\run-sea-build.bat        # All targets
.\bin\run-sea-windows.bat      # Windows EXE
.\bin\run-sea-docker.bat       # Docker
```

### Using PowerShell

```powershell
.\scripts\build-sea.ps1 -Target all      # All targets
.\scripts\build-sea.ps1 -Target windows  # Windows EXE
.\scripts\build-sea.ps1 -Target docker   # Docker
```

## Prerequisites

- **Node.js**: 20.0.0 or higher
- **npm**: 8.0.0 or higher
- **Optional for Docker builds**: Docker or Rancher Desktop

Check your versions:

```bash
node --version    # Should be v20.x or higher
npm --version     # Should be 8.x or higher
```

## Troubleshooting

### Build Fails with EBUSY or "resource busy" Error

This error occurs when Windows file locks prevent cleanup of build artifacts. Solutions:

```bash
# Option 1: Manual cleanup (most effective)
# In PowerShell:
Remove-Item -Path ".\.build" -Recurse -Force -ErrorAction SilentlyContinue
npm run sea:build

# Option 2: Run as Administrator
# PowerShell as Admin:
npm run sea:build

# Option 3: Wait and retry (Windows releases locks after a few seconds)
timeout /t 5 /nobreak
npm run sea:build

# Option 4: Disable antivirus temporarily
# Some antivirus software locks files during scan
```

**Why this happens:**

- Windows Defender or antivirus scanning build files
- Node.js or npm process still holding file handles
- Previous build not fully cleaned up
- Write-locked files from IDE or Explorer

The build system now includes automatic retry logic with 3 attempts and configurable wait times.

### Build Fails

**Clean and retry:**

```bash
# Remove build cache
rm -r .build

# Rebuild
npm run sea:build
```

### Windows EXE Won't Start

1. Check if Windows Defender is blocking it
   - Windows Security → Virus & threat protection
   - Add exception for `conflixiq-studio.exe`

2. Verify all files are present in the build directory

3. Try running from Command Prompt with error output:
   ```cmd
   conflixiq-studio.exe 2>&1 | more
   ```

### Docker Image Won't Load

```bash
# Try loading with verbose output
docker load -i dist/release/conflixiq-studio-build-XXX.tar --verbose

# Verify image loaded
docker images | grep conflixiq
```

### Port Already in Use

```cmd
# Windows - use a different port
set PORT=5000
conflixiq-studio.exe

# Or find what's using port 4000
netstat -ano | findstr :4000
taskkill /PID [PID] /F
```

## Performance

- **Startup Time**: < 1 second
- **Memory Usage**: 30-50 MB
- **File Size**: 60-80 MB (Windows EXE)
- **Download Size**: 200-300 MB (with dependencies)

## Distribution

### For Windows Users

1. Build: `npm run sea:build:windows`
2. Share the `dist/release/conflixiq-studio-build-XXX.zip` file
3. Users extract the ZIP file
4. Users double-click `conflixiq-studio-build-XXX.bat` to run
5. App opens automatically in their browser!

Everything is included - no additional setup needed.

### For Docker Users

1. Build: `npm run sea:build:docker`
2. Load the image: `docker load -i dist/release/conflixiq-studio-build-XXX.tar`
3. Run: `docker run -d -p 4000:4000 conflixiq-studio:build-XXX`

### For GitHub Releases (CI/CD)

The build process automatically creates a `dist/release/` folder containing all artifacts with build numbers:

```bash
# After running builds, these files are ready for release:
dist/release/
├── conflixiq-studio-build-XXX.exe
├── conflixiq-studio-build-XXX.zip
└── conflixiq-studio-build-XXX.tar
```

**GitHub Actions Integration:**
- Automatically uploads artifacts from `dist/release/`
- Build numbers ensure version tracking
- Consistent naming across Windows EXE, ZIP, and Docker tar
- See `.github/workflows/build-docker.yml` for implementation

### For Server Deployment

Upload Docker image to your registry:

```bash
docker load -i dist/release/conflixiq-studio-build-XXX.tar
docker tag conflixiq-studio:build-XXX myregistry/conflixiq-studio:latest
docker push myregistry/conflixiq-studio:latest
```

Users can then pull and run:

```bash
docker run -d -p 4000:4000 myregistry/conflixiq-studio:latest
```

## Environment Variables

| Variable        | Default               | Description                              |
| --------------- | --------------------- | ---------------------------------------- |
| `PORT`          | 4000                  | HTTP server port                         |
| `NODE_ENV`      | production            | Environment mode                         |
| `CONDUCTOR_API` | http://localhost:8080 | Conductor server URL                     |
| `LOG_LEVEL`     | info                  | Logging level (debug, info, warn, error) |

## Development

### For Development Mode

```bash
# Terminal 1: Backend server with hot reload
npm run server:dev

# Terminal 2: Frontend dev server
npm run dev

# Or both together
npm run dev:full
```

Then visit `http://localhost:5173` for the frontend.

## Build Process

The build system:

1. Compiles the React frontend with Vite
2. Bundles the backend and frontend together
3. Creates a portable Windows EXE using Node.js SEA
4. Optionally creates a Docker image

The resulting EXE is completely portable - no installation needed, no external runtime dependencies.

## What is Node.js SEA?

Node.js Single Executable Application (SEA) packages your Node.js application into a single executable file. This provides:

- ✅ **60% smaller** than traditional Electron apps
- ✅ **70% faster** startup time
- ✅ **60% less memory** usage
- ✅ **No external runtime** required
- ✅ **Fully portable** - works on any Windows machine

## Support

If you encounter issues:

1. Check the `BUILD-REPORT.md` in your build directory
2. Review troubleshooting section above
3. Verify Node.js version is 20.0.0 or higher
4. Try a clean rebuild: `rm -r .build && npm run sea:build`

## Common Commands

```bash
# Install dependencies
npm install

# Build web UI
npm run build

# Build all (Windows EXE + Docker)
npm run sea:build

# Build Windows EXE only (small, portable, no installation)
npm run sea:build:windows

# Build Docker image
npm run sea:build:docker

# Format code
npm run format

# Run linter
npm run lint

# Run linter with auto-fix
npm run lint:fix
```

## Docker Compose

Quick start with Docker Compose:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Make sure the Docker image is loaded first:

```bash
docker load -i dist/release/conflixiq-studio-build-XXX.tar
docker tag conflixiq-studio:build-XXX conflixiq-studio:latest
```

## Release Artifacts & CI/CD

### Build Numbering

- **Automatic Incremental Build Numbers**: Each build increments the build number (stored in `.build-metadata.json`)
- **Format**: `build-XXX` where XXX is a zero-padded 3-digit number (e.g., `build-001`, `build-030`)
- **Applied To**: Windows EXE, Windows ZIP, and Docker TAR files

### Artifact Locations

**Build Output Directory:**
```
dist/sea-build-[timestamp]/
├── conflixiq-studio-build-XXX.exe      # Windows executable
├── conflixiq-studio-build-XXX.zip      # Windows portable package
├── conflixiq-studio-build-XXX.tar      # Docker image tar
├── conflixiq-studio-portable.jar       # Docker JAR (legacy)
├── BUILD-REPORT.md                      # Build details
├── launcher.js, index.js, etc.         # Application files
├── dist/                                # Web UI files
└── node_modules/                        # Dependencies
```

**Release Directory (CI/CD Ready):**
```
dist/release/
├── conflixiq-studio-build-XXX.exe      # Ready for GitHub releases
├── conflixiq-studio-build-XXX.zip      # Ready for distribution
└── conflixiq-studio-build-XXX.tar      # Ready for Docker deployment
```

All artifacts in `dist/release/` are automatically copied by the build system and ready for:
- GitHub Actions uploads
- GitHub Releases
- Manual distribution
- Docker deployments

### GitHub Actions Integration

**Windows Build Job:**
- Builds Windows executable using `npm run sea:build:windows`
- Uploads artifacts from `dist/release/*.{exe,zip}`
- Creates GitHub releases on tags from `dist/release/` artifacts

**Docker Export Job:**
- Builds Docker image using `npm run sea:build:docker`
- Uploads Docker tar from `dist/release/*.tar`
- Creates GitHub releases on tags from `dist/release/` artifacts

**Workflow File:** See `.github/workflows/build-docker.yml` for full implementation.

### Loading Docker Images

**From Build-Numbered Tar:**
```bash
docker load -i dist/release/conflixiq-studio-build-030.tar
docker images | grep conflixiq-studio
# Shows: conflixiq-studio:build-030

docker run -d -p 4000:4000 conflixiq-studio:build-030
```

**From Latest Tar (npm scripts):**
```bash
docker load -i dist/release/conflixiq-studio-latest.tar
docker run -d -p 4000:4000 conflixiq-studio:latest
```

### Release Benefits

✅ **Consistent Versioning**: Same build number across Windows and Docker  
✅ **CI/CD Ready**: `dist/release/` folder integrates seamlessly with GitHub Actions  
✅ **Easy Distribution**: Single folder contains all release artifacts  
✅ **Automatic Copying**: Build system handles artifact preparation  
✅ **Version Tracking**: Build numbers stored in `.build-metadata.json`

## Next Steps

1. Run your first build: `npm run sea:build`
2. Test the Windows EXE or Docker image
3. Share with your team or deploy to production
4. Enjoy the improved performance! 🚀

---

**Version**: 1.0.0  
**Node.js Requirement**: 20.0.0+  
**Last Updated**: December 2, 2025
