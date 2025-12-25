import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Logging Framework for ConflixIQ Studio
 * Provides structured logging with multiple levels: DEBUG, INFO, WARN, ERROR
 * Supports both file and console output with configurable log levels
 */

// Log Levels enum
const LogLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// ANSI color codes for console output
const Colors = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m', // Green
  WARN: '\x1b[33m', // Yellow
  ERROR: '\x1b[31m', // Red
  RESET: '\x1b[0m',
  TIMESTAMP: '\x1b[90m', // Gray
  BOLD: '\x1b[1m',
};

// Configuration
const LOG_FOLDER =
  process.env.LOGS_PATH || process.env.VITE_LOG_FOLDER || path.join(process.cwd(), 'logs');
const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
const CONSOLE_OUTPUT = process.env.LOG_CONSOLE !== 'false'; // Default: true
const FILE_OUTPUT = process.env.LOG_FILE !== 'false'; // Default: true
const MAX_LOG_SIZE = Number.parseInt(process.env.LOG_MAX_SIZE || '10485760', 10); // 10MB default
const LOG_RETENTION_DAYS = Number.parseInt(process.env.LOG_RETENTION || '7', 10);

// Parse log level from environment
let currentLogLevel = LogLevels[LOG_LEVEL.toUpperCase()] ?? LogLevels.INFO;

// Track if folder creation was attempted
let folderEnsured = false;
let folderCreationError = null;

/**
 * Ensure log folder exists
 */
async function ensureLogFolder() {
  if (folderEnsured) return;

  try {
    await fs.mkdir(LOG_FOLDER, { recursive: true });
    folderEnsured = true;
  } catch (err) {
    folderCreationError = err;
    console.error('[Logger] Failed to create log folder:', err.message);
  }
}

/**
 * Get current log file path (daily rotation)
 */
function getLogFilePath() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOG_FOLDER, `conflixiq-studio-${dateStr}.log`);
}

/**
 * Format message parts for logging
 */
function formatMessage(parts) {
  return parts
    .map((p) => {
      if (typeof p === 'string') return p;
      if (p instanceof Error) return `${p.name}: ${p.message}`;
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    })
    .join(' ');
}

/**
 * Format log entry with timestamp and level
 */
function formatLogEntry(level, message) {
  const ts = new Date().toISOString();
  return `${ts} [${level.toUpperCase().padEnd(5)}] ${message}`;
}

/**
 * Format log entry for console with colors
 */
function formatConsoleEntry(level, message) {
  const ts = new Date().toISOString();
  const color = Colors[level.toUpperCase()] || Colors.RESET;
  return `${Colors.TIMESTAMP}${ts}${Colors.RESET} ${color}${Colors.BOLD}[${level.toUpperCase().padEnd(5)}]${Colors.RESET} ${message}`;
}

/**
 * Check if log file needs rotation (size-based)
 */
async function checkLogRotation(filePath) {
  try {
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_LOG_SIZE) {
      const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
      const rotatedPath = `${filePath}.${timestamp}`;
      await fs.rename(filePath, rotatedPath);
      return true;
    }
    return false;
  } catch (err) {
    // File doesn't exist yet, no rotation needed
    console.error('[Logger] Error checking log rotation:', err.message);
    return false;
  }
}

/**
 * Clean up old log files based on retention policy
 */
async function cleanupOldLogs() {
  if (!folderEnsured) return;

  try {
    const files = await fs.readdir(LOG_FOLDER);
    const now = Date.now();
    const retentionMs = LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (!file.startsWith('conflixiq-studio-')) continue;

      const filePath = path.join(LOG_FOLDER, file);
      try {
        const stats = await fs.stat(filePath);
        if (now - stats.mtimeMs > retentionMs) {
          await fs.unlink(filePath);
        }
      } catch (err) {
        // Log cleanup error but continue with other files
        console.error('[Logger] Error deleting old log file:', err.message);
      }
    }
  } catch (err) {
    // Log cleanup failure but continue operation
    console.error('[Logger] Error cleaning up old logs:', err.message);
  }
}

/**
 * Write log to file
 */
async function writeToFile(level, message) {
  if (!FILE_OUTPUT) return;

  try {
    await ensureLogFolder();
    const filePath = getLogFilePath();

    // Check for rotation
    await checkLogRotation(filePath);

    // Write log entry
    const line = `${formatLogEntry(level, message)}\n`;
    await fs.appendFile(filePath, line, { encoding: 'utf8' });

    // Cleanup old logs periodically (every 100 logs)
    if (Math.random() < 0.01) {
      await cleanupOldLogs();
    }
  } catch (err) {
    console.error('[Logger] Failed to write log file:', err.message);
  }
}

/**
 * Write log to console
 */
function writeToConsole(level, message) {
  if (!CONSOLE_OUTPUT) return;

  const consoleMessage = formatConsoleEntry(level, message);
  const method = level.toLowerCase();

  // Use appropriate console method
  if (console[method]) {
    console[method](consoleMessage);
  } else {
    console.log(consoleMessage);
  }
}

/**
 * Main logging function
 */
async function log(level, ...parts) {
  const levelNum = LogLevels[level.toUpperCase()];

  // Check if log level should be output
  if (levelNum < currentLogLevel) {
    return;
  }

  const message = formatMessage(parts);

  // Output to console
  writeToConsole(level, message);

  // Output to file
  await writeToFile(level, message);
}

/**
 * Synchronous version for error handling
 */
function logSync(level, ...parts) {
  const levelNum = LogLevels[level.toUpperCase()];

  // Check if log level should be output
  if (levelNum < currentLogLevel) {
    return;
  }

  const message = formatMessage(parts);

  // Output to console only (sync)
  writeToConsole(level, message);

  // Note: Async file write will happen, but we don't wait for it
  writeToFile(level, message).catch(console.error);
}

/**
 * Set log level dynamically
 */
export function setLogLevel(level) {
  const levelNum = LogLevels[level.toUpperCase()];
  if (levelNum !== undefined) {
    currentLogLevel = levelNum;
    logSync('info', `Log level set to ${level}`);
  }
}

/**
 * Get current log level
 */
export function getLogLevel() {
  return Object.keys(LogLevels).find((key) => LogLevels[key] === currentLogLevel);
}

/**
 * Get logger statistics
 */
export function getLoggerStats() {
  return {
    logLevel: getLogLevel(),
    logFolder: LOG_FOLDER,
    folderCreated: folderEnsured,
    folderError: folderCreationError?.message || null,
    consoleOutput: CONSOLE_OUTPUT,
    fileOutput: FILE_OUTPUT,
    maxLogSize: MAX_LOG_SIZE,
    retentionDays: LOG_RETENTION_DAYS,
  };
}

/**
 * Server Logger - Main export
 */
export const serverLogger = {
  debug: (...parts) => log('DEBUG', ...parts),
  info: (...parts) => log('INFO', ...parts),
  warn: (...parts) => log('WARN', ...parts),
  error: (...parts) => log('ERROR', ...parts),

  // Synchronous versions (for critical errors during shutdown)
  debugSync: (...parts) => logSync('DEBUG', ...parts),
  infoSync: (...parts) => logSync('INFO', ...parts),
  warnSync: (...parts) => logSync('WARN', ...parts),
  errorSync: (...parts) => logSync('ERROR', ...parts),

  // Utility methods
  setLevel: setLogLevel,
  getLevel: getLogLevel,
  getStats: getLoggerStats,
};
