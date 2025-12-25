#!/usr/bin/env node

// Get filesystem and path utilities
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Determine application directory
// In SEA context, __dirname is the bundle root where all files are embedded
const appDir = process.cwd();
console.log('[Launcher] Application directory:', appDir);
console.log('[Launcher] Current working directory:', process.cwd());
console.log('[Launcher] Node.js executable:', process.execPath);

// Create runtime directories in the application directory (makes it portable)
const filestoreDir = path.join(appDir, '.filestore');
const logsDir = path.join(appDir, 'logs');

try {
  if (!fs.existsSync(filestoreDir)) {
    fs.mkdirSync(filestoreDir, { recursive: true });
    console.log('[Launcher] Created .filestore directory at', filestoreDir);
  }
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('[Launcher] Created logs directory at', logsDir);
  }
} catch (e) {
  console.error('[Launcher] Error creating directories:', e.message);
}

// Set up environment variables
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '4000';
process.env.FILESTORE_PATH = filestoreDir;
process.env.LOGS_PATH = logsDir;

console.log('[Launcher] Starting ConflixIQ Studio...');
console.log('[Launcher] File store:', filestoreDir);
console.log('[Launcher] Logs directory:', logsDir);

// In SEA context, we can directly require the embedded index.js
// since it's compiled into the bundle
async function startServer() {
  try {
    // For CommonJS modules (like index.js), we can require directly
    // But since index.js uses ES modules (import statements),
    // we need to use dynamic import with proper URL handling
    
    // Method 1: Try to require index.js directly (works if it's bundled as CommonJS)
    console.log('[Launcher] Attempting to load index module...');
    
    // Create a dynamic import using the embedded file URL
    // In SEA context, require resolves relative to __dirname (the bundle root)
    const indexPath = path.join(appDir, 'index.js');
    const indexUrl = pathToFileURL(indexPath).href;
    
    console.log('[Launcher] Index path:', indexPath);
    console.log('[Launcher] Index URL:', indexUrl);
    
    // Use dynamic import to handle ES modules
    await import(indexUrl);
    console.log('[Launcher] Successfully loaded index module');
    
    // Give the server time to start before opening browser
    const port = process.env.PORT || 4000;
    const url = `http://localhost:${port}`;
    
    setTimeout(() => {
      console.log('[Launcher] Opening browser at', url);
      
      if (process.platform === 'win32') {
        exec(`start ${url}`).on('error', (e) => {
          console.log('[Launcher] Could not open browser:', e.message);
        });
      } else if (process.platform === 'darwin') {
        exec(`open ${url}`).on('error', (e) => {
          console.log('[Launcher] Could not open browser:', e.message);
        });
      } else {
        exec(`xdg-open ${url}`).on('error', (e) => {
          console.log('[Launcher] Could not open browser:', e.message);
        });
      }
    }, 2000);
    
  } catch (err) {
    console.error('[Launcher] Failed to start application:', err);
    console.error('[Launcher] Stack trace:', err.stack);
    process.exit(1);
  }
}

// Start the server
await startServer();
