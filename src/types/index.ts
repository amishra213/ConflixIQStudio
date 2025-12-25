export interface Task {
  id: string;
  name: string;
  type: string;
  description: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    taskId: string;
    status?: 'idle' | 'running' | 'success' | 'failed';
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  status: 'draft' | 'active' | 'paused';
  publicationStatus?: 'LOCAL' | 'PUBLISHED';
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startTime: string;
  endTime?: string;
  duration?: number;
  input?: unknown;
  output?: unknown;
  tasks: {
    taskId: string;
    taskName: string;
    taskType?: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: string;
    endTime?: string;
    input?: unknown;
    output?: unknown;
  }[];
}
