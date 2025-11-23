/**
 * Log File Store Utility
 * Handles saving and loading logs from the file system
 * Uses IndexedDB as fallback for browser-based persistence
 */

import type { LogEntry } from '@/stores/loggingStore';

const LOG_STORE_NAME = 'conductor-logs-store';
const LOG_DB_NAME = 'conductor-logs-db';
const LOG_DB_VERSION = 1;

interface StoredLogFile {
  timestamp: string;
  logs: LogEntry[];
}

/**
 * Get the configured log folder path (from environment or default)
 */
export function getLogFolderPath(): string {
  return import.meta.env.VITE_LOG_FOLDER || './logs';
}

/**
 * Helper: Open IndexedDB connection
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOG_DB_NAME, LOG_DB_VERSION);

    request.onerror = () => {
      reject(new Error(request.error?.message || 'Failed to open IndexedDB'));
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(LOG_STORE_NAME)) {
        db.createObjectStore(LOG_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

/**
 * Save logs to IndexedDB (browser fallback when file system access is not available)
 */
export async function saveLogsToIndexedDB(logs: LogEntry[]): Promise<boolean> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(LOG_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(LOG_STORE_NAME);

    // Clear existing logs
    const clearRequest = store.clear();

    return new Promise((resolve) => {
      clearRequest.onsuccess = () => {
        // Add new logs using for...of
        for (const log of logs) {
          store.add(log);
        }

        transaction.oncomplete = () => {
          db.close();
          resolve(true);
        };

        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
          resolve(false);
        };
      };

      clearRequest.onerror = () => {
        console.error('Error clearing logs:', clearRequest.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Error saving logs to IndexedDB:', error);
    return false;
  }
}

/**
 * Load logs from IndexedDB
 */
export async function loadLogsFromIndexedDB(): Promise<LogEntry[]> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(LOG_STORE_NAME, 'readonly');
    const store = transaction.objectStore(LOG_STORE_NAME);
    const getAllRequest = store.getAll();

    return new Promise((resolve) => {
      getAllRequest.onsuccess = () => {
        const logs = getAllRequest.result as LogEntry[];
        db.close();
        resolve(logs);
      };

      getAllRequest.onerror = () => {
        console.error('Error getting logs from IndexedDB:', getAllRequest.error);
        resolve([]);
      };
    });
  } catch (error) {
    console.error('Error loading logs from IndexedDB:', error);
    return [];
  }
}

/**
 * Clear all logs from IndexedDB
 */
export async function clearLogsFromIndexedDB(): Promise<boolean> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(LOG_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(LOG_STORE_NAME);
    const clearRequest = store.clear();

    return new Promise((resolve) => {
      clearRequest.onsuccess = () => {
        db.close();
        resolve(true);
      };

      clearRequest.onerror = () => {
        console.error('Error clearing logs from IndexedDB:', clearRequest.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Error clearing logs from IndexedDB:', error);
    return false;
  }
}

/**
 * Export logs as a JSON file with timestamp
 */
export function exportLogsAsFile(logs: LogEntry[]): void {
  const data: StoredLogFile = {
    timestamp: new Date().toISOString(),
    logs,
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `netflix-conductor-logs-${new Date().toISOString().replaceAll(/[:.]/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Import logs from a JSON file
 */
export async function importLogsFromFile(file: File): Promise<LogEntry[]> {
  const content = await file.text();
  const data = JSON.parse(content) as StoredLogFile;

  if (Array.isArray(data.logs)) {
    return data.logs;
  }
  if (Array.isArray(data)) {
    // Support direct array format
    return data as LogEntry[];
  }
  throw new Error('Invalid log file format');
}
