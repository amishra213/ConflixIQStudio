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
  conditionGroups: ConditionGroup[];
  description?: string;
  evaluateBefore?: string | null;
  joinType: JoinType;
}

export interface AlertConfig {
  id: string; // Unique ID for the alert rule
  configurationId: string;
  configurationType: 'VALIDATION_RULES';
  effectiveEnd: string;
  effectiveStart: string;
  enabled: boolean;
  entity: string;
  filterConditions: FilterConditions;
  operationType: 'ALERT';
  orgId: string;
  priority: number;
  updateTime: string;
  updateUser: string;
  validationConditions: ValidationConditions[];
  version: number;
  customEvaluation?: boolean;
  customEvaluatorParams?: Record<string, any>;
}

// Extend Node data for React Flow if needed, though not directly used in AlertConfigModal
export interface CustomNodeData {
  label: string;
  taskType: string;
  taskName: string;
  color?: string;
  sequenceNo?: number;
  config?: any;
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

export interface CustomNode extends Node {
  data: CustomNodeData;
}
