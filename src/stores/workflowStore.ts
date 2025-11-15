import { create } from 'zustand';

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

export interface WorkflowSettings {
  description: string;
  version: number;
  timeoutSeconds: number;
  restartable: boolean;
  schemaVersion: number;
  orgId: string;
  workflowId: string;
  effectiveDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED';
  inputParameters: string[];
  outputParameters: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  status: 'draft' | 'active' | 'paused';
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
  tasks: {
    taskId: string;
    taskName: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: string;
    endTime?: string;
    input?: any;
    output?: any;
  }[];
}

interface WorkflowStore {
  workflows: Workflow[];
  tasks: Task[];
  executions: Execution[];
  selectedWorkflow: Workflow | null;
  selectedExecution: Execution | null;
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: string, workflow: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  setSelectedWorkflow: (workflow: Workflow | null) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addExecution: (execution: Execution) => void;
  setSelectedExecution: (execution: Execution | null) => void;
  executeWorkflow: (workflowId: string, input?: any) => Execution;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  workflows: [
    {
      id: '1',
      name: 'Data Processing Pipeline',
      description: 'ETL workflow for customer data',
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      status: 'active',
    },
    {
      id: '2',
      name: 'Notification Service',
      description: 'Send notifications to users',
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      status: 'active',
    },
  ],
  tasks: [
    { id: '1', name: 'HTTP Request', type: 'http', description: 'Make HTTP API calls' },
    { id: '2', name: 'Transform Data', type: 'transform', description: 'Transform JSON data' },
    { id: '3', name: 'Send Email', type: 'email', description: 'Send email notifications' },
    { id: '4', name: 'Database Query', type: 'database', description: 'Execute database queries' },
  ],
  executions: [
    {
      id: 'exec-1',
      workflowId: '1',
      workflowName: 'Data Processing Pipeline',
      status: 'completed',
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() - 3000000).toISOString(),
      duration: 600,
      input: {
        orderType: 'BOPIS',
        shipNode: 'DC001',
        customerId: 'CUST123',
        items: [
          { itemId: 'ITEM001', quantity: 2, price: 29.99 },
          { itemId: 'ITEM002', quantity: 1, price: 49.99 }
        ]
      },
      output: {
        status: 'success',
        orderId: 'ORD-2024-001',
        processedAt: new Date(Date.now() - 3000000).toISOString(),
        totalAmount: 109.97
      },
      tasks: [
        {
          taskId: 'http_request_1',
          taskName: 'HTTP Request',
          taskType: 'HTTP',
          status: 'completed',
          startTime: new Date(Date.now() - 3600000).toISOString(),
          endTime: new Date(Date.now() - 3500000).toISOString(),
          input: {
            url: 'https://api.example.com/orders',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
              orderType: 'BOPIS',
              shipNode: 'DC001',
              customerId: 'CUST123'
            }
          },
          output: {
            statusCode: 200,
            response: {
              orderId: 'ORD-2024-001',
              status: 'created',
              timestamp: new Date(Date.now() - 3500000).toISOString()
            }
          }
        },
        {
          taskId: 'mapper_transform_2',
          taskName: 'Transform Data',
          taskType: 'MAPPER',
          status: 'completed',
          startTime: new Date(Date.now() - 3500000).toISOString(),
          endTime: new Date(Date.now() - 3400000).toISOString(),
          input: {
            orderId: 'ORD-2024-001',
            items: [
              { itemId: 'ITEM001', quantity: 2, price: 29.99 },
              { itemId: 'ITEM002', quantity: 1, price: 49.99 }
            ]
          },
          output: {
            transformedData: {
              orderId: 'ORD-2024-001',
              totalAmount: 109.97,
              itemCount: 2,
              processedItems: [
                { id: 'ITEM001', qty: 2, total: 59.98 },
                { id: 'ITEM002', qty: 1, total: 49.99 }
              ]
            }
          }
        },
        {
          taskId: 'decision_check_inventory_3',
          taskName: 'Check Inventory Decision',
          taskType: 'DECISION',
          status: 'completed',
          startTime: new Date(Date.now() - 3400000).toISOString(),
          endTime: new Date(Date.now() - 3350000).toISOString(),
          input: {
            inventoryLevel: 'high',
            orderAmount: 109.97
          },
          output: {
            decision: 'proceed',
            reason: 'Sufficient inventory available'
          }
        },
        {
          taskId: 'generic_db_query_4',
          taskName: 'Database Query',
          taskType: 'GENERIC',
          status: 'completed',
          startTime: new Date(Date.now() - 3350000).toISOString(),
          endTime: new Date(Date.now() - 3000000).toISOString(),
          input: {
            query: 'INSERT INTO orders VALUES (?)',
            params: ['ORD-2024-001', 'CUST123', 109.97]
          },
          output: {
            rowsAffected: 1,
            insertId: 'ORD-2024-001',
            success: true
          }
        },
      ],
    },
    {
      id: 'exec-2',
      workflowId: '2',
      workflowName: 'Notification Service',
      status: 'running',
      startTime: new Date(Date.now() - 300000).toISOString(),
      input: {
        userId: 'USER456',
        notificationType: 'email',
        template: 'order_confirmation',
        data: {
          orderId: 'ORD-2024-002',
          customerName: 'John Doe'
        }
      },
      tasks: [
        {
          taskId: 'lambda_validate_1',
          taskName: 'Validate Input Lambda',
          taskType: 'LAMBDA',
          status: 'completed',
          startTime: new Date(Date.now() - 300000).toISOString(),
          endTime: new Date(Date.now() - 290000).toISOString(),
          input: {
            userId: 'USER456',
            notificationType: 'email'
          },
          output: {
            valid: true,
            sanitizedData: {
              userId: 'USER456',
              notificationType: 'email'
            }
          }
        },
        {
          taskId: 'generic_send_email_2',
          taskName: 'Send Email',
          taskType: 'GENERIC',
          status: 'running',
          startTime: new Date(Date.now() - 290000).toISOString(),
          input: {
            to: 'john.doe@example.com',
            subject: 'Order Confirmation',
            template: 'order_confirmation',
            data: {
              orderId: 'ORD-2024-002',
              customerName: 'John Doe',
              items: [
                { name: 'Product A', quantity: 1, price: 29.99 }
              ]
            }
          },
          output: undefined
        },
        {
          taskId: 'wait_signal_3',
          taskName: 'Wait for Confirmation Signal',
          taskType: 'WAIT_FOR_SIGNAL',
          status: 'pending',
          input: {
            signalName: 'email_confirmed',
            timeout: 3600
          },
          output: undefined
        },
        {
          taskId: 'passthrough_log_4',
          taskName: 'Log Activity',
          taskType: 'PASS_THROUGH',
          status: 'pending',
          input: undefined,
          output: undefined
        },
      ],
    },
  ],
  selectedWorkflow: null,
  selectedExecution: null,
  addWorkflow: (workflow) => set((state) => ({ workflows: [...state.workflows, workflow] })),
  updateWorkflow: (id, workflow) =>
    set((state) => ({
      workflows: state.workflows.map((w) => (w.id === id ? { ...w, ...workflow } : w)),
      selectedWorkflow: state.selectedWorkflow?.id === id ? { ...state.selectedWorkflow, ...workflow } : state.selectedWorkflow,
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
      const isSuccess = Math.random() > 0.2;
      set((state) => ({
        executions: state.executions.map((exec) =>
          exec.id === newExecution.id
            ? {
                ...exec,
                status: isSuccess ? 'completed' : 'failed',
                endTime: new Date().toISOString(),
                duration: Math.floor(Math.random() * 5000) + 1000,
                output: isSuccess ? { status: 'success', result: 'Workflow completed successfully' } : { status: 'error', message: 'Workflow failed' },
                tasks: exec.tasks.map((task, index) => ({
                  ...task,
                  status: isSuccess ? 'completed' : (index === 0 ? 'completed' : 'failed'),
                  endTime: new Date().toISOString(),
                  input: task.input || { 
                    workflowInput: input,
                    taskIndex: index,
                    timestamp: new Date().toISOString()
                  },
                  output: isSuccess 
                    ? { 
                        processed: true, 
                        result: `Task ${index + 1} completed successfully`,
                        timestamp: new Date().toISOString(),
                        data: {
                          taskId: task.taskId,
                          executionTime: Math.floor(Math.random() * 1000) + 100,
                          recordsProcessed: Math.floor(Math.random() * 100) + 1
                        }
                      } 
                    : { 
                        error: 'Task failed', 
                        errorCode: 'TASK_ERROR',
                        message: `Task ${index + 1} encountered an error`,
                        timestamp: new Date().toISOString()
                      },
                })),
              }
            : exec
        ),
      }));
    }, 3000);

    return newExecution;
  },
}));
