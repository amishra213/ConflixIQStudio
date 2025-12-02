import fs from 'node:fs/promises';
import path from 'node:path';

// Determine log folder from env (VITE_LOG_FOLDER) or default ./logs
const LOG_FOLDER = process.env.VITE_LOG_FOLDER || path.join(process.cwd(), 'logs');

async function ensureLogFolder() {
  try {
    await fs.mkdir(LOG_FOLDER, { recursive: true });
  } catch (err) {
    // If we cannot create the folder, fall back to console
    console.error('server-logger: failed to ensure log folder', err);
  }
}

function getLogFilePath() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOG_FOLDER, `conductor-designer-${dateStr}.log`);
}

async function writeLog(level, ...parts) {
  try {
    await ensureLogFolder();
    const filePath = getLogFilePath();
    const ts = new Date().toISOString();
    const message = parts
      .map((p) => {
        try {
          return typeof p === 'string' ? p : JSON.stringify(p);
        } catch {
          return String(p);
        }
      })
      .join(' ');
    const line = `${ts} [${level.toUpperCase()}] ${message}\n`;
    await fs.appendFile(filePath, line, { encoding: 'utf8' });
  } catch (err) {
    // If file logging fails, fallback to console (best-effort)
    console.error('server-logger write error:', err);
    console[level] && console[level](...parts);
  }
}

export const serverLogger = {
  info: (...parts) => writeLog('info', ...parts),
  error: (...parts) => writeLog('error', ...parts),
  warn: (...parts) => writeLog('warn', ...parts),
  debug: (...parts) => writeLog('debug', ...parts),
};
