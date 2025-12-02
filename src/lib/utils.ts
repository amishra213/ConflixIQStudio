import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Workflow } from '@/stores/workflowStore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ConductorWorkflow {
  name: string;
  description?: string;
  version?: number;
  createTime?: number | string;
  timeoutSeconds?: number;
  restartable?: boolean;
  schemaVersion?: number;
  inputParameters?: string[];
  outputParameters?: Record<string, unknown>;
  timeoutPolicy?: string;
  createdBy?: string;
  updatedBy?: string;
  ownerEmail?: string;
  ownerApp?: string;
  failureWorkflow?: string;
  workflowStatusListenerEnabled?: boolean;
  variables?: Record<string, unknown>;
  accessPolicy?: Record<string, unknown>;
  inputTemplate?: Record<string, unknown>;
  tasks?: Array<{
    name?: string;
    type?: string;
    description?: string;
    taskReferenceName?: string;
    inputParameters?: Record<string, unknown>;
    optional?: boolean;
    asyncComplete?: boolean;
    retryCount?: number;
    startDelay?: number;
    rateLimited?: boolean;
    evaluatorType?: string;
    expression?: string;
    scriptExpression?: string;
    decisionCases?: Record<string, unknown>;
    defaultCase?: unknown;
    forkTasks?: unknown;
    joinOn?: string[];
    loopCondition?: string;
    loopOver?: unknown;
    dynamicTaskNameParam?: string;
    sink?: string;
    subWorkflowParam?: Record<string, unknown>;
    workflowTaskType?: string;
    [key: string]: unknown;
  }>;
}

export type { ConductorWorkflow };

/**
 * Converts a Conductor API workflow to local Workflow format
 */
