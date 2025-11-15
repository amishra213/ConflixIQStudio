// HTTP Task
export { HttpTaskModal, type HttpTaskConfig, type HttpRequest } from './HttpTaskModal';

// Kafka
export {
  KafkaPublishTaskModal,
  type KafkaPublishTaskConfig,
  type KafkaRequest,
} from './KafkaPublishTaskModal';

// GRPC
export { GrpcTaskModal, type GrpcTaskConfig, type GrpcRequest } from './GrpcTaskModal';

// JSON JQ Transform
export {
  JsonJqTransformTaskModal,
  type JsonJqTransformTaskConfig,
} from './JsonJqTransformTaskModal';

// JSON JQ Transform String
export {
  JsonJqTransformStringTaskModal,
  type JsonJqTransformStringTaskConfig,
} from './JsonJqTransformStringTaskModal';

// INLINE
export {
  InlineSystemTaskModal,
  type InlineSystemTaskConfig,
} from './InlineSystemTaskModal';

// EVENT
export {
  EventSystemTaskModal,
  type EventSystemTaskConfig,
} from './EventSystemTaskModal';

// WAIT
export {
  WaitSystemTaskModal,
  type WaitSystemTaskConfig,
} from './WaitSystemTaskModal';

// NOOP
export {
  NoopSystemTaskModal,
  type NoopSystemTaskConfig,
} from './NoopSystemTaskModal';

// SET_VARIABLE
export {
  SetVariableSystemTaskModal,
  type SetVariableSystemTaskConfig,
} from './SetVariableSystemTaskModal';

// SUB_WORKFLOW
export {
  SubWorkflowSystemTaskModal,
  type SubWorkflowSystemTaskConfig,
  type SubWorkflowParam,
} from './SubWorkflowSystemTaskModal';

// TERMINATE
export {
  TerminateSystemTaskModal,
  type TerminateSystemTaskConfig,
} from './TerminateSystemTaskModal';

// Type unions for all system tasks
export type SystemTaskConfig =
  | import('./HttpTaskModal').HttpTaskConfig
  | import('./KafkaPublishTaskModal').KafkaPublishTaskConfig
  | import('./GrpcTaskModal').GrpcTaskConfig
  | import('./JsonJqTransformTaskModal').JsonJqTransformTaskConfig
  | import('./JsonJqTransformStringTaskModal').JsonJqTransformStringTaskConfig
  | import('./InlineSystemTaskModal').InlineSystemTaskConfig
  | import('./EventSystemTaskModal').EventSystemTaskConfig
  | import('./WaitSystemTaskModal').WaitSystemTaskConfig
  | import('./NoopSystemTaskModal').NoopSystemTaskConfig
  | import('./SetVariableSystemTaskModal').SetVariableSystemTaskConfig
  | import('./SubWorkflowSystemTaskModal').SubWorkflowSystemTaskConfig
  | import('./TerminateSystemTaskModal').TerminateSystemTaskConfig;

export type SystemTaskType =
  | 'HTTP'
  | 'KAFKA_PUBLISH'
  | 'GRPC'
  | 'JSON_JQ_TRANSFORM'
  | 'JSON_JQ_TRANSFORM_STRING'
  | 'INLINE'
  | 'EVENT'
  | 'WAIT'
  | 'NOOP'
  | 'SET_VARIABLE'
  | 'SUB_WORKFLOW'
  | 'TERMINATE';
