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
    id: 'FORK_JOIN',
    name: 'Fork/Join',
    description: 'Execute tasks in parallel and wait for completion',
    type: 'FORK_JOIN',
    color: '#9c27b0',
  },
  {
    id: 'FORK_JOIN_DYNAMIC',
    name: 'Fork/Join Dynamic',
    description: 'Execute dynamic number of parallel tasks',
    type: 'FORK_JOIN_DYNAMIC',
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
    id: 'EXCLUSIVE_JOIN',
    name: 'Exclusive Join',
    description: 'Wait for one of multiple tasks to complete',
    type: 'EXCLUSIVE_JOIN',
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
    id: 'LAMBDA',
    name: 'Lambda',
    description: 'Execute inline JavaScript expressions',
    type: 'LAMBDA',
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
    id: 'WAIT',
    name: 'Wait',
    description: 'Wait for a specified duration',
    type: 'WAIT',
    color: '#9c27b0',
  },
  {
    id: 'EVENT',
    name: 'Event',
    description: 'Wait for an external event',
    type: 'EVENT',
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
    id: 'SUB_WORKFLOW',
    name: 'Sub Workflow',
    description: 'Execute a sub-workflow',
    type: 'SUB_WORKFLOW_OPERATOR',
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
    id: 'HTTP',
    name: 'HTTP',
    description: 'Make HTTP API calls',
    type: 'HTTP',
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
    id: 'GRPC',
    name: 'gRPC',
    description: 'Make gRPC service calls',
    type: 'GRPC',
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
    id: 'JSON_JQ_TRANSFORM_STRING',
    name: 'JSON JQ Transform (String)',
    description: 'Transform JSON strings using JQ expressions',
    type: 'JSON_JQ_TRANSFORM_STRING',
    color: '#ff9800',
  },
  {
    id: 'NOOP',
    name: 'No-Op',
    description: 'No operation - placeholder task',
    type: 'NOOP',
    color: '#ff9800',
  },
];
