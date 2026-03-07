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

/**
 * Structured execution event for enriched LLM context
 */
export interface ExecutionEvent {
  id: string;
  timestamp: string;
  eventType:
    | 'execution_started'
    | 'execution_completed'
    | 'execution_failed'
    | 'execution_terminated'
    | 'execution_paused'
    | 'execution_resumed'
    | 'execution_retried'
    | 'task_failed'
    | 'task_timeout'
    | 'api_error'
    | 'config_change';
  workflowId?: string;
  workflowType?: string;
  taskId?: string;
  taskType?: string;
  status?: string;
  errorMessage?: string;
  reasonForIncompletion?: string;
  details?: Record<string, unknown>;
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
  executionEvents: ExecutionEvent[];
  updateLoggingSettings: (settings: Partial<LoggingSettings>) => void;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  addExecutionEvent: (event: Omit<ExecutionEvent, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  clearExecutionEvents: () => void;
  exportLogs: () => void;
  getFilteredLogs: (filter?: {
    type?: string;
    operation?: string;
    startDate?: Date;
    endDate?: Date;
  }) => LogEntry[];
  /**
   * Returns a compact text snapshot of recent logs + execution events for LLM context injection.
   * @param maxLogs - How many recent API log entries to include (default 30)
   * @param maxEvents - How many recent execution events to include (default 20)
   */
  getLLMContextSnapshot: (maxLogs?: number, maxEvents?: number) => string;
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
      executionEvents: [],

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

      addExecutionEvent: (event) => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2, 9);
        const newEvent: ExecutionEvent = {
          ...event,
          id: `evt_${timestamp}_${random}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          executionEvents: [newEvent, ...state.executionEvents].slice(0, 500),
        }));
      },

      clearLogs: () => {
        set({ logs: [] });
      },

      clearExecutionEvents: () => {
        set({ executionEvents: [] });
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

      getLLMContextSnapshot: (maxLogs = 30, maxEvents = 20) => {
        const { logs, executionEvents } = get();
        const lines: string[] = [];

        // Recent execution events (errors, failures, lifecycle)
        const recentEvents = executionEvents.slice(0, maxEvents);
        if (recentEvents.length > 0) {
          lines.push('=== RECENT EXECUTION EVENTS ===');
          for (const evt of recentEvents) {
            const parts = [`[${evt.timestamp}] ${evt.eventType.toUpperCase()}`];
            if (evt.workflowType) parts.push(`workflow="${evt.workflowType}"`);
            if (evt.workflowId) parts.push(`id=${evt.workflowId.slice(0, 12)}...`);
            if (evt.taskType) parts.push(`task="${evt.taskType}"`);
            if (evt.status) parts.push(`status=${evt.status}`);
            if (evt.errorMessage) parts.push(`error="${evt.errorMessage}"`);
            if (evt.reasonForIncompletion) parts.push(`reason="${evt.reasonForIncompletion}"`);
            lines.push(parts.join(' '));
          }
          lines.push('');
        }

        // Recent error API logs
        const errorLogs = logs.filter((l) => l.type === 'error').slice(0, 10);
        if (errorLogs.length > 0) {
          lines.push('=== RECENT API ERRORS ===');
          for (const log of errorLogs) {
            lines.push(
              `[${log.timestamp}] ${log.method} ${log.url} → ${log.status ?? 'ERR'} ${log.error ?? ''}`
            );
            if (log.responseBody) {
              const body = JSON.stringify(log.responseBody).slice(0, 300);
              lines.push(`  response: ${body}`);
            }
          }
          lines.push('');
        }

        // Recent API calls summary
        const recentLogs = logs.slice(0, maxLogs);
        if (recentLogs.length > 0) {
          lines.push('=== RECENT API CALLS ===');
          for (const log of recentLogs) {
            lines.push(
              `[${log.timestamp}] ${log.type.toUpperCase()} ${log.method} ${log.url}` +
                (log.status ? ` → ${log.status}` : '') +
                (log.duration ? ` (${log.duration}ms)` : '') +
                (log.error ? ` ERROR: ${log.error}` : '')
            );
          }
        }

        return lines.join('\n');
      },
    }),
    {
      name: 'conductor-logging',
      partialize: (state) => ({
        loggingSettings: state.loggingSettings,
        // Don't persist logs or executionEvents - they are runtime data only
      }),
    }
  )
);
