import { useState, useCallback } from 'react';
import { WorkflowDefinition, WorkflowExecution } from '@/utils/workflowToMermaid';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { APILogger } from '@/utils/apiLogger';
import type { TaskDefinition } from '@/types/taskDefinition';

interface UseConductorApiOptions {
  enableFallback?: boolean;
}

export function useConductorApi(options: UseConductorApiOptions = {}) {
  const { enableFallback = true } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { workflows } = useWorkflowStore();
  const { conductorApi, proxyServer } = useSettingsStore();

  // Use GraphQL proxy if enabled, otherwise use direct API
  const baseUrl = proxyServer.enabled && proxyServer.proxyEndpoint
    ? proxyServer.proxyEndpoint
    : conductorApi.endpoint || '/api';
  const apiKey = proxyServer.enabled ? proxyServer.conductorApiKey : conductorApi.apiKey;

  const fetchWorkflowByName = useCallback(async (name: string): Promise<WorkflowDefinition | null> => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (apiKey) {
        headers['X-Conductor-API-Key'] = apiKey;
      }
      const response = await fetch(`${baseUrl}/metadata/workflow/${name}`, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.warn('API fetch failed, attempting fallback to local store:', err);
      setError(err as Error);
      
      if (enableFallback) {
        const localWorkflow = workflows.find(w => w.name === name);
        if (localWorkflow) {
          console.log('Using local workflow from Zustand store');
          const { localWorkflowToConductor } = await import('@/utils/workflowToMermaid');
          return localWorkflowToConductor(localWorkflow);
        }
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey, enableFallback, workflows]);

  const fetchWorkflowByVersion = useCallback(async (
    name: string,
    version: number
  ): Promise<WorkflowDefinition | null> => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (apiKey) {
        headers['X-Conductor-API-Key'] = apiKey;
      }
      // Conductor API uses query parameter for version
      const response = await fetch(`${baseUrl}/metadata/workflow/${name}?version=${version}`, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.warn('API fetch failed, attempting fallback to local store:', err);
      setError(err as Error);
      
      if (enableFallback) {
        const localWorkflow = workflows.find(w => w.name === name);
        if (localWorkflow) {
          console.log('Using local workflow from Zustand store (version ignored)');
          const { localWorkflowToConductor } = await import('@/utils/workflowToMermaid');
          return localWorkflowToConductor(localWorkflow);
        }
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey, enableFallback, workflows]);

  const fetchAllWorkflows = useCallback(async (): Promise<WorkflowDefinition[]> => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (apiKey) {
        headers['X-Conductor-API-Key'] = apiKey;
      }
      const response = await fetch(`${baseUrl}/metadata/workflow`, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.warn('API fetch failed, attempting fallback to local store:', err);
      setError(err as Error);
      
      if (enableFallback) {
        console.log('Using local workflows from Zustand store');
        const { localWorkflowToConductor } = await import('@/utils/workflowToMermaid');
        return workflows.map(w => localWorkflowToConductor(w));
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey, enableFallback, workflows]);

  const fetchExecution = useCallback(async (workflowId: string): Promise<WorkflowExecution | null> => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (apiKey) {
        headers['X-Conductor-API-Key'] = apiKey;
      }
      const response = await fetch(`${baseUrl}/workflow/${workflowId}`, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch execution: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to fetch execution from Conductor API:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey]);

  const startWorkflow = useCallback(async (
    name: string,
    input: any,
    version?: number
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const url = version 
        ? `${baseUrl}/workflow/${name}?version=${version}`
        : `${baseUrl}/workflow/${name}`;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['X-Conductor-API-Key'] = apiKey;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        let errorMessage = `Failed to start workflow: ${response.statusText}`;
        try {
          const errorBody = await response.json();
          if (errorBody?.message) {
            errorMessage = errorBody.message;
          } else if (typeof errorBody === 'string') {
            errorMessage = errorBody;
          }
        } catch (parseError) {
          // Ignore if response body is not JSON
          console.debug('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      const workflowId = await response.text();
      return workflowId;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey]);

  const fetchAllTaskDefinitions = useCallback(async (): Promise<TaskDefinition[]> => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (apiKey) {
        headers['X-Conductor-API-Key'] = apiKey;
      }
      const response = await fetch(`${baseUrl}/metadata/taskdefs`, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch task definitions: ${response.statusText}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Failed to fetch task definitions from Conductor API:', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey]);

  const syncWorkflows = useCallback(async (): Promise<any[]> => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (apiKey) {
        headers['X-Conductor-API-Key'] = apiKey;
      }
      const response = await fetch(`${baseUrl}/metadata/workflow`, { headers });
      if (!response.ok) {
        throw new Error(`Failed to sync workflows: ${response.statusText}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Failed to sync workflows from Conductor API:', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey]);

  const fetchWorkflowExecution = useCallback(async (workflowId: string): Promise<WorkflowExecution | null> => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (apiKey) {
        headers['X-Conductor-API-Key'] = apiKey;
      }
      const response = await fetch(`${baseUrl}/workflow/${workflowId}`, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow execution: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to fetch workflow execution from Conductor API:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey]);

  // Helper to convert HTTP task config to Conductor TaskDef format
  const convertToTaskDef = useCallback((config: any) => {
    return {
      name: config.name || config.taskId || `task-${Date.now()}`,
      description: config.description || config.name || 'Task definition',
      retryCount: config.retryPolicy?.retryCount ?? 10,
      timeoutSeconds: 0,
      inputKeys: config.inputKeys || [],
      outputKeys: config.outputKeys || [],
      timeoutPolicy: config.timeoutPolicy?.timeoutAction || 'RETRY',
      retryLogic: 'FIXED',
      retryDelaySeconds: config.retryPolicy?.retryInterval ?? 0,
      responseTimeoutSeconds: config.timeoutPolicy?.responseTimeoutSeconds ?? 1,
      concurrentExecLimit: 0,
      rateLimitPerFrequency: 0,
      rateLimitFrequencyInSeconds: 0,
      pollTimeoutSeconds: config.timeoutPolicy?.pollTimeoutSeconds ?? 0,
      backoffScaleFactor: 1,
      inputTemplate: config.inputTemplate || config.input || {},
      ownerEmail: config.ownerEmail || 'admin@conductor.com',
      // HTTP task specific fields
      ...(config.httpRequest && {
        httpRequest: {
          uri: config.httpRequest.uri || config.http_request?.uri || '',
          method: config.httpRequest.method || config.http_request?.method || 'GET',
          headers: config.httpRequest.headers || config.http_request?.headers || {},
          body: config.httpRequest.body || config.http_request?.body,
          connectionTimeOut: config.httpRequest.connectionTimeOut || config.http_request?.connectionTimeOut || 3000,
          readTimeOut: config.httpRequest.readTimeOut || config.http_request?.readTimeOut || 3000,
        }
      }),
    };
  }, []);

  const createTaskDefinitionViaGraphQL = useCallback(async (taskDef: any): Promise<boolean> => {
    const mutation = `
      mutation RegisterTask($task: TaskDefinitionInput!) {
        registerTask(task: $task) {
          name
        }
      }
    `;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['X-Conductor-API-Key'] = apiKey;
    }

    // Explicitly log the GraphQL request
    APILogger.logGraphQLRequest(mutation, { task: taskDef }, proxyServer.proxyEndpoint);

    try {
      const response = await fetch(`${proxyServer.proxyEndpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: mutation,
          variables: { task: taskDef },
        }),
      });

      const responseData = await response.json();
      
      if (responseData.errors) {
        // Log GraphQL error
        APILogger.logGraphQLError(mutation, { errors: responseData.errors }, 0, 200, proxyServer.proxyEndpoint);
        const errorMessage = responseData.errors[0]?.message || 'GraphQL error';
        throw new Error(errorMessage);
      }

      // Log successful GraphQL response
      APILogger.logGraphQLResponse(mutation, responseData.data, 0, 200, proxyServer.proxyEndpoint);

      // Check for successful response - resolver returns task object with name
      if (!responseData.data?.registerTask?.name) {
        throw new Error('Failed to register task');
      }

      return true;
    } catch (error) {
      // Log error if not already logged by GraphQL error handler
      if (!(error instanceof Error) || !error.message.includes('GraphQL error')) {
        APILogger.logGraphQLError(mutation, { message: error instanceof Error ? error.message : String(error) }, 0, 500, proxyServer.proxyEndpoint);
      }
      throw error;
    }
  }, [apiKey, proxyServer.proxyEndpoint]);

  const createTaskDefinitionViaRest = useCallback(async (taskDef: any): Promise<boolean> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['X-Conductor-API-Key'] = apiKey;
    }
    
    // Explicitly log the REST request
    APILogger.logRestRequest('POST', `${baseUrl}/metadata/taskdefs`, [taskDef], headers);

    try {
      const response = await fetch(`${baseUrl}/metadata/taskdefs`, {
        method: 'POST',
        headers,
        body: JSON.stringify([taskDef]),
      });
      
      if (!response.ok) {
        let errorMessage = `Failed to create task definition: ${response.statusText}`;
        try {
          const errorBody = await response.json();
          if (errorBody?.message) {
            errorMessage = errorBody.message;
          } else if (typeof errorBody === 'string') {
            errorMessage = errorBody;
          }
        } catch (parseError) {
          console.debug('Failed to parse error response:', parseError);
        }
        
        // Log REST error
        APILogger.logRestError('POST', `${baseUrl}/metadata/taskdefs`, { message: errorMessage }, response.status, 0);
        throw new Error(errorMessage);
      }
      
      // Log successful REST response
      APILogger.logRestResponse('POST', `${baseUrl}/metadata/taskdefs`, { success: true }, response.status, 0);
      return true;
    } catch (error) {
      // Log error if not already logged
      if (!(error instanceof Error) || !error.message.includes('Failed to create task definition')) {
        APILogger.logRestError('POST', `${baseUrl}/metadata/taskdefs`, { message: error instanceof Error ? error.message : String(error) }, 0, 0);
      }
      throw error;
    }
  }, [baseUrl, apiKey]);

  const createTaskDefinition = useCallback(async (taskDef: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const formattedTaskDef = convertToTaskDef(taskDef);
      if (proxyServer.enabled && proxyServer.proxyEndpoint) {
        return await createTaskDefinitionViaGraphQL(formattedTaskDef);
      }
      return await createTaskDefinitionViaRest(formattedTaskDef);
    } catch (err) {
      console.error('Failed to create task definition:', err);
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [proxyServer, createTaskDefinitionViaGraphQL, createTaskDefinitionViaRest, convertToTaskDef]);

  return {
    loading,
    error,
    fetchWorkflowByName,
    fetchWorkflowByVersion,
    fetchAllWorkflows,
    fetchExecution,
    startWorkflow,
    fetchAllTaskDefinitions,
    syncWorkflows,
    fetchWorkflowExecution,
    createTaskDefinition,
  };
}
