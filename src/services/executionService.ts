/**
 * Execution Service
 * Handles API calls to fetch workflow execution data from Conductor
 * Uses the Vite dev server proxy configured in vite.config.ts
 * All API calls are proxied through /api/* to the backend server
 */

/**
 * Summary execution data returned from /search endpoint
 */
export interface ExecutionSummary {
  workflowId: string;
  workflowType: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMED_OUT' | 'TERMINATED' | 'PAUSED';
  startTime: number;
  endTime?: number;
  correlationId?: string;
  workflowName?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

/**
 * Task Definition
 */
export interface TaskDefinition {
  ownerApp?: string;
  createTime?: number;
  updateTime?: number;
  createdBy?: string;
  updatedBy?: string;
  name?: string;
  description?: string;
  retryCount?: number;
  timeoutSeconds?: number;
  inputKeys?: string[];
  outputKeys?: string[];
  timeoutPolicy?: string;
  retryLogic?: string;
  retryDelaySeconds?: number;
  responseTimeoutSeconds?: number;
  concurrentExecLimit?: number;
  inputTemplate?: Record<string, unknown>;
  rateLimitPerFrequency?: number;
  rateLimitFrequencyInSeconds?: number;
  isolationGroupId?: string;
  executionNameSpace?: string;
  ownerEmail?: string;
  pollTimeoutSeconds?: number;
  backoffScaleFactor?: number;
}

/**
 * Workflow Task Definition
 */
export interface WorkflowTaskDefinition {
  name?: string;
  taskReferenceName?: string;
  description?: string;
  inputParameters?: Record<string, unknown>;
  type?: string;
  dynamicTaskNameParam?: string;
  scriptExpression?: string;
  decisionCases?: Record<string, string[]>;
  dynamicForkTasksParam?: string;
  dynamicForkTasksInputParamName?: string;
  defaultCase?: string[];
  forkTasks?: string[][];
  startDelay?: number;
  subWorkflowParam?: Record<string, unknown>;
  joinOn?: string[];
  sink?: string;
  optional?: boolean;
  taskDefinition?: TaskDefinition;
  rateLimited?: boolean;
  defaultExclusiveJoinTask?: string[];
  asyncComplete?: boolean;
  loopCondition?: string;
  loopOver?: string[];
  retryCount?: number;
  evaluatorType?: string;
  expression?: string;
}

/**
 * Task execution details
 */
export interface TaskExecution {
  taskType: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'TIMED_OUT' | 'SKIPPED' | 'CANCELED';
  inputData?: Record<string, unknown>;
  referenceTaskName: string;
  retryCount: number;
  seq: number;
  correlationId?: string;
  pollCount: number;
  taskDefName: string;
  scheduledTime: number;
  startTime: number;
  endTime?: number;
  updateTime: number;
  startDelayInSeconds: number;
  retriedTaskId?: string;
  retried: boolean;
  executed: boolean;
  callbackFromWorker: boolean;
  responseTimeoutSeconds: number;
  workflowInstanceId: string;
  workflowType: string;
  taskId: string;
  reasonForIncompletion?: string;
  callbackAfterSeconds: number;
  workerId?: string;
  outputData?: Record<string, unknown>;
  workflowTask?: WorkflowTaskDefinition;
  domain?: string;
  rateLimitPerFrequency: number;
  rateLimitFrequencyInSeconds: number;
  externalInputPayloadStoragePath?: string;
  externalOutputPayloadStoragePath?: string;
  workflowPriority: number;
  executionNameSpace?: string;
  isolationGroupId?: string;
  iteration: number;
  subWorkflowId?: string;
  subworkflowChanged: boolean;
  taskDefinition?: TaskDefinition;
  loopOverTask: boolean;
  queueWaitTime: number;
}

/**
 * Workflow Definition
 */
export interface WorkflowDefinition {
  ownerApp?: string;
  createTime?: number;
  updateTime?: number;
  createdBy?: string;
  updatedBy?: string;
  name?: string;
  description?: string;
  version?: number;
  tasks?: WorkflowTaskDefinition[];
  inputParameters?: string[];
  outputParameters?: Record<string, unknown>;
  failureWorkflow?: string;
  schemaVersion?: number;
  restartable?: boolean;
  workflowStatusListenerEnabled?: boolean;
  ownerEmail?: string;
  timeoutPolicy?: string;
  timeoutSeconds?: number;
  variables?: Record<string, unknown>;
  inputTemplate?: Record<string, unknown>;
}

/**
 * Task log entry returned from /api/tasks/{taskId}/log
 */
export interface TaskLog {
  taskId: string;
  log: string;
  createdTime: number;
}

/**
 * Detailed execution data returned from /api/workflow/{workflowId}
 */
export interface ExecutionDetails extends ExecutionSummary {
  workflowInstanceId: string;
  workflowId: string;
  workflowName?: string;
  workflowVersion?: number;
  parentWorkflowId?: string;
  parentWorkflowTaskId?: string;
  tasks: TaskExecution[];
  variables?: Record<string, unknown>;
  schemaVersion?: number;
  updateTime?: number;
  createTime?: number;
  createdBy?: string;
  updatedBy?: string;
  failedReferenceTaskNames?: string[];
  failedTaskNames?: string[];
  externalInputPayloadStoragePath?: string;
  externalOutputPayloadStoragePath?: string;
  correlationId?: string;
  reRunFromWorkflowId?: string;
  reasonForIncompletion?: string;
  event?: string;
  taskToDomain?: Record<string, string>;
  workflowDefinition?: WorkflowDefinition;
  priority?: number;
  lastRetriedTime?: number;
  ownerApp?: string;
}

/**
 * Search response wrapper
 */
export interface SearchResponse<T> {
  results: T[];
  totalHits: number;
  totalPages?: number;
}

/**
 * Fetch execution summary list from /search endpoint
 * Used for populating the executions table with lightweight data
 * @param workflowType - Optional filter by workflow type
 * @param status - Optional filter by execution status
 * @param start - Pagination start
 * @param size - Page size
 * @returns Promise<SearchResponse<ExecutionSummary>>
 */
export async function fetchExecutionSummaries(
  workflowType?: string,
  status?: string,
  start: number = 0,
  size: number = 50
): Promise<SearchResponse<ExecutionSummary>> {
  try {
    const params = new URLSearchParams();
    params.append('start', start.toString());
    params.append('size', size.toString());

    if (workflowType) {
      params.append('workflowType', workflowType);
    }
    if (status) {
      params.append('status', status);
    }

    // Use proxy endpoint instead of direct API call
    const response = await fetch(`/api/workflow/search?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch executions: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching execution summaries:', error);
    throw error;
  }
}

/**
 * Fetch detailed execution data from /api/workflow/{workflowId}
 * Standard Conductor endpoint for retrieving a workflow execution by ID
 * @param workflowId - Workflow instance ID to fetch
 * @returns Promise<ExecutionDetails>
 */
export async function fetchExecutionDetails(workflowId: string): Promise<ExecutionDetails> {
  try {
    const response = await fetch(`/api/workflow/${workflowId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch execution details: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching execution details:', error);
    throw error;
  }
}

/**
 * Fetch executions by correlation ID
 * @param correlationId - Correlation ID to search
 * @param start - Pagination start
 * @param size - Page size
 * @returns Promise<SearchResponse<ExecutionSummary>>
 */
export async function fetchExecutionsByCorrelationId(
  correlationId: string,
  start: number = 0,
  size: number = 50
): Promise<SearchResponse<ExecutionSummary>> {
  try {
    const params = new URLSearchParams();
    params.append('correlationId', correlationId);
    params.append('start', start.toString());
    params.append('size', size.toString());

    // Use proxy endpoint instead of direct API call
    const response = await fetch(`/api/workflow/search?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch executions by correlation ID: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching executions by correlation ID:', error);
    throw error;
  }
}

/**
 * Terminate a running workflow execution
 * Standard Conductor endpoint: DELETE /api/workflow/{workflowId}?reason=...
 * @param workflowId - Workflow instance ID to terminate
 * @param reason - Optional reason for termination
 * @returns Promise<void>
 */
export async function terminateExecution(
  workflowId: string,
  reason?: string
): Promise<void> {
  try {
    const url = new URL(`/api/workflow/${workflowId}`, globalThis.location.origin);
    if (reason) {
      url.searchParams.append('reason', reason);
    }

    const response = await fetch(url.toString(), {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to terminate execution: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error terminating execution:', error);
    throw error;
  }
}

/**
 * Pause a running workflow execution
 * Standard Conductor endpoint: PUT /api/workflow/{workflowId}/pause
 * @param workflowId - Workflow instance ID to pause
 * @returns Promise<void>
 */
export async function pauseExecution(workflowId: string): Promise<void> {
  try {
    const response = await fetch(`/api/workflow/${workflowId}/pause`, {
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error(`Failed to pause execution: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error pausing execution:', error);
    throw error;
  }
}

/**
 * Resume a paused workflow execution
 * Standard Conductor endpoint: PUT /api/workflow/{workflowId}/resume
 * @param workflowId - Workflow instance ID to resume
 * @returns Promise<void>
 */
export async function resumeExecution(workflowId: string): Promise<void> {
  try {
    const response = await fetch(`/api/workflow/${workflowId}/resume`, {
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error(`Failed to resume execution: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error resuming execution:', error);
    throw error;
  }
}

/**
 * Restart a completed or terminated workflow execution from the beginning
 * Standard Conductor endpoint: POST /api/workflow/{workflowId}/restart
 * @param workflowId - Workflow instance ID to restart
 * @param useLatestDefinitions - Whether to use latest workflow/task definitions (default false)
 * @returns Promise<void>
 */
export async function restartExecution(
  workflowId: string,
  useLatestDefinitions: boolean = false
): Promise<void> {
  try {
    const url = new URL(`/api/workflow/${workflowId}/restart`, globalThis.location.origin);
    url.searchParams.append('useLatestDefinitions', String(useLatestDefinitions));

    const response = await fetch(url.toString(), {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to restart execution: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error restarting execution:', error);
    throw error;
  }
}

/**
 * Retry a failed workflow execution
 * @param workflowId - Workflow instance ID to retry
 * @returns Promise<string> - Returns the new workflow ID
 */
export async function retryExecution(workflowId: string): Promise<string> {
  try {
    // Use proxy endpoint instead of direct API call
    const response = await fetch(`/api/workflow/${workflowId}/retry`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to retry execution: ${response.statusText}`);
    }

    const data = await response.text();
    return data;
  } catch (error) {
    console.error('Error retrying execution:', error);
    throw error;
  }
}

/**
 * Fetch log entries for a specific task
 * Standard Conductor endpoint: GET /api/tasks/{taskId}/log
 * @param taskId - Task instance ID
 * @returns Promise<TaskLog[]> - Array of log entries
 */
export async function fetchTaskLogs(taskId: string): Promise<TaskLog[]> {
  try {
    const response = await fetch(`/api/tasks/${taskId}/log`);

    if (!response.ok) {
      // 404 means no logs exist for this task — return empty array
      if (response.status === 404) return [];
      throw new Error(`Failed to fetch task logs: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching logs for task ${taskId}:`, error);
    return [];
  }
}

/**
 * Fetch and aggregate logs across all tasks of a workflow execution.
 * Conductor stores logs per-task (GET /api/tasks/{taskId}/log).
 * @param execution - Full ExecutionDetails object (must include tasks array)
 * @returns Promise<string> - Formatted log content sorted by time
 */
export async function fetchExecutionLogs(execution: ExecutionDetails): Promise<string> {
  try {
    if (!execution.tasks || execution.tasks.length === 0) {
      return '[No tasks found in this execution]';
    }

    // Fetch logs for all tasks in parallel
    const taskLogResults = await Promise.all(
      execution.tasks.map(async (task) => {
        const logs = await fetchTaskLogs(task.taskId);
        return { task, logs };
      })
    );

    // Build a flat sorted log string
    const allEntries: Array<{ time: number; line: string }> = [];

    for (const { task, logs } of taskLogResults) {
      if (logs.length > 0) {
        for (const entry of logs) {
          allEntries.push({
            time: entry.createdTime,
            line: `[${new Date(entry.createdTime).toISOString()}] [${task.referenceTaskName}] ${entry.log}`,
          });
        }
      }
    }

    allEntries.sort((a, b) => a.time - b.time);

    if (allEntries.length === 0) {
      return '[No task log entries found. Workers must explicitly add logs via POST /api/tasks/{taskId}/log]';
    }

    return allEntries.map((e) => e.line).join('\n');
  } catch (error) {
    console.error('Error fetching execution logs:', error);
    throw error;
  }
}
