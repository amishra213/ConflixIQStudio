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
  clearLogs: () => Promise<void>;
  exportLogs: () => void;
  getFilteredLogs: (filter?: { type?: string; operation?: string; startDate?: Date; endDate?: Date }) => LogEntry[];
  loadPersistedLogs: () => Promise<void>;
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

        const newLog: LogEntry = {
          ...log,
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          timestamp: new Date().toISOString(),
          requestHeaders: loggingSettings.logHeaders ? log.requestHeaders : undefined,
          responseHeaders: loggingSettings.logHeaders ? log.responseHeaders : undefined,
          requestBody: loggingSettings.logBody ? log.requestBody : undefined,
          responseBody: loggingSettings.logBody ? log.responseBody : undefined,
        };

        const updatedLogs = [newLog, ...logs].slice(0, loggingSettings.maxLogEntries);

        const retentionDate = new Date();
        retentionDate.setDate(retentionDate.getDate() - loggingSettings.retentionDays);

        const filteredLogs = updatedLogs.filter(
          (l) => new Date(l.timestamp) > retentionDate
        );

        set({ logs: filteredLogs });

        // Persist logs to IndexedDB
        const persistLogs = async () => {
          const { saveLogsToIndexedDB: save } = await import('../utils/logFileStore');
          await save(filteredLogs);
        };
        persistLogs().catch((err) => console.error('Failed to persist logs:', err));
      },

      clearLogs: async () => {
        // Immediately clear the in-memory state
        set({ logs: [] });
        
        // Then clear from IndexedDB asynchronously
        try {
          const { clearLogsFromIndexedDB: clear } = await import('../utils/logFileStore');
          await clear();
        } catch (error) {
          console.error('Failed to clear logs from IndexedDB:', error);
        }
      },

      exportLogs: () => {
        const { logs } = get();
        const dataStr = JSON.stringify(logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `netflix-conductor-logs-${new Date().toISOString().replaceAll(/[:.]/g, '-')}.json`;
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
          if (filter.operation && !log.operation.toLowerCase().includes(filter.operation.toLowerCase())) return false;
          if (filter.startDate && new Date(log.timestamp) < filter.startDate) return false;
          if (filter.endDate && new Date(log.timestamp) > filter.endDate) return false;
          return true;
        });
      },

      loadPersistedLogs: async () => {
        const { loadLogsFromIndexedDB: load } = await import('../utils/logFileStore');
        const persistedLogs = await load();
        if (persistedLogs && persistedLogs.length > 0) {
          set({ logs: persistedLogs });
        }
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