export function conductorWorkflowToLocal(conductorWorkflow: ConductorWorkflow): Workflow {
  console.log(
    `[conductorWorkflowToLocal] Converting workflow: ${conductorWorkflow.name} v${conductorWorkflow.version} with ${conductorWorkflow.tasks?.length || 0} tasks`
  );

  // Helper function to safely convert to ISO date string
  const _toISOString = (value: unknown): string => {
    try {
      // Handle null/undefined
      if (value === null || value === undefined) {
        return new Date().toISOString();
      }

      // If it's already a string that looks like ISO, return it
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.exec(value)) {
        return value;
      }

      // If it's a number (timestamp), convert it
      if (typeof value === 'number') {
        if (value === 0 || Number.isNaN(value)) {
          return new Date().toISOString();
        }
        // Conductor timestamps are in milliseconds
        return new Date(value).toISOString();
      }

      // Try to parse as date
      const date = new Date(value as string | number);
      if (Number.isNaN(date.getTime())) {
        console.warn(`[conductorWorkflowToLocal] Invalid date value, using current date`);
        return new Date().toISOString();
      }
      return date.toISOString();
    } catch (error) {
      console.warn(`[conductorWorkflowToLocal] Error converting date:`, error);
      return new Date().toISOString();
    }
  };

  // Helper to normalize timeout policy to valid values
  const normalizeTimeoutPolicy = (
    policy: string | undefined
  ): 'TIME_OUT_WF' | 'ALERT_ONLY' | undefined => {
    if (!policy) return undefined;
    if (policy === 'TIME_OUT_WF' || policy === 'ALERT_ONLY') return policy;
    // Default to TIME_OUT_WF for unknown values
    console.warn(
      `[conductorWorkflowToLocal] Unknown timeoutPolicy: ${policy}, defaulting to TIME_OUT_WF`
    );
    return 'TIME_OUT_WF';
  };

  // Helper function to parse JSON strings in task fields
  const parseTaskField = (field: unknown): unknown => {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return field; // Return as-is if not valid JSON
      }
    }
    return field;
  };

  // Helper function to get task type color
  const getTaskColor = (taskType: string): string => {
    const colorMap: Record<string, string> = {
      HTTP: '#0066cc',
      SIMPLE: '#10b981',
      HUMAN: '#f59e0b',
      INLINE: '#8b5cf6',
      KAFKA_PUBLISH: '#ec4899',
      EVENT: '#06b6d4',
      WAIT: '#6366f1',
      NOOP: '#6b7280',
      TERMINATE: '#dc2626',
      SWITCH: '#f97316',
      DO_WHILE: '#a855f7',
      FORK_JOIN: '#0ea5e9',
      DYNAMIC: '#14b8a6',
      JOIN: '#7c3aed',
      SUB_WORKFLOW: '#3b82f6',
      START_WORKFLOW: '#06b6d4',
    };
    return colorMap[taskType] || '#10b981';
  };

  const workflow: Workflow = {
    id: `${conductorWorkflow.name}-v${conductorWorkflow.version}`,
    name: conductorWorkflow.name,
    description: conductorWorkflow.description || '',
    nodes: [],
    edges: [],
    createdAt: _toISOString(conductorWorkflow.createTime),
    status: 'active',
    publicationStatus: 'PUBLISHED', // Workflows loaded from server are published
    // IMPORTANT: Preserve the original conductor tasks for accurate round-tripping
    tasks: conductorWorkflow.tasks || [],
    version: conductorWorkflow.version,
    schemaVersion: conductorWorkflow.schemaVersion,
    ownerEmail: conductorWorkflow.ownerEmail,
    ownerApp: conductorWorkflow.ownerApp,
    createdBy: conductorWorkflow.createdBy,
    updatedBy: conductorWorkflow.updatedBy,
    timeoutSeconds: conductorWorkflow.timeoutSeconds,
    timeoutPolicy: normalizeTimeoutPolicy(conductorWorkflow.timeoutPolicy),
    workflowStatusListenerEnabled: conductorWorkflow.workflowStatusListenerEnabled,
    failureWorkflow: conductorWorkflow.failureWorkflow,
    inputTemplate: conductorWorkflow.inputTemplate,
    accessPolicy: conductorWorkflow.accessPolicy,
    variables: conductorWorkflow.variables,
    settings: {
      description: conductorWorkflow.description || '',
      version: conductorWorkflow.version || 1,
      timeoutSeconds: conductorWorkflow.timeoutSeconds || 0,
      restartable: conductorWorkflow.restartable || true,
      schemaVersion: conductorWorkflow.schemaVersion || 2,
      effectiveDate: _toISOString(conductorWorkflow.createTime),
      endDate: '',
      status: 'ACTIVE',
      inputParameters: conductorWorkflow.inputParameters || [],
      outputParameters: conductorWorkflow.outputParameters || {},
      timeoutPolicy: normalizeTimeoutPolicy(conductorWorkflow.timeoutPolicy),
      ownerEmail: conductorWorkflow.ownerEmail,
      ownerApp: conductorWorkflow.ownerApp,
      createdBy: conductorWorkflow.createdBy,
      updatedBy: conductorWorkflow.updatedBy,
      workflowStatusListenerEnabled: conductorWorkflow.workflowStatusListenerEnabled,
      failureWorkflow: conductorWorkflow.failureWorkflow,
      inputTemplate: conductorWorkflow.inputTemplate,
      accessPolicy: conductorWorkflow.accessPolicy,
      variables: conductorWorkflow.variables,
    },
  };

  // Generate nodes from tasks if available
  if (Array.isArray(conductorWorkflow.tasks) && conductorWorkflow.tasks.length > 0) {
    workflow.nodes = conductorWorkflow.tasks.map((task, index) => {
      // Parse JSON strings in task fields
      const parsedTask = {
        ...task,
        defaultCase: parseTaskField(task.defaultCase),
        decisionCases: parseTaskField(task.decisionCases),
        forkTasks: parseTaskField(task.forkTasks),
        loopOver: parseTaskField(task.loopOver),
      };

      return {
        id: task.taskReferenceName || `task-${index}`,
        type: 'custom',
        position: { x: index * 300, y: 0 },
        draggable: false,
        data: {
          label: task.taskReferenceName || task.name || `Task ${index + 1}`,
          taskId: task.name,
          taskType: task.type,
          taskName: task.taskReferenceName || task.name,
          taskDescription: task.description,
          sequenceNo: index + 1,
          color: getTaskColor(task.type || 'SIMPLE'),
          config: {
            name: task.name,
            taskReferenceName: task.taskReferenceName,
            type: task.type,
            description: task.description,
            inputParameters: task.inputParameters || {},
            optional: task.optional || false,
            asyncComplete: task.asyncComplete || false,
            retryCount: task.retryCount,
            startDelay: task.startDelay,
            rateLimited: task.rateLimited,
            evaluatorType: task.evaluatorType,
            expression: task.expression,
            scriptExpression: task.scriptExpression,
            decisionCases: parsedTask.decisionCases,
            defaultCase: parsedTask.defaultCase,
            forkTasks: parsedTask.forkTasks,
            joinOn: task.joinOn,
            loopCondition: task.loopCondition,
            loopOver: parsedTask.loopOver,
            dynamicTaskNameParam: task.dynamicTaskNameParam,
            sink: task.sink,
            subWorkflowParam: task.subWorkflowParam,
            workflowTaskType: task.workflowTaskType,
            // Preserve all other fields
            ...task,
          },
        },
      };
    });

    // Generate simple linear edges
    for (let i = 0; i < workflow.nodes.length - 1; i++) {
      workflow.edges.push({
        id: `edge-${i}`,
        source: workflow.nodes[i].id,
        target: workflow.nodes[i + 1].id,
        animated: true,
        type: 'straight',
        style: { stroke: '#00bcd4', strokeWidth: 2 },
      });
    }
  }

  console.log(
    `[conductorWorkflowToLocal] Converted to workflow ID: ${workflow.id} with ${workflow.nodes.length} nodes, ${workflow.edges.length} edges, and ${workflow.tasks?.length || 0} tasks`
  );
  return workflow;
}
