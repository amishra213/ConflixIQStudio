// HTTP Task
export { HttpTaskModal, type HttpTaskConfig, type HttpRequest } from './HttpSystemTaskModal';

// Kafka
export {
  KafkaPublishTaskModal,
  type KafkaPublishTaskConfig,
  type KafkaRequest,
} from './KafkaPublishSystemTaskModal';

// JSON JQ Transform
export {
  JsonJqTransformTaskModal,
  type JsonJqTransformTaskConfig,
} from './JsonJqTransformSystemTaskModal';

// INLINE
export { InlineSystemTaskModal, type InlineSystemTaskConfig } from './InlineSystemTaskModal';

// EVENT
export { EventSystemTaskModal, type EventSystemTaskConfig } from './EventSystemTaskModal';

// WAIT
export { WaitSystemTaskModal, type WaitSystemTaskConfig } from './WaitSystemTaskModal';

// NOOP
export { NoopSystemTaskModal, type NoopSystemTaskConfig } from './NoopSystemTaskModal';

// TERMINATE
export {
  TerminateSystemTaskModal,
  type TerminateSystemTaskConfig,
} from './TerminateSystemTaskModal';

// HUMAN
export { HumanSystemTaskModal, type HumanTaskConfig } from './HumanSystemTaskModal';

// Type unions for all system tasks
export type SystemTaskConfig =
  | import('./HttpSystemTaskModal').HttpTaskConfig
  | import('./KafkaPublishSystemTaskModal').KafkaPublishTaskConfig
  | import('./JsonJqTransformSystemTaskModal').JsonJqTransformTaskConfig
  | import('./InlineSystemTaskModal').InlineSystemTaskConfig
  | import('./EventSystemTaskModal').EventSystemTaskConfig
  | import('./WaitSystemTaskModal').WaitSystemTaskConfig
  | import('./NoopSystemTaskModal').NoopSystemTaskConfig
  | import('./TerminateSystemTaskModal').TerminateSystemTaskConfig
  | import('./HumanSystemTaskModal').HumanTaskConfig;

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
