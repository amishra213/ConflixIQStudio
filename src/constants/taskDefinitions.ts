export interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  type: string;
  color: string;
}

// Worker Tasks - Currently only SIMPLE is supported by Conductor Server
export const workerTasks: TaskDefinition[] = [
  {
    id: 'SIMPLE',
    name: 'Simple Task',
    description: 'Execute a simple task with custom business logic',
    type: 'SIMPLE',
    color: '#00bcd4',
  },
];

// Workflow Operators
export const operators: TaskDefinition[] = [
  {
    id: 'DO_WHILE',
    name: 'Do While',
    description: 'Loop until condition is met',
    type: 'DO_WHILE',
    color: '#9c27b0',
  },
  {
    id: 'DYNAMIC',
    name: 'Dynamic',
    description: 'Execute a task determined dynamically at runtime',
    type: 'DYNAMIC',
    color: '#9c27b0',
  },
  {
    id: 'FORK_JOIN',
    name: 'Fork/Join',
    description: 'Execute tasks in parallel and wait for completion',
    type: 'FORK_JOIN',
    color: '#9c27b0',
  },
  {
    id: 'FORK_JOIN_DYNAMIC',
    name: 'Dynamic Fork/Join',
    description: 'Execute dynamic number of parallel tasks',
    type: 'FORK_JOIN_DYNAMIC',
    color: '#9c27b0',
  },
  {
    id: 'INLINE',
    name: 'Inline',
    description: 'Execute inline code',
    type: 'INLINE_OPERATOR',
    color: '#9c27b0',
  },
  {
    id: 'JOIN',
    name: 'Join',
    description: 'Wait for multiple tasks to complete',
    type: 'JOIN',
    color: '#9c27b0',
  },
  {
    id: 'SET_VARIABLE',
    name: 'Set Variable',
    description: 'Set workflow variables',
    type: 'SET_VARIABLE',
    color: '#9c27b0',
  },
  {
    id: 'START_WORKFLOW',
    name: 'Start Workflow',
    description: 'Start another workflow asynchronously',
    type: 'START_WORKFLOW',
    color: '#9c27b0',
  },
  {
    id: 'SUB_WORKFLOW',
    name: 'Sub Workflow',
    description: 'Execute a sub-workflow',
    type: 'SUB_WORKFLOW_OPERATOR',
    color: '#9c27b0',
  },
  {
    id: 'SWITCH',
    name: 'Switch',
    description: 'Conditional branching logic',
    type: 'SWITCH',
    color: '#9c27b0',
  },
  {
    id: 'TERMINATE',
    name: 'Terminate',
    description: 'Terminate the workflow execution',
    type: 'TERMINATE',
    color: '#f44336',
  },
];

// System Tasks
export const systemTasks: TaskDefinition[] = [
  {
    id: 'EVENT',
    name: 'Event',
    description: 'Wait for an external event',
    type: 'EVENT',
    color: '#ff9800',
  },
  {
    id: 'HTTP',
    name: 'HTTP',
    description: 'Make HTTP API calls',
    type: 'HTTP',
    color: '#ff9800',
  },
  {
    id: 'HUMAN',
    name: 'Human',
    description: 'Pause workflow and wait for external signal',
    type: 'HUMAN',
    color: '#ff9800',
  },
  {
    id: 'INLINE',
    name: 'Inline',
    description: 'Execute inline code',
    type: 'INLINE',
    color: '#ff9800',
  },
  {
    id: 'JSON_JQ_TRANSFORM',
    name: 'JSON JQ Transform',
    description: 'Transform JSON using JQ expressions',
    type: 'JSON_JQ_TRANSFORM',
    color: '#ff9800',
  },
  {
    id: 'KAFKA_PUBLISH',
    name: 'Kafka Publish',
    description: 'Publish messages to Kafka',
    type: 'KAFKA_PUBLISH',
    color: '#ff9800',
  },
  {
    id: 'NOOP',
    name: 'No-Op',
    description: 'No operation - placeholder task',
    type: 'NOOP',
    color: '#ff9800',
  },
  {
    id: 'WAIT',
    name: 'Wait',
    description: 'Wait for a specified duration',
    type: 'WAIT',
    color: '#ff9800',
  },
];
