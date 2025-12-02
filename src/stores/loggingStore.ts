import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error';
  operation: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: Record<string, unknown>;
  responseHeaders?: Record<string, string>;
  responseBody?: Record<string, unknown>;
  error?: string;
}

interface LoggingSettings {
  enabled: boolean;
  logRequests: boolean;
  logResponses: boolean;
  logErrors: boolean;
  logHeaders: boolean;
  logBody: boolean;
  maxLogEntries: number;
  retentionDays: number;
}

interface LoggingState {
  loggingSettings: LoggingSettings;
  logs: LogEntry[];
  updateLoggingSettings: (settings: Partial<LoggingSettings>) => void;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  exportLogs: () => void;
  getFilteredLogs: (filter?: {
    type?: string;
    operation?: string;
    startDate?: Date;
    endDate?: Date;
  }) => LogEntry[];
}

const defaultLoggingSettings: LoggingSettings = {
  enabled: true,
  logRequests: true,
  logResponses: true,
  logErrors: true,
  logHeaders: true,
  logBody: true,
  maxLogEntries: 1000,
  retentionDays: 7,
};

export const useLoggingStore = create<LoggingState>()(
  persist(
    (set, get) => ({
      loggingSettings: defaultLoggingSettings,
      logs: [],

      updateLoggingSettings: (settings) => {
        set((state) => ({
          loggingSettings: {
            ...state.loggingSettings,
            ...settings,
          },
        }));
      },

      addLog: (log) => {
        const { loggingSettings, logs } = get();

        if (!loggingSettings.enabled) return;

        if (log.type === 'request' && !loggingSettings.logRequests) return;
        if (log.type === 'response' && !loggingSettings.logResponses) return;
        if (log.type === 'error' && !loggingSettings.logErrors) return;

        // Generate a more unique ID to prevent duplicates
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2, 11);
        const uniqueId = `log_${timestamp}_${random}_${Math.floor(Math.random() * 10000)}`;

        const newLog: LogEntry = {
          ...log,
          id: uniqueId,
          timestamp: new Date().toISOString(),
          requestHeaders: loggingSettings.logHeaders ? log.requestHeaders : undefined,
          responseHeaders: loggingSettings.logHeaders ? log.responseHeaders : undefined,
          requestBody: loggingSettings.logBody ? log.requestBody : undefined,
          responseBody: loggingSettings.logBody ? log.responseBody : undefined,
        };

        // Check for duplicate entries (same operation, method, url, type within 100ms)
        const isDuplicate = logs.some(
          (existingLog) =>
            existingLog.type === newLog.type &&
            existingLog.operation === newLog.operation &&
            existingLog.method === newLog.method &&
            existingLog.url === newLog.url &&
            Math.abs(
              new Date(existingLog.timestamp).getTime() - new Date(newLog.timestamp).getTime()
            ) < 100
        );

        if (isDuplicate) {
          console.debug('Skipping duplicate log entry:', newLog.operation, newLog.type);
          return;
        }

        const updatedLogs = [newLog, ...logs].slice(0, loggingSettings.maxLogEntries);

        const retentionDate = new Date();
        retentionDate.setDate(retentionDate.getDate() - loggingSettings.retentionDays);

        const filteredLogs = updatedLogs.filter((l) => new Date(l.timestamp) > retentionDate);

        set({ logs: filteredLogs });
      },

      clearLogs: () => {
        set({ logs: [] });
      },

      exportLogs: () => {
        const { logs } = get();
        const dataStr = JSON.stringify(logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
        link.download = `netflix-conductor-logs-${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      },

      getFilteredLogs: (filter) => {
        const { logs } = get();

        if (!filter) return logs;

        return logs.filter((log) => {
          if (filter.type && log.type !== filter.type) return false;
          if (
            filter.operation &&
            !log.operation.toLowerCase().includes(filter.operation.toLowerCase())
          )
            return false;
          if (filter.startDate && new Date(log.timestamp) < filter.startDate) return false;
          if (filter.endDate && new Date(log.timestamp) > filter.endDate) return false;
          return true;
        });
      },
    }),
    {
      name: 'conductor-logging',
      partialize: (state) => ({
        loggingSettings: state.loggingSettings,
        // Don't persist logs - they are runtime data only
      }),
    }
  )
);
