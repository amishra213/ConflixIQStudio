import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Workflow } from "@/stores/workflowStore";

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
  tasks?: Array<{
    name?: string;
    type?: string;
    description?: string;
    taskReferenceName?: string;
    inputParameters?: Record<string, unknown>;
    optional?: boolean;
    asyncComplete?: boolean;
  }>;
}

export type { ConductorWorkflow };

/**
 * Converts a Conductor API workflow to local Workflow format
 */
export function conductorWorkflowToLocal(conductorWorkflow: ConductorWorkflow): Workflow {
  const workflow: Workflow = {
    id: `${conductorWorkflow.name}-v${conductorWorkflow.version}`,
    name: conductorWorkflow.name,
    description: conductorWorkflow.description || '',
    nodes: [],
    edges: [],
    createdAt: new Date(conductorWorkflow.createTime || Date.now()).toISOString(),
    status: 'active',
    publicationStatus: 'PUBLISHED', // Workflows loaded from server are published
    settings: {
      description: conductorWorkflow.description || '',
      version: conductorWorkflow.version || 1,
      timeoutSeconds: conductorWorkflow.timeoutSeconds || 0,
      restartable: conductorWorkflow.restartable || true,
      schemaVersion: conductorWorkflow.schemaVersion || 2,
      effectiveDate: new Date(conductorWorkflow.createTime || Date.now()).toISOString(),
      endDate: '',
      status: 'ACTIVE',
      inputParameters: conductorWorkflow.inputParameters || [],
      outputParameters: conductorWorkflow.outputParameters || {},
    },
  };

  // Generate nodes from tasks if available
  if (Array.isArray(conductorWorkflow.tasks) && conductorWorkflow.tasks.length > 0) {
    workflow.nodes = conductorWorkflow.tasks.map((task, index) => ({
      id: `task-${index}`,
      type: 'default',
      position: { x: index * 300, y: 0 },
      data: {
        label: task.name || `Task ${index + 1}`,
        taskId: task.name,
        taskType: task.type,
        taskName: task.taskReferenceName || task.name,
        sequenceNo: index,
        config: {
          description: task.description || '',
          inputParameters: task.inputParameters || {},
          optional: task.optional || false,
          asyncComplete: task.asyncComplete || false,
        },
      },
    }));

    // Generate simple linear edges
    for (let i = 0; i < workflow.nodes.length - 1; i++) {
      workflow.edges.push({
        id: `edge-${i}`,
        source: `task-${i}`,
        target: `task-${i + 1}`,
      });
    }
  }

  return workflow;
}
