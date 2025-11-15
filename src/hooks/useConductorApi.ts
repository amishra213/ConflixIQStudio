import { useState, useCallback } from 'react';
import { WorkflowDefinition, WorkflowExecution } from '@/utils/workflowToMermaid';
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
  const { conductorApi } = useSettingsStore();

  const baseUrl = conductorApi.endpoint || '/api';
  const apiKey = conductorApi.apiKey;

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
      const response = await fetch(`${baseUrl}/metadata/workflow/${name}/${version}`, { headers });
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

  return {
    loading,
    error,
    fetchWorkflowByName,
    fetchWorkflowByVersion,
    fetchAllWorkflows,
    fetchExecution,
    startWorkflow,
    fetchAllTaskDefinitions,
  };
}
