import { useState, useCallback } from 'react';
import { WorkflowDefinition } from '@/utils/workflowConverter';
import { WorkflowExecution } from '@/utils/workflowToMermaid';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useSettingsStore } from '@/stores/settingsStore';
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
          const { localWorkflowToConductor } = await import('@/utils/workflowConverter');
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
          const { localWorkflowToConductor } = await import('@/utils/workflowConverter');
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
        const { localWorkflowToConductor } = await import('@/utils/workflowConverter');
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
    input: unknown,
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

  const syncWorkflows = useCallback(async (): Promise<unknown[]> => {
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
  const convertToTaskDef = useCallback((config: unknown) => {
    const cfg = config as Record<string, unknown>;
    const timeoutPolicy = cfg.timeoutPolicy as Record<string, unknown> || {};
    const httpRequest = cfg.httpRequest as Record<string, unknown>;
    const httpRequestFallback = cfg.http_request as Record<string, unknown>;
    return {
      name: (cfg.name || cfg.taskId || `task-${Date.now()}`) as string,
      description: (cfg.description || cfg.name || 'Task definition') as string,
      retryCount: ((cfg.retryPolicy as Record<string, unknown>)?.retryCount ?? 10) as number,
      timeoutSeconds: 0,
      inputKeys: (cfg.inputKeys || []) as string[],
      outputKeys: (cfg.outputKeys || []) as string[],
      timeoutPolicy: (timeoutPolicy.timeoutAction || 'RETRY') as string,
      retryLogic: 'FIXED',
      retryDelaySeconds: (((cfg.retryPolicy as Record<string, unknown>)?.retryInterval ?? 0) as number),
      responseTimeoutSeconds: ((timeoutPolicy.responseTimeoutSeconds ?? 1) as number),
      concurrentExecLimit: 0,
      rateLimitPerFrequency: 0,
      rateLimitFrequencyInSeconds: 0,
      pollTimeoutSeconds: (timeoutPolicy.pollTimeoutSeconds ?? 0) as number,
      backoffScaleFactor: 1,
      inputTemplate: (cfg.inputTemplate || cfg.input || {}) as Record<string, unknown>,
      ownerEmail: (cfg.ownerEmail || 'admin@conductor.com') as string,
      // HTTP task specific fields
      ...(httpRequest && {
        httpRequest: {
          uri: (httpRequest.uri || httpRequestFallback?.uri || '') as string,
          method: (httpRequest.method || httpRequestFallback?.method || 'GET') as string,
          headers: (httpRequest.headers || httpRequestFallback?.headers || {}) as Record<string, unknown>,
          body: httpRequest.body || httpRequestFallback?.body,
          connectionTimeOut: ((httpRequest.connectionTimeOut || httpRequestFallback?.connectionTimeOut || 3000) as number),
          readTimeOut: ((httpRequest.readTimeOut || httpRequestFallback?.readTimeOut || 3000) as number),
        }
      }),
    };
  }, []);

  const createTaskDefinitionViaGraphQL = useCallback(async (taskDef: unknown): Promise<boolean> => {
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

    // Fetch interceptor will handle logging automatically
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
      const errorMessage = responseData.errors[0]?.message || 'GraphQL error';
      throw new Error(errorMessage);
    }

    // Check for successful response - resolver returns task object with name
    if (!responseData.data?.registerTask?.name) {
      throw new Error('Failed to register task');
    }

    return true;
  }, [apiKey, proxyServer.proxyEndpoint]);

  const createTaskDefinitionViaRest = useCallback(async (taskDef: unknown): Promise<boolean> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['X-Conductor-API-Key'] = apiKey;
    }
    
    // Fetch interceptor will handle logging automatically
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
      
      throw new Error(errorMessage);
    }
    
    return true;
  }, [baseUrl, apiKey]);

  const createTaskDefinition = useCallback(async (taskDef: unknown): Promise<boolean> => {
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

  const saveWorkflow = useCallback(async (workflowDef: unknown): Promise<boolean> => {
    // Use GraphQL proxy endpoint if enabled
    if (!proxyServer.enabled || !proxyServer.proxyEndpoint) {
      console.error('GraphQL proxy not enabled. Cannot save workflow.');
      setError(new Error('GraphQL proxy not enabled'));
      return false;
    }

    const mutation = `
      mutation SaveWorkflow($workflow: WorkflowInput!) {
        saveWorkflow(workflow: $workflow) {
          name
          version
        }
      }
    `;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['X-Conductor-API-Key'] = apiKey;
    }

    // Fetch interceptor will handle logging automatically
    const response = await fetch(`${proxyServer.proxyEndpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: mutation,
        variables: { workflow: workflowDef },
      }),
    });

    const responseData = await response.json();
    
    if (responseData.errors) {
      const errorMessage = responseData.errors[0]?.message || 'GraphQL error';
      throw new Error(errorMessage);
    }

    // Check for successful response
    if (!responseData.data?.saveWorkflow?.name) {
      throw new Error('Failed to save workflow');
    }

    return true;
  }, [apiKey, proxyServer]);

  const deleteWorkflow = useCallback(async (
    name: string,
    version: number = 1
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (apiKey) {
        headers['X-Conductor-API-Key'] = apiKey;
      }
      
      // Use DELETE endpoint: /api/metadata/workflow/{name}/{version}
      const response = await fetch(`${baseUrl}/metadata/workflow/${name}/${version}`, {
        method: 'DELETE',
        headers,
      });
      
      // Treat 404 as success - if workflow doesn't exist on server, it's already deleted
      if (response.status === 404) {
        console.log(`Workflow ${name} v${version} not found on server (already deleted or never published)`);
        return true;
      }
      
      if (!response.ok) {
        let errorMessage = `Failed to delete workflow: ${response.statusText}`;
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
        throw new Error(errorMessage);
      }
      
      console.log(`Successfully deleted workflow ${name} v${version} from Conductor server`);
      return true;
    } catch (err) {
      console.warn('Failed to delete workflow from Conductor server:', err);
      setError(err as Error);
      // Return false when server deletion fails (but caller should remove from cache anyway)
      return false;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey]);

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
    saveWorkflow,
    deleteWorkflow,
  };
}
