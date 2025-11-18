// HTTP Task
export { HttpTaskModal, type HttpTaskConfig, type HttpRequest } from './HttpSystemTaskModal';

// Kafka
export {
  KafkaPublishTaskModal,
  type KafkaPublishTaskConfig,
  type KafkaRequest,
} from './KafkaPublishTaskModal';

// JSON JQ Transform
export {
  JsonJqTransformTaskModal,
  type JsonJqTransformTaskConfig,
} from './JsonJqTransformTaskModal';

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

// TERMINATE
export {
  TerminateSystemTaskModal,
  type TerminateSystemTaskConfig,
} from './TerminateSystemTaskModal';

// HUMAN
export {
  HumanTaskModal,
  type HumanTaskConfig,
} from './HumanTaskModal';

// Type unions for all system tasks
export type SystemTaskConfig =
  | import('./HttpSystemTaskModal').HttpTaskConfig
  | import('./KafkaPublishTaskModal').KafkaPublishTaskConfig
  | import('./JsonJqTransformTaskModal').JsonJqTransformTaskConfig
  | import('./InlineSystemTaskModal').InlineSystemTaskConfig
  | import('./EventSystemTaskModal').EventSystemTaskConfig
  | import('./WaitSystemTaskModal').WaitSystemTaskConfig
  | import('./NoopSystemTaskModal').NoopSystemTaskConfig
  | import('./TerminateSystemTaskModal').TerminateSystemTaskConfig
  | import('./HumanTaskModal').HumanTaskConfig;

export type SystemTaskType =
  | 'HTTP'
  | 'KAFKA_PUBLISH'
  | 'JSON_JQ_TRANSFORM'
  | 'INLINE'
  | 'EVENT'
  | 'WAIT'
  | 'NOOP'
  | 'TERMINATE'
  | 'HUMAN';
