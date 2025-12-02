import { Node } from 'reactflow';

export type ConditionType =
  | 'EQUAL'
  | 'NOT_EQUAL'
  | 'IN'
  | 'NOT_IN'
  | 'LESS_THAN'
  | 'GREATER_THAN'
  | 'BETWEEN'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'DEFINED'
  | 'NOT_DEFINED'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'AFTER'
  | 'BEFORE'
  | 'NOT_NULL'
  | 'BEFORE_WITHIN'
  | 'AFTER_WITHIN';

export type JoinType = 'AND' | 'OR';

export interface Condition {
  id: string; // Unique ID for React keys
  conditionType: ConditionType;
  name: string;
  value: string;
  message?: string; // For validation conditions
  duration?: string; // For time-based conditions
  uom?: string; // Unit of measure for duration
}

export interface ConditionGroup {
  id: string; // Unique ID for React keys
  conditions: Condition[];
  joinType: JoinType;
}

export interface FilterConditions {
  conditionGroups: ConditionGroup[];
  description?: string;
  evaluateBefore?: string | null;
  joinType: JoinType;
}

export interface ValidationConditions {
  id: number;
  conditionGroups: ConditionGroup[];
  description?: string;
  evaluateBefore?: string | null;
  joinType: JoinType;
}

// Base interface for all configurations
export interface BaseConfig {
  id: string; // Unique ID for the config item in the store
  configurationId: string; // Business-defined ID
  configurationType: string; // e.g., 'VALIDATION_RULES', 'ALERT_RULES', 'FEATURE_FLAGS'
  orgId: string;
  entity: string;
  enabled: boolean;
  version: number;
  effectiveStart: string;
  effectiveEnd: string;
  updateTime: string;
  updateUser: string;
}

// Specific interface for Alert Configurations, extending BaseConfig
export interface AlertConfig extends BaseConfig {
  configurationType: 'VALIDATION_RULES'; // Specific type for alerts
  operationType: 'ALERT';
  priority: number;
  filterConditions: FilterConditions;
  validationConditions: ValidationConditions[];
  customEvaluation?: boolean;
  customEvaluatorParams?: Record<string, unknown>;
}

// Union type for all possible configurations
export type Config = AlertConfig;

// Extend Node data for React Flow if needed, though not directly used in AlertConfigModal
export interface CustomNodeData {
  label: string;
  taskType: string;
  taskName: string;
  color?: string;
  sequenceNo?: number;
  config?: Record<string, unknown>;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

export interface CustomNode extends Node {
  data: CustomNodeData;
}
