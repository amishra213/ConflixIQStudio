import { useCallback, useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { ExecutionSummary, ExecutionDetails, SearchResponse } from '@/services/executionService';

/**
 * Hook for execution service operations
 * Uses the configured GraphQL proxy endpoint from settings store
 * Falls back to direct REST API if proxy is disabled
 */
export function useExecutionService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { proxyServer, conductorApi } = useSettingsStore();

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
   * Fetch detailed execution data from /search-v2 endpoint
   * Used when viewing execution details, showing full payloads and task information
   */
  const fetchExecutionDetails = useCallback(
    async (workflowId: string): Promise<ExecutionDetails> => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = getBaseUrl();

        const url = `${baseUrl}/workflow/search-v2/${workflowId}`;
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
          throw new Error(`Failed to fetch execution details: ${response.statusText}`);
        }

        const data = await response.json();
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
    [getBaseUrl, proxyServer.enabled, proxyServer.conductorApiKey, conductorApi.apiKey]
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
   * Terminate a workflow execution
   */
  const terminateExecution = useCallback(
    async (workflowId: string, reason?: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = getBaseUrl();

        const url = new URL(`${baseUrl}/workflow/${workflowId}/terminate`);
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
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        console.error('Error terminating execution:', errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [getBaseUrl, proxyServer.enabled, proxyServer.conductorApiKey, conductorApi.apiKey]
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
        return data;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        console.error('Error retrying execution:', errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [getBaseUrl, proxyServer.enabled, proxyServer.conductorApiKey, conductorApi.apiKey]
  );

  /**
   * Get execution logs
   */
  const fetchExecutionLogs = useCallback(
    async (workflowId: string): Promise<string> => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = getBaseUrl();

        const url = `${baseUrl}/workflow/${workflowId}/logs`;
        console.log('[ExecutionService] Fetching execution logs from:', url);

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
          throw new Error(`Failed to fetch execution logs: ${response.statusText}`);
        }

        const data = await response.text();
        return data;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        console.error('Error fetching execution logs:', errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [getBaseUrl, proxyServer.enabled, proxyServer.conductorApiKey, conductorApi.apiKey]
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
        const workflowId = await response.text();
        console.log('[ExecutionService] Workflow started successfully. Execution ID:', workflowId);
        return workflowId;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        console.error('Error starting workflow:', errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [getBaseUrl, proxyServer.enabled, proxyServer.conductorApiKey, conductorApi.apiKey]
  );

  return {
    loading,
    error,
    fetchExecutionSummaries,
    fetchExecutionDetails,
    fetchExecutionsByCorrelationId,
    terminateExecution,
    retryExecution,
    fetchExecutionLogs,
    startWorkflow,
  };
}
