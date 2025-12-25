/**
 * Task Definition Type
 * Represents a task definition from the Conductor API
 */
export interface TaskDefinition {
  ownerApp?: string;
  createTime?: number;
  updateTime?: number;
  createdBy?: string;
  updatedBy?: string;
  name: string;
  description?: string;
  retryCount?: number;
  timeoutSeconds?: number;
  inputKeys?: string[];
  outputKeys?: string[];
  timeoutPolicy?: 'RETRY' | 'ALERT' | 'SKIP';
  retryLogic?: 'FIXED' | 'EXPONENTIAL_BACKOFF' | 'LINEAR_BACKOFF';
  retryDelaySeconds?: number;
  responseTimeoutSeconds?: number;
  concurrentExecLimit?: number;
  inputTemplate?: Record<string, unknown>;
  rateLimitPerFrequency?: number;
  rateLimitFrequencyInSeconds?: number;
  isolationGroupId?: string;
  executionNameSpace?: string;
  ownerEmail?: string;
  pollTimeoutSeconds?: number;
  backoffScaleFactor?: number;
}

export interface TaskDefinitionListResponse extends Array<TaskDefinition> {}

export interface TaskDefinitionFilter {
  name?: string;
  description?: string;
  timeoutPolicy?: string;
  retryLogic?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}
