#!/usr/bin/env node

/**
 * Comprehensive Distribution Builder
 * Creates all distribution packages (Web, Windows EXE, Docker) in a single distribution folder
 * Auto-increments build ID for each build
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'distribution');
const BUILD_OUTPUT_DIR = path.join(DIST_DIR, 'builds');
const METADATA_FILE = path.join(ROOT_DIR, '.build-metadata.json');

interface BuildMetadata {
  buildId: number;
  lastBuildDate: string;
  version: string;
  artifacts: {
    web?: string;
    windows?: string[];
    docker?: string[];
  };
}

const DEFAULT_METADATA: BuildMetadata = {
  buildId: 1000,
  lastBuildDate: new Date().toISOString(),
  version: '1.0.0',
  artifacts: {},
};

function log(message: string) {
  console.log(`[BUILD] ${message}`);
}

function error(message: string) {
  console.error(`[ERROR] ${message}`);
}

function getBuildMetadata(): BuildMetadata {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
    }
  } catch {
    log('Creating new build metadata');
  }
  return DEFAULT_METADATA;
}

function saveBuildMetadata(metadata: BuildMetadata) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

function incrementBuildId(): number {
  const metadata = getBuildMetadata();
  const newBuildId = metadata.buildId + 1;
  metadata.buildId = newBuildId;
  metadata.lastBuildDate = new Date().toISOString();
  saveBuildMetadata(metadata);
  log(`Build ID incremented: ${newBuildId}`);
  return newBuildId;
}

function ensureDistDirs() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
    log(`Created distribution directory: ${DIST_DIR}`);
  }
  if (!fs.existsSync(BUILD_OUTPUT_DIR)) {
    fs.mkdirSync(BUILD_OUTPUT_DIR, { recursive: true });
    log(`Created builds directory: ${BUILD_OUTPUT_DIR}`);
  }
}

function buildWeb(): string[] {
  log('Building web application...');
  try {
    execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
    
    const distPath = path.join(ROOT_DIR, 'dist');
    if (fs.existsSync(distPath)) {
      const webDir = path.join(BUILD_OUTPUT_DIR, 'web');
      if (fs.existsSync(webDir)) {
        fs.rmSync(webDir, { recursive: true });
      }
      fs.cpSync(distPath, webDir, { recursive: true });
      log(`Web build archived to: ${webDir}`);
      return [webDir];
    }
  } catch (e) {
    error(`Failed to build web: ${e}`);
    return [];
  }
  return [];
}

function buildWindows(): string[] {
  log('Building Windows executable...');
  try {
    execSync('npm run electron-build', { cwd: ROOT_DIR, stdio: 'inherit' });
    
    const distPath = path.join(ROOT_DIR, 'dist');
    const windowsDir = path.join(BUILD_OUTPUT_DIR, 'windows');
    
    if (!fs.existsSync(windowsDir)) {
      fs.mkdirSync(windowsDir, { recursive: true });
    }

    // Copy .exe files
    const files: string[] = [];
    if (fs.existsSync(distPath)) {
      const entries = fs.readdirSync(distPath);
      for (const entry of entries) {
        if (entry.endsWith('.exe')) {
          const src = path.join(distPath, entry);
          const dest = path.join(windowsDir, entry);
          fs.copyFileSync(src, dest);
          files.push(dest);
          log(`Copied Windows exe: ${entry}`);
        }
      }
    }
    return files;
  } catch (e) {
    error(`Failed to build Windows: ${e}`);
    return [];
  }
}

function buildDocker(): string[] {
  log('Building Docker image...');
  try {
    execSync('npm run docker-build', { cwd: ROOT_DIR, stdio: 'inherit' });
    
    const dockerDir = path.join(BUILD_OUTPUT_DIR, 'docker');
    if (!fs.existsSync(dockerDir)) {
      fs.mkdirSync(dockerDir, { recursive: true });
    }

    // Export as both TAR and compressed
    const tarFile = path.join(dockerDir, 'conductor-designer.tar');
    const tarGzFile = path.join(dockerDir, 'conductor-designer.tar.gz');

    log('Exporting Docker image as TAR...');
    try {
      execSync(`docker save -o "${tarFile}" conductor-designer:latest`, { stdio: 'inherit' });
      log(`Docker TAR saved: ${tarFile}`);
    } catch (e) {
      error(`Failed to export TAR: ${e}`);
    }

    log('Exporting Docker image as TAR.GZ...');
    try {
      execSync(`docker save conductor-designer:latest | gzip > "${tarGzFile}"`, { 
        stdio: 'inherit',
        shell: '/bin/sh'
      });
      log(`Docker TAR.GZ saved: ${tarGzFile}`);
    } catch (e) {
      error(`Failed to export TAR.GZ: ${e}`);
    }

    return fs.existsSync(tarFile) || fs.existsSync(tarGzFile) 
      ? [tarFile, tarGzFile].filter(f => fs.existsSync(f))
      : [];
  } catch (e) {
    error(`Failed to build Docker: ${e}`);
    return [];
  }
}

function createBuildSummary(buildId: number, artifacts: Record<string, string[]>) {
  const summaryFile = path.join(BUILD_OUTPUT_DIR, `BUILD-${buildId}-SUMMARY.md`);
  const timestamp = new Date().toISOString();
  
  const summary = `# Build Summary

**Build ID**: ${buildId}  
**Build Date**: ${timestamp}  
**Distribution Directory**: ${DIST_DIR}

## Artifacts

### Web Application
${artifacts.web?.map(f => `- ${path.basename(f)}`).join('\n') || 'Not built'}

### Windows Executable
${artifacts.windows?.map(f => `- ${path.basename(f)}`).join('\n') || 'Not built'}

### Docker Images
${artifacts.docker?.map(f => `- ${path.basename(f)}`).join('\n') || 'Not built'}

## Quick Start

### Web Application
Extract the web folder and serve with any HTTP server:
\`\`\`bash
cd builds/web
npx http-server
\`\`\`

### Windows Executable
Run the .exe file directly:
\`\`\`bash
./builds/windows/Conductor-Designer-Setup.exe
\`\`\`

### Docker
Load and run the Docker image:
\`\`\`bash
docker load -i builds/docker/conductor-designer.tar
docker run -d -p 4000:4000 conductor-designer:latest
\`\`\`

## File Structure

\`\`\`
distribution/
├── builds/
│   ├── BUILD-${buildId}-SUMMARY.md
│   ├── web/                      # Web application files
│   ├── windows/                  # Windows .exe installers
│   └── docker/                   # Docker TAR files
└── README.md
\`\`\`
`;

  fs.writeFileSync(summaryFile, summary);
  log(`Build summary created: ${summaryFile}`);
}

function createDistributionREADME() {
  const readmeFile = path.join(DIST_DIR, 'README.md');
  const readme = `# Conductor Designer Distribution

This directory contains all distribution packages for Conductor Designer.

## Directory Structure

\`\`\`
distribution/
├── builds/              # Latest build artifacts
│   ├── web/            # Web application (static files)
│   ├── windows/        # Windows installers (.exe)
│   ├── docker/         # Docker container images (.tar, .tar.gz)
│   └── BUILD-*-SUMMARY.md
└── README.md
\`\`\`

## Latest Build Info

\`\`\`
\`\`\`

See \`builds/BUILD-*-SUMMARY.md\` for the latest build details.

## Installation Options

### Option 1: Web Application
1. Extract \`builds/web\` folder
2. Serve with any HTTP server
3. Access at \`http://localhost:8080\`

### Option 2: Windows Executable
1. Download \`builds/windows/Conductor Designer Setup.exe\`
2. Run the installer
3. Or use portable version for no installation

### Option 3: Docker / Rancher Desktop
1. Download \`builds/docker/conductor-designer.tar.gz\`
2. Load: \`docker load -i conductor-designer.tar.gz\`
3. Run: \`docker run -d -p 4000:4000 conductor-designer:latest\`

## Build Versioning

Each build is tagged with an auto-incrementing Build ID:
- Build ID 1001, 1002, 1003, etc.
- Metadata stored in \`.build-metadata.json\`
- Each build creates a tagged summary in \`builds/\`

## Support

For issues or questions, see the project repository.
`;

  fs.writeFileSync(readmeFile, readme);
  log(`Distribution README created: ${readmeFile}`);
}

async function main() {
  try {
    log('Starting comprehensive distribution build...');
    log(`Root directory: ${ROOT_DIR}`);
    log(`Distribution directory: ${DIST_DIR}`);

    // Ensure directories exist
    ensureDistDirs();

    // Increment build ID
    const buildId = incrementBuildId();
    log(`Building with ID: ${buildId}`);

    // Build all packages
    log('');
    log('=== Building Web Application ===');
    const webArtifacts = buildWeb();

    log('');
    log('=== Building Windows Executable ===');
    const windowsArtifacts = buildWindows();

    log('');
    log('=== Building Docker Image ===');
    const dockerArtifacts = buildDocker();

    // Collect artifacts
    const artifacts = {
      web: webArtifacts,
      windows: windowsArtifacts,
      docker: dockerArtifacts,
    };

    // Create summary
    log('');
    log('=== Creating Build Summary ===');
    createBuildSummary(buildId, artifacts);
    createDistributionREADME();

    // Final summary
    log('');
    log('╔════════════════════════════════════════════╗');
    log('║      BUILD COMPLETED SUCCESSFULLY          ║');
    log('╚════════════════════════════════════════════╝');
    log(`Build ID: ${buildId}`);
    log(`Location: ${BUILD_OUTPUT_DIR}`);
    log(`Web artifacts: ${webArtifacts.length}`);
    log(`Windows artifacts: ${windowsArtifacts.length}`);
    log(`Docker artifacts: ${dockerArtifacts.length}`);
    log('');
    log('Distribution ready for deployment!');
  } catch (e) {
    error(`Build failed: ${e}`);
    process.exit(1);
  }
}

await main();
