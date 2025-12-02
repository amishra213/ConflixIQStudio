import { create } from 'zustand';
import { fileStoreClient } from '@/utils/fileStore';

export interface Task {
  id: string;
  name: string;
  type: string;
  description: string;
  config?: unknown;
}

export interface WorkflowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: {
    label: string;
    taskId?: string;
    taskType?: string;
    taskName?: string;
    color?: string;
    sequenceNo?: number;
    config?: unknown;
    status?: 'idle' | 'running' | 'success' | 'failed';
    onEdit?: (nodeId: string) => void;
    onDelete?: (nodeId: string) => void;
    [key: string]: unknown; // Allow additional properties
  };
  [key: string]: unknown; // Allow additional ReactFlow properties
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: unknown;
  [key: string]: unknown; // Allow additional properties
}

export interface WorkflowSettings {
  description: string;
  version: number;
  timeoutSeconds: number;
  timeoutPolicy?: 'TIME_OUT_WF' | 'ALERT_ONLY';
  restartable: boolean;
  schemaVersion: number;
  effectiveDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED';
  inputParameters: string[];
  outputParameters: Record<string, unknown>;
  inputTemplate?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  ownerEmail?: string;
  ownerApp?: string;
  accessPolicy?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  failureWorkflow?: string;
  workflowStatusListenerEnabled?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version?: number;
  schemaVersion?: number;
  ownerEmail?: string;
  ownerApp?: string;
  createdBy?: string;
  updatedBy?: string;
  createTime?: string;
  updateTime?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  status: 'draft' | 'active' | 'paused'; // Business status of the workflow
  syncStatus?: 'local-only' | 'synced' | 'syncing'; // Conductor sync status
  publicationStatus?: 'LOCAL' | 'PUBLISHED'; // Internal publication status (LOCAL=cache only, PUBLISHED=on Conductor server)
  restartable?: boolean;
  timeoutSeconds?: number;
  timeoutPolicy?: 'TIME_OUT_WF' | 'ALERT_ONLY';
  workflowStatusListenerEnabled?: boolean;
  failureWorkflow?: string;
  inputParameters?: string[];
  outputParameters?: Record<string, unknown>;
  inputTemplate?: Record<string, unknown>;
  accessPolicy?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  tasks?: unknown[]; // OSS Conductor task definitions
  settings?: WorkflowSettings;
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed';
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

export interface CanvasNode {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config?: Record<string, unknown>;
}

export interface CanvasEdge {
  from: string;
  to: string;
}

interface WorkflowStore {
  workflows: Workflow[];
  tasks: Task[];
  executions: Execution[];
  selectedWorkflow: Workflow | null;
  selectedExecution: Execution | null;
  canvasNodes: CanvasNode[];
  canvasEdges: CanvasEdge[];
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: string, workflow: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  setSelectedWorkflow: (workflow: Workflow | null) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addExecution: (execution: Execution) => void;
  setSelectedExecution: (execution: Execution | null) => void;
  setCanvasNodes: (nodes: CanvasNode[]) => void;
  setCanvasEdges: (edges: CanvasEdge[]) => void;
  executeWorkflow: (workflowId: string, input?: unknown) => Execution;
  loadWorkflows: (workflows: Workflow[]) => void;
  persistWorkflows: () => Promise<void>;
  clearWorkflows: () => void;
}

export const useWorkflowStore = create<WorkflowStore>((set) => {
  // Helper function to get task status
  const getTaskStatus = (isSuccess: boolean, taskIndex: number): 'completed' | 'failed' => {
    if (isSuccess) {
      return 'completed';
    }
    return taskIndex === 0 ? 'completed' : 'failed';
  };

  // Helper function to create task output
  const createTaskOutput = (isSuccess: boolean, taskIndex: number): Record<string, unknown> => {
    if (isSuccess) {
      return {
        processed: true,
        result: `Task ${taskIndex + 1} completed successfully`,
        timestamp: new Date().toISOString(),
        data: {
          taskId: `task_${taskIndex}`,
          executionTime: Math.floor(Math.random() * 1000) + 100,
          recordsProcessed: Math.floor(Math.random() * 100) + 1,
        },
      };
    }
    return {
      error: 'Task failed',
      errorCode: 'TASK_ERROR',
      message: `Task ${taskIndex + 1} encountered an error`,
      timestamp: new Date().toISOString(),
    };
  };

  // Helper function to map task with completion data
  const mapCompletedTask = (
    task: Execution['tasks'][0],
    index: number,
    isSuccess: boolean
  ): Execution['tasks'][0] => ({
    ...task,
    status: getTaskStatus(isSuccess, index),
    endTime: new Date().toISOString(),
    input: task.input || {
      workflowInput: {},
      taskIndex: index,
      timestamp: new Date().toISOString(),
    },
    output: createTaskOutput(isSuccess, index),
  });

  // Helper function to map completed execution
  const mapCompletedExecution = (
    exec: Execution,
    executionId: string,
    isSuccess: boolean
  ): Execution => {
    if (exec.id !== executionId) {
      return exec;
    }

    const executionStatus = isSuccess ? 'completed' : 'failed';
    const executionOutput = isSuccess
      ? { status: 'success', result: 'Workflow completed successfully' }
      : { status: 'error', message: 'Workflow failed' };

    const completedTasks = exec.tasks.map((task, index) =>
      mapCompletedTask(task, index, isSuccess)
    );

    return {
      ...exec,
      status: executionStatus,
      endTime: new Date().toISOString(),
      duration: Math.floor(Math.random() * 5000) + 1000,
      output: executionOutput,
      tasks: completedTasks,
    };
  };

  // Helper function to complete execution simulation
  const completeExecutionSimulation = (executionId: string): void => {
    const isSuccess = Math.random() > 0.2;
    set((state) => ({
      executions: state.executions.map((exec) =>
        mapCompletedExecution(exec, executionId, isSuccess)
      ),
    }));
  };

  return {
    workflows: [],
    tasks: [],
    executions: [],
    selectedWorkflow: null,
    selectedExecution: null,
    canvasNodes: [],
    canvasEdges: [],
    addWorkflow: (workflow) =>
      set((state) => {
        // Check if workflow with same name already exists
        const existingIndex = state.workflows.findIndex((w) => w.name === workflow.name);

        if (existingIndex >= 0) {
          // Replace existing workflow with updated version
          console.log(
            `[WorkflowStore] Replacing existing workflow "${workflow.name}" with updated version`
          );
          const updatedWorkflows = [...state.workflows];
          updatedWorkflows[existingIndex] = workflow;
          return { workflows: updatedWorkflows };
        }

        // Add as new workflow if it doesn't exist
        console.log(`[WorkflowStore] Adding new workflow "${workflow.name}"`);
        return { workflows: [...state.workflows, workflow] };
      }),
    updateWorkflow: (id, workflow) =>
      set((state) => ({
        workflows: state.workflows.map((w) => (w.id === id ? { ...w, ...workflow } : w)),
        selectedWorkflow:
          state.selectedWorkflow?.id === id
            ? { ...state.selectedWorkflow, ...workflow }
            : state.selectedWorkflow,
      })),
    deleteWorkflow: (id) =>
      set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== id),
      })),
    setSelectedWorkflow: (workflow) => set({ selectedWorkflow: workflow }),
    addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
    updateTask: (id, task) =>
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...task } : t)),
      })),
    deleteTask: (id) =>
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      })),
    addExecution: (execution) => set((state) => ({ executions: [execution, ...state.executions] })),
    setSelectedExecution: (execution) => set({ selectedExecution: execution }),
    setCanvasNodes: (nodes) => set({ canvasNodes: nodes }),
    setCanvasEdges: (edges) => set({ canvasEdges: edges }),
    executeWorkflow: (workflowId, input = {}) => {
      const state = useWorkflowStore.getState();
      const workflow = state.workflows.find((w) => w.id === workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const newExecution: Execution = {
        id: `exec-${Date.now()}`,
        workflowId: workflow.id,
        workflowName: workflow.name,
        status: 'running',
        startTime: new Date().toISOString(),
        endTime: undefined,
        duration: undefined,
        input: input,
        output: undefined,
        tasks: [
          {
            taskId: '1',
            taskName: 'Initialize Workflow',
            status: 'running',
            startTime: new Date().toISOString(),
            input: input,
            output: undefined,
          },
          {
            taskId: '2',
            taskName: 'Process Data',
            status: 'pending',
            input: undefined,
            output: undefined,
          },
          {
            taskId: '3',
            taskName: 'Finalize',
            status: 'pending',
            input: undefined,
            output: undefined,
          },
        ],
      };

      set((state) => ({
        executions: [newExecution, ...state.executions],
      }));

      // Simulate execution completion after 3 seconds
      setTimeout(() => {
        completeExecutionSimulation(newExecution.id);
      }, 3000);

      return newExecution;
    },
    loadWorkflows: (workflows) => set({ workflows }),
    persistWorkflows: async () => {
      // Get current state and persist to filestore
      const state = useWorkflowStore.getState();
      const workflows = state.workflows;

      // Also save to localStorage for quick access
      try {
        localStorage.setItem('workflows', JSON.stringify(workflows));
        console.log('Workflows persisted to localStorage');
      } catch (err) {
        console.warn('Failed to save workflows to localStorage:', err);
      }

      // Save each workflow to filestore as individual file for scalability and Git compatibility
      try {
        let savedCount = 0;
        for (const wf of workflows) {
          const workflowToSave = {
            id: wf.id,
            name: wf.name,
            description: wf.description,
            version: wf.version,
            schemaVersion: wf.schemaVersion,
            ownerEmail: wf.ownerEmail,
            ownerApp: wf.ownerApp,
            createdBy: wf.createdBy,
            updatedBy: wf.updatedBy,
            createTime: wf.createTime,
            updateTime: wf.updateTime,
            nodes: wf.nodes, // Complete node data with all task configurations
            edges: wf.edges, // All edge connections
            createdAt: wf.createdAt,
            status: wf.status,
            syncStatus: wf.syncStatus,
            restartable: wf.restartable,
            timeoutSeconds: wf.timeoutSeconds,
            timeoutPolicy: wf.timeoutPolicy,
            workflowStatusListenerEnabled: wf.workflowStatusListenerEnabled,
            failureWorkflow: wf.failureWorkflow,
            inputParameters: wf.inputParameters,
            outputParameters: wf.outputParameters,
            inputTemplate: wf.inputTemplate,
            accessPolicy: wf.accessPolicy,
            variables: wf.variables,
            tasks: wf.tasks, // OSS Conductor task definitions
            settings: wf.settings, // Complete workflow settings
            publicationStatus: wf.publicationStatus,
          };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await fileStoreClient.saveWorkflow(workflowToSave as any);
          if (result) {
            savedCount++;
            console.log(
              `Persisted workflow ${wf.name} to filestore (${savedCount}/${workflows.length})`
            );
          } else {
            console.warn(`Failed to persist workflow ${wf.name} to filestore`);
          }
        }
        console.log(
          `Successfully persisted ${savedCount}/${workflows.length} workflows to filestore with individual files`
        );
      } catch (err) {
        console.warn('Failed to save workflows to filestore:', err);
      }
    },
    clearWorkflows: () => {
      set({ workflows: [] });
      try {
        localStorage.removeItem('workflows');
      } catch (err) {
        console.warn('Failed to clear workflows from localStorage:', err);
      }
    },
  };
});
