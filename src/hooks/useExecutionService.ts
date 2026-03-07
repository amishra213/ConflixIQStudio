import { useCallback, useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { ExecutionSummary, ExecutionDetails, SearchResponse, TaskLog } from '@/services/executionService';
import { useLoggingStore } from '@/stores/loggingStore';

/**
 * Hook for execution service operations
 * Uses the configured GraphQL proxy endpoint from settings store
 * Falls back to direct REST API if proxy is disabled
 */
export function useExecutionService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { proxyServer, conductorApi } = useSettingsStore();
  const addExecutionEvent = useLoggingStore.getState().addExecutionEvent;

  // Get the base URL
  // When proxy is enabled: use relative /api path (Vite dev server handles proxying to backend)
  // When proxy is disabled: use configured conductor API endpoint
  const getBaseUrl = useCallback(() => {
    if (proxyServer.enabled) {
      // Use relative path - Vite dev server proxy will route this to the backend
      // See vite.config.ts for proxy configuration
      return '/api';
    }
    return conductorApi.endpoint || '/api';
  }, [proxyServer, conductorApi]);

  /**
   * Fetch execution summary list from /search endpoint
   * Used for populating the executions table with lightweight data
   */
  const fetchExecutionSummaries = useCallback(
    async (
      workflowType?: string,
      status?: string,
      start: number = 0,
      size: number = 50
    ): Promise<SearchResponse<ExecutionSummary>> => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = getBaseUrl();

        const params = new URLSearchParams();
        params.append('start', start.toString());
        params.append('size', size.toString());

        if (workflowType) {
          params.append('workflowType', workflowType);
        }
        if (status) {
          params.append('status', status);
        }

        const url = `${baseUrl}/workflow/search?${params.toString()}`;
        console.log('[ExecutionService] Fetching execution summaries from:', url);

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (proxyServer.enabled && proxyServer.conductorApiKey) {
          headers['X-Conductor-API-Key'] = proxyServer.conductorApiKey;
        } else if (conductorApi.apiKey) {
          headers['X-Conductor-API-Key'] = conductorApi.apiKey;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          throw new Error(`Failed to fetch executions: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        console.error('Error fetching execution summaries:', errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [getBaseUrl, proxyServer.enabled, proxyServer.conductorApiKey, conductorApi.apiKey]
  );

  /**
   * Fetch detailed execution data from /api/workflow/{workflowId}
   * Standard Conductor endpoint. Retries up to 3 times on 404 to handle
   * cases where execution details aren't immediately available after start.
   */
  const fetchExecutionDetails = useCallback(
    async (workflowId: string, retries = 3): Promise<ExecutionDetails> => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = getBaseUrl();

        const url = `${baseUrl}/workflow/${workflowId}`;
        console.log('[ExecutionService] Fetching execution details from:', url);

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (proxyServer.enabled && proxyServer.conductorApiKey) {
          headers['X-Conductor-API-Key'] = proxyServer.conductorApiKey;
        } else if (conductorApi.apiKey) {
          headers['X-Conductor-API-Key'] = conductorApi.apiKey;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          // If execution not found (404) and we have retries left, wait and retry
          if (response.status === 404 && retries > 0) {
            console.warn(
              `[ExecutionService] Execution details not yet available (404). Retrying in 1 second... (${retries} retries left)`
            );
            // Wait 1 second before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return fetchExecutionDetails(workflowId, retries - 1);
          }
          throw new Error(`Failed to fetch execution details: ${response.statusText}`);
        }

        const data: ExecutionDetails = await response.json();

        // Capture execution events for FAILED/TIMED_OUT/TERMINATED for LLM context
        if (['FAILED', 'TIMED_OUT', 'TERMINATED'].includes(data.status)) {
          const failedTasks = (data.tasks ?? [])
            .filter((t) => ['FAILED', 'TIMED_OUT'].includes(t.status))
            .slice(0, 5);
          addExecutionEvent({
            eventType: data.status === 'FAILED' ? 'execution_failed' : 'execution_terminated',
            workflowId: data.workflowId,
            workflowType: data.workflowType,
            status: data.status,
            reasonForIncompletion: data.reasonForIncompletion,
            details: {
              failedTasks: failedTasks.map((t) => ({
                taskType: t.taskType,
                ref: t.referenceTaskName,
                reason: t.reasonForIncompletion,
                status: t.status,
              })),
            },
          });
        }

        return data;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        console.error('Error fetching execution details:', errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [getBaseUrl, proxyServer.enabled, proxyServer.conductorApiKey, conductorApi.apiKey, addExecutionEvent]
  );

  /**
   * Fetch executions by correlation ID
   */
  const fetchExecutionsByCorrelationId = useCallback(
    async (
      correlationId: string,
      start: number = 0,
      size: number = 50
    ): Promise<SearchResponse<ExecutionSummary>> => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = getBaseUrl();

        const params = new URLSearchParams();
        params.append('correlationId', correlationId);
        params.append('start', start.toString());
        params.append('size', size.toString());

        const url = `${baseUrl}/workflow/search?${params.toString()}`;
        console.log('[ExecutionService] Fetching executions by correlation ID from:', url);

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (proxyServer.enabled && proxyServer.conductorApiKey) {
          headers['X-Conductor-API-Key'] = proxyServer.conductorApiKey;
        } else if (conductorApi.apiKey) {
          headers['X-Conductor-API-Key'] = conductorApi.apiKey;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          throw new Error(`Failed to fetch executions by correlation ID: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        console.error('Error fetching executions by correlation ID:', errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [getBaseUrl, proxyServer.enabled, proxyServer.conductorApiKey, conductorApi.apiKey]
  );

  /**
   * Terminate a running workflow execution
   * Standard Conductor endpoint: DELETE /api/workflow/{workflowId}?reason=...
   */
  const terminateExecution = useCallback(
    async (workflowId: string, reason?: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = getBaseUrl();

        const url = new URL(`${baseUrl}/workflow/${workflowId}`, globalThis.location?.origin ?? 'http://localhost');
        if (reason) {
          url.searchParams.append('reason', reason);
        }

        console.log('[ExecutionService] Terminating execution at:', url.toString());

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (proxyServer.enabled && proxyServer.conductorApiKey) {
          headers['X-Conductor-API-Key'] = proxyServer.conductorApiKey;
        } else if (conductorApi.apiKey) {
          headers['X-Conductor-API-Key'] = conductorApi.apiKey;
        }

        const response = await fetch(url.toString(), {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to terminate execution: ${response.statusText}`);
        }
        addExecutionEvent({ eventType: 'execution_terminated', workflowId, status: 'TERMINATED' });
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        addExecutionEvent({ eventType: 'api_error', workflowId, errorMessage: errorObj.message });
        setError(errorObj);
        console.error('Error terminating execution:', errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [getBaseUrl, proxyServer.enabled, proxyServer.conductorApiKey, conductorApi.apiKey, addExecutionEvent]
  );

  /**
   * Retry a failed workflow execution
   */
  const retryExecution = useCallback(
    async (workflowId: string): Promise<string> => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = getBaseUrl();

        const url = `${baseUrl}/workflow/${workflowId}/retry`;
        console.log('[ExecutionService] Retrying execution at:', url);

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (proxyServer.enabled && proxyServer.conductorApiKey) {
          headers['X-Conductor-API-Key'] = proxyServer.conductorApiKey;
        } else if (conductorApi.apiKey) {
          headers['X-Conductor-API-Key'] = conductorApi.apiKey;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to retry execution: ${response.statusText}`);
        }

        const data = await response.text();
        addExecutionEvent({ eventType: 'execution_retried', workflowId, status: 'RUNNING' });
        return data;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        addExecutionEvent({ eventType: 'api_error', workflowId, errorMessage: errorObj.message });
        setError(errorObj);
        console.error('Error retrying execution:', errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [getBaseUrl, proxyServer.enabled, proxyServer.conductorApiKey, conductorApi.apiKey, addExecutionEvent]
  );

  /**
   * Fetch log entries for a single task
   * Standard Conductor endpoint: GET /api/tasks/{taskId}/log
   */
  const fetchTaskLogs = useCallback(
    async (taskId: string): Promise<TaskLog[]> => {
      try {
        const baseUrl = getBaseUrl();
        const headers: HeadersInit = {};
        if (proxyServer.enabled && proxyServer.conductorApiKey) {
          headers['X-Conductor-API-Key'] = proxyServer.conductorApiKey;
        } else if (conductorApi.apiKey) {
          headers['X-Conductor-API-Key'] = conductorApi.apiKey;
        }

        const response = await fetch(`${baseUrl}/tasks/${taskId}/log`, { headers });
        if (response.status === 404) return [];
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    [getBaseUrl, proxyServer.enabled, proxyServer.conductorApiKey, conductorApi.apiKey]
  );

  /**
   * Aggregate logs across all tasks of a workflow execution.
   * Conductor stores logs per-task via GET /api/tasks/{taskId}/log.
   * @param execution - Full ExecutionDetails object with tasks array
   */
  const fetchExecutionLogs = useCallback(
    async (execution: ExecutionDetails): Promise<string> => {
      try {
        setLoading(true);
        setError(null);

        if (!execution.tasks || execution.tasks.length === 0) {
          return '[No tasks found in this execution]';
        }

        console.log(`[ExecutionService] Fetching task logs for ${execution.tasks.length} tasks`);

        const taskLogResults = await Promise.all(
          execution.tasks.map(async (task) => {
            const logs = await fetchTaskLogs(task.taskId);
            return { task, logs };
          })
        );

        const allEntries: Array<{ time: number; line: string }> = [];
        for (const { task, logs } of taskLogResults) {
          for (const entry of logs) {
            allEntries.push({
              time: entry.createdTime,
              line: `[${new Date(entry.createdTime).toISOString()}] [${task.referenceTaskName}] ${entry.log}`,
            });
          }
        }

        allEntries.sort((a, b) => a.time - b.time);

        if (allEntries.length === 0) {
          return '[No task log entries found. Workers must explicitly add logs via POST /api/tasks/{taskId}/log]';
        }

        return allEntries.map((e) => e.line).join('\n');
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        console.error('Error fetching execution logs:', errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [fetchTaskLogs]
  );

  /**
   * Pause a running workflow execution
   * Standard Conductor endpoint: PUT /api/workflow/{workflowId}/pause
   */
  const pauseExecution = useCallback(
    async (workflowId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = getBaseUrl();
        const headers: HeadersInit = {};
        if (proxyServer.enabled && proxyServer.conductorApiKey) {
          headers['X-Conductor-API-Key'] = proxyServer.conductorApiKey;
        } else if (conductorApi.apiKey) {
          headers['X-Conductor-API-Key'] = conductorApi.apiKey;
        }

        console.log('[ExecutionService] Pausing execution:', workflowId);
        const response = await fetch(`${baseUrl}/workflow/${workflowId}/pause`, {
          method: 'PUT',
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to pause execution: ${response.statusText}`);
        }
        addExecutionEvent({ eventType: 'execution_paused', workflowId, status: 'PAUSED' });
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        addExecutionEvent({ eventType: 'api_error', workflowId, errorMessage: errorObj.message });
        setError(errorObj);
        console.error('Error pausing execution:', errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [getBaseUrl, proxyServer.enabled, proxyServer.conductorApiKey, conductorApi.apiKey, addExecutionEvent]
  );

  /**
   * Resume a paused workflow execution
   * Standard Conductor endpoint: PUT /api/workflow/{workflowId}/resume
   */
  const resumeExecution = useCallback(
    async (workflowId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = getBaseUrl();
        const headers: HeadersInit = {};
        if (proxyServer.enabled && proxyServer.conductorApiKey) {
          headers['X-Conductor-API-Key'] = proxyServer.conductorApiKey;
        } else if (conductorApi.apiKey) {
          headers['X-Conductor-API-Key'] = conductorApi.apiKey;
        }

        console.log('[ExecutionService] Resuming execution:', workflowId);
        const response = await fetch(`${baseUrl}/workflow/${workflowId}/resume`, {
          method: 'PUT',
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to resume execution: ${response.statusText}`);
        }
        addExecutionEvent({ eventType: 'execution_resumed', workflowId, status: 'RUNNING' });
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        addExecutionEvent({ eventType: 'api_error', workflowId, errorMessage: errorObj.message });
        setError(errorObj);
        console.error('Error resuming execution:', errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [getBaseUrl, proxyServer.enabled, proxyServer.conductorApiKey, conductorApi.apiKey, addExecutionEvent]
  );

  /**
   * Restart a completed or terminated workflow execution from the beginning
   * Standard Conductor endpoint: POST /api/workflow/{workflowId}/restart
   */
  const restartExecution = useCallback(
    async (workflowId: string, useLatestDefinitions: boolean = false): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = getBaseUrl();
        const headers: HeadersInit = {};
        if (proxyServer.enabled && proxyServer.conductorApiKey) {
          headers['X-Conductor-API-Key'] = proxyServer.conductorApiKey;
        } else if (conductorApi.apiKey) {
          headers['X-Conductor-API-Key'] = conductorApi.apiKey;
        }

        const url = `${baseUrl}/workflow/${workflowId}/restart?useLatestDefinitions=${useLatestDefinitions}`;
        console.log('[ExecutionService] Restarting execution:', workflowId);

        const response = await fetch(url, {
          method: 'POST',
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to restart execution: ${response.statusText}`);
        }
        addExecutionEvent({ eventType: 'execution_started', workflowId, status: 'RUNNING', details: { action: 'restart' } });
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        addExecutionEvent({ eventType: 'api_error', workflowId, errorMessage: errorObj.message });
        setError(errorObj);
        console.error('Error restarting execution:', errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [getBaseUrl, proxyServer.enabled, proxyServer.conductorApiKey, conductorApi.apiKey, addExecutionEvent]
  );

  /**
   * Start a new workflow execution using StartWorkflowRequest
   * @param workflowName - Name of the workflow to execute
   * @param workflowVersion - Version of the workflow (optional)
   * @param input - Input payload for the workflow
   * @param correlationId - Optional correlation identifier
   * @returns Promise<string> - Returns the execution/workflow ID
   */
  const startWorkflow = useCallback(
    async (
      workflowName: string,
      input: Record<string, unknown>,
      workflowVersion?: number,
      correlationId?: string
    ): Promise<string> => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = getBaseUrl();

        const url = `${baseUrl}/workflow`;
        
        // Build StartWorkflowRequest
        const startRequest = {
          name: workflowName,
          version: workflowVersion || 1, // Default to version 1 if not specified
          input: input,
          ...(correlationId && { correlationId }),
        };

        console.log('[ExecutionService] Starting workflow at:', url, 'with request:', startRequest);

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (proxyServer.enabled && proxyServer.conductorApiKey) {
          headers['X-Conductor-API-Key'] = proxyServer.conductorApiKey;
        } else if (conductorApi.apiKey) {
          headers['X-Conductor-API-Key'] = conductorApi.apiKey;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(startRequest),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[ExecutionService] Failed to start workflow:', response.status, errorText);
          throw new Error(`Failed to start workflow: ${response.statusText}`);
        }

        // Conductor returns the workflow ID as plain text
        const newWorkflowId = await response.text();
        console.log('[ExecutionService] Workflow started successfully. Execution ID:', newWorkflowId);
        addExecutionEvent({
          eventType: 'execution_started',
          workflowId: newWorkflowId,
          workflowType: workflowName,
          status: 'RUNNING',
        });
        return newWorkflowId;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        addExecutionEvent({
          eventType: 'api_error',
          workflowType: workflowName,
          errorMessage: errorObj.message,
        });
        setError(errorObj);
        console.error('Error starting workflow:', errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [getBaseUrl, proxyServer.enabled, proxyServer.conductorApiKey, conductorApi.apiKey, addExecutionEvent]
  );

  return {
    loading,
    error,
    fetchExecutionSummaries,
    fetchExecutionDetails,
    fetchExecutionsByCorrelationId,
    terminateExecution,
    pauseExecution,
    resumeExecution,
    restartExecution,
    retryExecution,
    fetchTaskLogs,
    fetchExecutionLogs,
    startWorkflow,
  };
}
