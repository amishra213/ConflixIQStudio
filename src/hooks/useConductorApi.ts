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

  // Helper function to make GraphQL requests
  const graphqlRequest = useCallback(async (query: string, variables?: unknown): Promise<unknown> => {
    const { APILogger } = await import('@/utils/apiLogger');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['X-Conductor-API-Key'] = apiKey;
    }

    // Log the GraphQL request manually since we're using direct fetch
    APILogger.logGraphQLRequest(query, variables as Record<string, unknown> || {}, baseUrl);

    const startTime = performance.now();

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const data = await response.json();
    const duration = Math.round(performance.now() - startTime);
    
    // Handle HTTP-level errors
    if (!response.ok) {
      let errorMessage = `GraphQL request failed (${response.status}): ${response.statusText}`;
      if (data?.message) {
        errorMessage = data.message;
      } else if (data?.errors && Array.isArray(data.errors)) {
        errorMessage = data.errors[0]?.message || errorMessage;
      }
      
      // Log the error response
      APILogger.logGraphQLError(query, { message: errorMessage, errors: data?.errors }, duration, response.status, baseUrl);
      
      throw new Error(errorMessage);
    }
    
    // Handle GraphQL errors
    if (data.errors) {
      const errorMessage = data.errors[0]?.message || 'GraphQL error';
      
      // Log the GraphQL error response
      APILogger.logGraphQLError(query, { message: errorMessage, errors: data.errors }, duration, 200, baseUrl);
      
      throw new Error(errorMessage);
    }

    // Log successful response
    APILogger.logGraphQLResponse(query, data, duration, response.status, baseUrl);

    return data.data;
  }, [baseUrl, apiKey]);

  // Helper to extract workflow from GraphQL response
  const extractWorkflowFromGraphQL = (data: Record<string, unknown>): WorkflowDefinition | null => {
    const workflow = (data.workflow as WorkflowDefinition) || 
                    ((data.data as Record<string, WorkflowDefinition>)?.workflow) || 
                    null;
    return workflow?.name ? workflow : null;
  };

  // Helper to fetch workflow via GraphQL
  const fetchWorkflowViaGraphQL = useCallback(async (
    name: string,
    version?: number
  ): Promise<WorkflowDefinition | null> => {
    const graphqlQuery = `
      query GetWorkflowByName($name: String!, $version: Int) {
        workflow(name: $name, version: $version) {
          name description version createTime updateTime createdBy updatedBy ownerEmail ownerApp
          timeoutSeconds timeoutPolicy restartable schemaVersion effectiveDate endDate status
          inputParameters inputTemplate outputParameters accessPolicy failureWorkflow variables
          workflowStatusListenerEnabled
          tasks {
            name taskReferenceName type description workflowTaskType inputParameters outputParameters
            optional asyncComplete retryCount startDelay rateLimited evaluatorType expression scriptExpression
            decisionCases defaultCase forkTasks joinOn defaultExclusiveJoinTask loopCondition loopOver
            dynamicForkTasksParam dynamicForkTasksInputParamName dynamicTaskNameParam sink subWorkflowParam
          }
        }
      }
    `;
    
    try {
      const data = await graphqlRequest(graphqlQuery, { name, version }) as Record<string, unknown>;
      const workflow = extractWorkflowFromGraphQL(data);
      if (!workflow) return null;
      
      const taskCount = Array.isArray(workflow.tasks) ? workflow.tasks.length : 0;
      const versionStr = version ? ` v${version}` : '';
      console.log(`[API] Loaded workflow "${name}"${versionStr} via GraphQL (${taskCount} tasks)`);
      return workflow;
    } catch (graphqlError) {
      const errorMsg = graphqlError instanceof Error ? graphqlError.message : String(graphqlError);
      const versionStr = version ? ` v${version}` : '';
      console.error(`[API] Failed to load workflow "${name}"${versionStr}: ${errorMsg}`);
      return null;
    }
  }, [graphqlRequest]);

  // Helper to fetch workflow via REST
  const fetchWorkflowViaRest = useCallback(async (
    name: string,
    version?: number
  ): Promise<WorkflowDefinition | null> => {
    const headers: HeadersInit = { ...(apiKey && { 'X-Conductor-API-Key': apiKey }) };
    const url = version 
      ? `${baseUrl}/api/metadata/workflow/${name}?version=${version}`
      : `${baseUrl}/api/metadata/workflow/${name}`;
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch workflow: ${response.statusText}`);
    }
    
    const workflow = await response.json() as WorkflowDefinition;
    const taskCount = Array.isArray(workflow?.tasks) ? workflow.tasks.length : 0;
    const versionStr = version ? ` v${version}` : '';
    console.log(`[API] Loaded workflow "${name}"${versionStr} via REST (${taskCount} tasks)`);
    return workflow;
  }, [baseUrl, apiKey]);

  // Helper for fallback to local workflow
  const tryLocalWorkflowFallback = useCallback(async (name: string): Promise<WorkflowDefinition | null> => {
    if (!enableFallback) return null;
    
    const local = workflows.find(w => w.name === name);
    if (!local) return null;
    
    const { localWorkflowToConductor } = await import('@/utils/workflowConverter');
    return localWorkflowToConductor(local);
  }, [enableFallback, workflows]);

  const fetchWorkflowByName = useCallback(async (name: string): Promise<WorkflowDefinition | null> => {
    setLoading(true);
    setError(null);
    try {
      let workflow: WorkflowDefinition | null = null;
      
      if (proxyServer.enabled && proxyServer.proxyEndpoint) {
        workflow = await fetchWorkflowViaGraphQL(name);
      } else {
        workflow = await fetchWorkflowViaRest(name);
      }
      
      return workflow;
    } catch (err) {
      setError(err as Error);
      return await tryLocalWorkflowFallback(name);
    } finally {
      setLoading(false);
    }
  }, [proxyServer, fetchWorkflowViaGraphQL, fetchWorkflowViaRest, tryLocalWorkflowFallback]);

  const fetchWorkflowByVersion = useCallback(async (
    name: string,
    version: number
  ): Promise<WorkflowDefinition | null> => {
    setLoading(true);
    setError(null);
    try {
      let workflow: WorkflowDefinition | null = null;
      
      if (proxyServer.enabled && proxyServer.proxyEndpoint) {
        workflow = await fetchWorkflowViaGraphQL(name, version);
      } else {
        workflow = await fetchWorkflowViaRest(name, version);
      }
      
      return workflow;
    } catch (err) {
      setError(err as Error);
      return await tryLocalWorkflowFallback(name);
    } finally {
      setLoading(false);
    }
  }, [proxyServer, fetchWorkflowViaGraphQL, fetchWorkflowViaRest, tryLocalWorkflowFallback]);

  const fetchAllWorkflows = useCallback(async (): Promise<WorkflowDefinition[]> => {
    setLoading(true);
    setError(null);
    try {
      if (proxyServer.enabled && proxyServer.proxyEndpoint) {
        // Use GraphQL
        const query = `
          query GetAllWorkflows {
            workflows(limit: 1000, offset: 0) {
              name
              description
              version
              createTime
              updateTime
              createdBy
              updatedBy
              ownerEmail
              ownerApp
              timeoutSeconds
              timeoutPolicy
              tasks {
                name
                taskReferenceName
                type
                description
                workflowTaskType
                inputParameters
                outputParameters
                optional
                asyncComplete
                retryCount
                startDelay
                rateLimited
                evaluatorType
                expression
                scriptExpression
                decisionCases
                defaultCase
                forkTasks
                joinOn
                defaultExclusiveJoinTask
                loopCondition
                loopOver
                dynamicForkTasksParam
                dynamicForkTasksInputParamName
                dynamicTaskNameParam
                sink
                subWorkflowParam
              }
              inputParameters
              inputTemplate
              outputParameters
              restartable
              schemaVersion
              accessPolicy
              failureWorkflow
              variables
              workflowStatusListenerEnabled
              effectiveDate
              endDate
              status
            }
          }
        `;
        const data = await graphqlRequest(query) as Record<string, unknown>;
        return (data.workflows as WorkflowDefinition[]) || [];
      } else {
        // Use REST
        const headers: HeadersInit = {};
        if (apiKey) {
          headers['X-Conductor-API-Key'] = apiKey;
        }
        const response = await fetch(`${baseUrl}/api/metadata/workflow`, { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch workflows: ${response.statusText}`);
        }
        return await response.json();
      }
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
  }, [baseUrl, apiKey, proxyServer, enableFallback, workflows, graphqlRequest]);

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
      if (proxyServer.enabled && proxyServer.proxyEndpoint) {
        // Use GraphQL proxy (which internally calls REST endpoint)
        console.log('Fetching task definitions via GraphQL proxy from:', proxyServer.proxyEndpoint);
        const query = `
          query GetTaskDefinitions {
            taskDefinitions {
              name
              description
              retryCount
              timeoutSeconds
              inputKeys
              outputKeys
              responseTimeoutSeconds
              ownerEmail
              createdBy
              updatedBy
              createTime
              updateTime
              timeoutPolicy
              retryLogic
              retryDelaySeconds
              concurrentExecLimit
              rateLimitPerFrequency
              rateLimitFrequencyInSeconds
              isolationGroupId
              pollTimeoutSeconds
              backoffScaleFactor
              ownerApp
              executionNameSpace
              inputTemplate
              accessPolicy
            }
          }
        `;
        const data = await graphqlRequest(query) as Record<string, unknown>;
        const taskDefs = (data.taskDefinitions as TaskDefinition[]) || [];
        console.log('Fetched task definitions via GraphQL proxy:', taskDefs.length);
        return taskDefs;
      } else {
        // Direct REST call (may have CORS issues)
        const conductorUrl = conductorApi.endpoint || 'http://localhost:8080';
        const headers: HeadersInit = {};
        if (conductorApi.apiKey) {
          headers['X-Conductor-API-Key'] = conductorApi.apiKey;
        }
        
        const endpoint = `${conductorUrl}/api/metadata/taskdefs`;
        console.log('Fetching task definitions via REST from:', endpoint);
        
        const response = await fetch(endpoint, { 
          method: 'GET',
          headers 
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch task definitions: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched task definitions via REST:', Array.isArray(data) ? data.length : 0);
        return Array.isArray(data) ? data : [];
      }
    } catch (err) {
      console.error('Failed to fetch task definitions from Conductor API:', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [conductorApi.endpoint, conductorApi.apiKey, proxyServer, graphqlRequest]);

  const syncWorkflows = useCallback(async (): Promise<unknown[]> => {
    setLoading(true);
    setError(null);
    try {
      if (proxyServer.enabled && proxyServer.proxyEndpoint) {
        // Use GraphQL through proxy (avoids CORS)
        console.log('Fetching workflows via GraphQL from:', proxyServer.proxyEndpoint);
        const query = `
          query GetAllWorkflows {
            workflows(limit: 1000, offset: 0) {
              name
              description
              version
              createTime
              updateTime
              createdBy
              updatedBy
              ownerEmail
              ownerApp
              timeoutSeconds
              timeoutPolicy
              tasks {
                name
                taskReferenceName
                type
                description
                workflowTaskType
                inputParameters
                outputParameters
                optional
                asyncComplete
                retryCount
                startDelay
                rateLimited
                evaluatorType
                expression
                scriptExpression
                decisionCases
                defaultCase
                forkTasks
                joinOn
                defaultExclusiveJoinTask
                loopCondition
                loopOver
                dynamicForkTasksParam
                dynamicForkTasksInputParamName
                dynamicTaskNameParam
                sink
                subWorkflowParam
              }
              inputParameters
              inputTemplate
              outputParameters
              restartable
              schemaVersion
              accessPolicy
              failureWorkflow
              variables
              workflowStatusListenerEnabled
              effectiveDate
              endDate
              status
            }
          }
        `;
        const data = await graphqlRequest(query) as Record<string, unknown>;
        const workflows = (data.workflows as unknown[]) || [];
        console.log('Fetched workflows via GraphQL:', workflows.length);
        return workflows;
      } else {
        // Use REST when proxy is disabled
        const headers: HeadersInit = {};
        if (apiKey) {
          headers['X-Conductor-API-Key'] = apiKey;
        }
        
        console.log('Fetching workflows via REST from:', `${baseUrl}/api/metadata/workflow`);
        const response = await fetch(`${baseUrl}/api/metadata/workflow`, { headers });
        if (!response.ok) {
          throw new Error(`Failed to sync workflows: ${response.statusText}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      }
    } catch (err) {
      console.error('Failed to sync workflows from Conductor API:', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey, proxyServer, graphqlRequest]);

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
    
    // If it's already a complete task definition, pass it through
    if (cfg.name && typeof cfg === 'object' && 'retryCount' in cfg) {
      return {
        name: cfg.name as string,
        description: cfg.description as string || 'Task definition',
        retryCount: (cfg.retryCount as number) ?? 3,
        timeoutSeconds: (cfg.timeoutSeconds as number) ?? 0,
        inputKeys: (cfg.inputKeys as string[]) || [],
        outputKeys: (cfg.outputKeys as string[]) || [],
        timeoutPolicy: (cfg.timeoutPolicy as string) || 'RETRY',
        retryLogic: (cfg.retryLogic as string) || 'FIXED',
        retryDelaySeconds: (cfg.retryDelaySeconds as number) ?? 0,
        responseTimeoutSeconds: (cfg.responseTimeoutSeconds as number) ?? 1,
        concurrentExecLimit: (cfg.concurrentExecLimit as number) ?? 0,
        rateLimitPerFrequency: (cfg.rateLimitPerFrequency as number) ?? 0,
        rateLimitFrequencyInSeconds: (cfg.rateLimitFrequencyInSeconds as number) ?? 0,
        pollTimeoutSeconds: (cfg.pollTimeoutSeconds as number) ?? 0,
        backoffScaleFactor: (cfg.backoffScaleFactor as number) ?? 1,
        ownerEmail: (cfg.ownerEmail as string) || 'admin@conductor.com',
        ownerApp: (cfg.ownerApp as string) || undefined,
        isolationGroupId: (cfg.isolationGroupId as string) || undefined,
        executionNameSpace: (cfg.executionNameSpace as string) || undefined,
        inputTemplate: (cfg.inputTemplate as Record<string, unknown>) || {},
        accessPolicy: (cfg.accessPolicy as Record<string, unknown>) || {},
      };
    }
    
    // Otherwise convert from form config
    const timeoutPolicy = cfg.timeoutPolicy as Record<string, unknown> || {};
    const httpRequest = cfg.httpRequest as Record<string, unknown>;
    const httpRequestFallback = cfg.http_request as Record<string, unknown>;
    return {
      name: (cfg.name || cfg.taskId || `task-${Date.now()}`) as string,
      description: (cfg.description || cfg.name || 'Task definition') as string,
      retryCount: ((cfg.retryPolicy as Record<string, unknown>)?.retryCount ?? (cfg.retryCount ?? 10)) as number,
      timeoutSeconds: (cfg.timeoutSeconds ?? 0) as number,
      inputKeys: (cfg.inputKeys || []) as string[],
      outputKeys: (cfg.outputKeys || []) as string[],
      timeoutPolicy: (typeof timeoutPolicy === 'string' ? timeoutPolicy : (timeoutPolicy.timeoutAction || 'RETRY')) as string,
      retryLogic: (cfg.retryLogic || 'FIXED') as string,
      retryDelaySeconds: (((cfg.retryPolicy as Record<string, unknown>)?.retryInterval ?? cfg.retryDelaySeconds ?? 0) as number),
      responseTimeoutSeconds: ((typeof timeoutPolicy === 'object' ? (timeoutPolicy.responseTimeoutSeconds ?? 1) : 1) as number),
      concurrentExecLimit: (cfg.concurrentExecLimit ?? 0) as number,
      rateLimitPerFrequency: (cfg.rateLimitPerFrequency ?? 0) as number,
      rateLimitFrequencyInSeconds: (cfg.rateLimitFrequencyInSeconds ?? 0) as number,
      pollTimeoutSeconds: ((typeof timeoutPolicy === 'object' ? (timeoutPolicy.pollTimeoutSeconds ?? 0) : 0) as number),
      backoffScaleFactor: (cfg.backoffScaleFactor ?? 1) as number,
      ownerEmail: (cfg.ownerEmail || 'admin@conductor.com') as string,
      inputTemplate: (cfg.inputTemplate || cfg.input || {}) as Record<string, unknown>,
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
    const { APILogger } = await import('@/utils/apiLogger');
    
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

    // Log the GraphQL request manually since we're using direct fetch
    APILogger.logGraphQLRequest(mutation, { task: taskDef as Record<string, unknown> }, proxyServer.proxyEndpoint);

    const startTime = performance.now();
    
    const response = await fetch(`${proxyServer.proxyEndpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: mutation,
        variables: { task: taskDef },
      }),
    });

    const responseData = await response.json();
    const duration = Math.round(performance.now() - startTime);
    
    if (responseData.errors) {
      const errorMessage = responseData.errors[0]?.message || 'GraphQL error';
      // Log the GraphQL error response
      APILogger.logGraphQLError(mutation, { message: errorMessage, errors: responseData.errors }, duration, 200, proxyServer.proxyEndpoint);
      throw new Error(errorMessage);
    }

    // Log successful response
    APILogger.logGraphQLResponse(mutation, responseData, duration, response.status, proxyServer.proxyEndpoint);

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

  const updateTaskDefinition = useCallback(async (taskDef: unknown): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { APILogger } = await import('@/utils/apiLogger');
      const formattedTaskDef = convertToTaskDef(taskDef);
      
      if (proxyServer.enabled && proxyServer.proxyEndpoint) {
        // Use GraphQL proxy with updateTask mutation
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (apiKey) {
          headers['X-Conductor-API-Key'] = apiKey;
        }

        const mutation = `
          mutation UpdateTask($task: TaskDefinitionInput!) {
            updateTask(task: $task) {
              name
            }
          }
        `;

        // Log the GraphQL request manually since we're using direct fetch
        APILogger.logGraphQLRequest(mutation, { task: formattedTaskDef as Record<string, unknown> }, proxyServer.proxyEndpoint);

        const startTime = performance.now();
        
        const response = await fetch(proxyServer.proxyEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: mutation,
            variables: { task: formattedTaskDef },
          }),
        });

        const responseData = await response.json();
        const duration = Math.round(performance.now() - startTime);
        
        // Handle HTTP-level errors
        if (!response.ok) {
          let errorMessage = `Failed to update task (${response.status}): ${response.statusText}`;
          if (responseData?.message) {
            errorMessage = responseData.message;
          } else if (responseData?.errors && Array.isArray(responseData.errors)) {
            errorMessage = responseData.errors[0]?.message || errorMessage;
          }
          
          // Log the error response
          APILogger.logGraphQLError(mutation, { message: errorMessage, errors: responseData?.errors }, duration, response.status, proxyServer.proxyEndpoint);
          
          const error = new Error(errorMessage);
          console.error('Failed to update task - Full error:', responseData);
          throw error;
        }
        
        // Handle GraphQL errors
        if (responseData.errors) {
          const errorMessage = responseData.errors[0]?.message || 'Failed to update task';
          
          // Log the GraphQL error response
          APILogger.logGraphQLError(mutation, { message: errorMessage, errors: responseData.errors }, duration, 200, proxyServer.proxyEndpoint);
          
          const error = new Error(errorMessage);
          console.error('Failed to update task - GraphQL errors:', responseData.errors);
          throw error;
        }

        // Log successful response
        APILogger.logGraphQLResponse(mutation, responseData, duration, response.status, proxyServer.proxyEndpoint);

        if (!responseData.data?.updateTask?.name) {
          const error = new Error('Failed to update task definition - No data returned');
          console.error('Failed to update task - No data:', responseData);
          throw error;
        }

        return true;
      } else {
        // Direct REST call: PUT /api/metadata/taskdefs
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (apiKey) {
          headers['X-Conductor-API-Key'] = apiKey;
        }
        
        console.log('Updating task via REST PUT:', JSON.stringify(formattedTaskDef, null, 2));
        // Fetch interceptor will handle logging automatically
        const response = await fetch(`${baseUrl}/api/metadata/taskdefs`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formattedTaskDef),
        });
        
        // Try to parse response body
        let responseData: unknown = {};
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.clone().json();
          } else {
            const text = await response.clone().text();
            console.log('PUT response text:', text);
          }
        } catch (parseError) {
          console.debug('Failed to parse PUT response:', parseError);
        }
        
        if (!response.ok) {
          let errorMessage = `Failed to update task definition (${response.status}): ${response.statusText}`;
          if (typeof responseData === 'object' && responseData !== null) {
            const data = responseData as Record<string, unknown>;
            if (data.message) {
              errorMessage = data.message as string;
            } else if (data.error) {
              errorMessage = data.error as string;
            }
          } else if (typeof responseData === 'string') {
            errorMessage = responseData;
          }
          const error = new Error(errorMessage);
          console.error('Failed to update task - Full error:', responseData);
          throw error;
        }
        
        console.log('Task definition updated successfully');
        return true;
      }
    } catch (err) {
      console.error('Failed to update task definition:', err);
      setError(err as Error);
      throw err; // Re-throw to allow caller to handle
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey, proxyServer, convertToTaskDef]);

  const deleteTaskDefinition = useCallback(async (taskName: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      if (proxyServer.enabled && proxyServer.proxyEndpoint) {
        // Use GraphQL proxy with deleteTask mutation
        const { APILogger } = await import('@/utils/apiLogger');
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (apiKey) {
          headers['X-Conductor-API-Key'] = apiKey;
        }

        const mutation = `
          mutation DeleteTask($taskName: String!) {
            deleteTask(taskName: $taskName) {
              success
            }
          }
        `;

        // Log the GraphQL request manually since we're using direct fetch
        APILogger.logGraphQLRequest(mutation, { taskName }, proxyServer.proxyEndpoint);

        const startTime = performance.now();

        const response = await fetch(proxyServer.proxyEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: mutation,
            variables: { taskName },
          }),
        });

        const data = await response.json();
        const duration = Math.round(performance.now() - startTime);
        
        // Handle HTTP-level errors
        if (!response.ok) {
          let errorMessage = `Failed to delete task (${response.status}): ${response.statusText}`;
          if (data?.message) {
            errorMessage = data.message;
          } else if (data?.errors && Array.isArray(data.errors)) {
            errorMessage = data.errors[0]?.message || errorMessage;
          }
          
          // Log the error response
          APILogger.logGraphQLError(mutation, { message: errorMessage, errors: data?.errors }, duration, response.status, proxyServer.proxyEndpoint);
          
          throw new Error(errorMessage);
        }
        
        // Handle GraphQL errors
        if (data.errors) {
          const errorMessage = data.errors[0]?.message || 'Failed to delete task';
          
          // Log the GraphQL error response
          APILogger.logGraphQLError(mutation, { message: errorMessage, errors: data.errors }, duration, 200, proxyServer.proxyEndpoint);
          
          throw new Error(errorMessage);
        }

        // Log successful response
        APILogger.logGraphQLResponse(mutation, data, duration, response.status, proxyServer.proxyEndpoint);

        if (!data.data?.deleteTask?.success) {
          throw new Error('Failed to delete task definition');
        }

        return true;
      } else {
        // Direct REST call: DELETE /api/metadata/taskdefs/{tasktype}
        const headers: HeadersInit = {};
        if (apiKey) {
          headers['X-Conductor-API-Key'] = apiKey;
        }
        
        const response = await fetch(`${baseUrl}/api/metadata/taskdefs/${encodeURIComponent(taskName)}`, {
          method: 'DELETE',
          headers,
        });
        
        // Treat 404 as success - task already doesn't exist on server
        if (response.status === 404) {
          console.log(`Task ${taskName} not found on server (already deleted or never published)`);
          return true;
        }
        
        if (!response.ok) {
          let errorMessage = `Failed to delete task definition: ${response.statusText}`;
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
        
        console.log(`Successfully deleted task ${taskName} from Conductor server`);
        return true;
      }
    } catch (err) {
      console.error('Failed to delete task definition:', err);
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey, proxyServer]);

  const saveWorkflow = useCallback(async (workflowDef: unknown, isNew: boolean = false): Promise<boolean> => {
    // Use GraphQL proxy endpoint if enabled
    if (!proxyServer.enabled || !proxyServer.proxyEndpoint) {
      console.error('GraphQL proxy not enabled. Cannot save workflow.');
      setError(new Error('GraphQL proxy not enabled'));
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Dynamically import APILogger for logging
      const { APILogger } = await import('@/utils/apiLogger');
      
      // Use createWorkflow mutation for new workflows, saveWorkflow for updates
      const mutationType = isNew ? 'createWorkflow' : 'saveWorkflow';
      const mutation = `
        mutation ${isNew ? 'Create' : 'Save'}Workflow($workflow: WorkflowInput!) {
          ${mutationType}(workflow: $workflow) {
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

      // Log the GraphQL request manually since we're using direct fetch
      const requestBody = {
        query: mutation,
        variables: { workflow: workflowDef },
      };
      APILogger.logGraphQLRequest(mutation, { workflow: workflowDef as Record<string, unknown> }, proxyServer.proxyEndpoint);

      const startTime = performance.now();
      
      // Fetch interceptor will handle logging automatically
      const response = await fetch(`${proxyServer.proxyEndpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      const duration = Math.round(performance.now() - startTime);
      
      // Handle HTTP-level errors (non-200 status codes)
      if (!response.ok) {
        let errorMessage = `Failed to save workflow (${response.status}): ${response.statusText}`;
        if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.errors && Array.isArray(responseData.errors)) {
          errorMessage = responseData.errors[0]?.message || errorMessage;
        }
        
        // Log the error response
        const errorDetails = {
          message: errorMessage,
          code: response.status,
          errors: responseData?.errors || [responseData]
        };
        APILogger.logGraphQLError(mutation, errorDetails, duration, response.status, proxyServer.proxyEndpoint);
        
        const error = new Error(errorMessage);
        setError(error);
        console.error('Failed to save workflow - Full error:', responseData);
        throw error;
      }
      
      // Handle GraphQL errors (200 response but with GraphQL errors)
      if (responseData.errors) {
        const errorMessage = responseData.errors[0]?.message || 'GraphQL error';
        
        // Log the GraphQL error response
        APILogger.logGraphQLError(mutation, { message: errorMessage, errors: responseData.errors }, duration, 200, proxyServer.proxyEndpoint);
        
        const error = new Error(errorMessage);
        setError(error);
        console.error('Failed to save workflow - GraphQL errors:', responseData.errors);
        throw error;
      }

      // Log successful response
      APILogger.logGraphQLResponse(mutation, responseData, duration, response.status, proxyServer.proxyEndpoint);

      // Check for successful response based on mutation type
      const workflowData = isNew ? responseData.data?.createWorkflow : responseData.data?.saveWorkflow;
      if (!workflowData?.name) {
        const error = new Error('Failed to save workflow - No data returned');
        setError(error);
        throw error;
      }

      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error in saveWorkflow:', error);
      throw error;
    } finally {
      setLoading(false);
    }
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
      const response = await fetch(`${baseUrl}/api/metadata/workflow/${name}/${version}`, {
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
    updateTaskDefinition,
    deleteTaskDefinition,
    saveWorkflow,
    deleteWorkflow,
  };
}
