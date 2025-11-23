/**
 * Utility to convert local workflow definitions to Conductor-compatible format
 * Handles field validation, cleaning internal graph fields, and ensuring required fields
 */

export interface WorkflowTask {
  name: string;
  taskReferenceName: string;
  type: string;
  description?: string;
  optional?: boolean;
  startDelay?: number;
  inputParameters?: Record<string, unknown>;
  decisionCases?: Record<string, WorkflowTask[]>;
  defaultCase?: WorkflowTask[];
  forkTasks?: WorkflowTask[][];
  joinOn?: string[];
  loopCondition?: string;
  loopOver?: WorkflowTask[];
}

export interface WorkflowDefinition {
  name: string;
  description?: string;
  version?: number;
  tasks: WorkflowTask[];
  inputParameters?: string[];
  outputParameters?: Record<string, unknown>;
  schemaVersion?: number;
  restartable?: boolean;
  workflowStatusListenerEnabled?: boolean;
  ownerEmail?: string;
  timeoutPolicy?: string;
  timeoutSeconds?: number;
}

/**
 * Recursively clean a task object or array of tasks, removing internal graph fields
 */
function cleanTaskObject(obj: unknown, excludedFields: Set<string>): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanTaskObject(item, excludedFields));
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (!excludedFields.has(key)) {
        if (typeof value === 'object' && value !== null) {
          cleaned[key] = cleanTaskObject(value, excludedFields);
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Add default values for required fields in operator tasks
 */
function ensureRequiredOperatorFields(task: Record<string, unknown>): Record<string, unknown> {
  const result = { ...task };
  
  // Ensure required fields for specific operator types
  const taskType = result.type as string;
  
  switch (taskType) {
    case 'DO_WHILE':
      // DO_WHILE requires loopCondition and loopOver
      // loopCondition should be a string expression that evaluates to boolean
      if (!result.loopCondition) {
        result.loopCondition = 'True'; // Default condition matching Conductor's expected format
      }
      // loopOver should contain full task objects, not strings
      if (!result.loopOver) {
        result.loopOver = []; // Can be empty, will be filled at runtime
      }
      break;
      
    case 'FORK_JOIN':
      // FORK_JOIN requires forkTasks
      if (!result.forkTasks) {
        result.forkTasks = [[]];
      }
      break;
      
    case 'SWITCH':
      // SWITCH requires expression and decisionCases
      if (!result.expression) {
        result.expression = '${workflow.input}';
      }
      if (!result.decisionCases) {
        result.decisionCases = {};
      }
      break;
      
    case 'DYNAMIC':
      // DYNAMIC requires dynamicTaskNameParam
      if (!result.dynamicTaskNameParam) {
        result.dynamicTaskNameParam = 'taskName';
      }
      break;
  }
  
  return result;
}

/**
 * Convert local workflow (from designer) to Conductor-compatible format
 * Removes internal graph fields, cleans task objects, and ensures required fields are present
 */
export function localWorkflowToConductor(workflow: any): WorkflowDefinition {
  const tasks: WorkflowTask[] = [];

  // Extract settings from workflow.settings or use defaults
  const settings = workflow.settings || {};

  // Valid fields according to GraphQL WorkflowTaskInput schema
  // Explicitly exclude internal graph fields like taskRefId, nodeId, etc.
  const validTaskFields = new Set([
    'name', 'taskReferenceName', 'type', 'workflowTaskType', 'description',
    'inputParameters', 'outputParameters', 'optional', 'asyncComplete',
    'retryCount', 'startDelay', 'rateLimited', 'evaluatorType', 'expression',
    'scriptExpression', 'decisionCases', 'defaultCase', 'forkTasks', 'joinOn',
    'defaultExclusiveJoinTask', 'loopCondition', 'loopOver',
    'dynamicForkTasksParam', 'dynamicForkTasksInputParamName',
    'dynamicTaskNameParam', 'sink', 'subWorkflowParam', 'taskDefinition'
  ]);

  // Fields to explicitly exclude (internal graph representation only)
  const excludedFields = new Set([
    'taskRefId', 'nodeId', 'id', 'label', 'taskName', 'taskType', 'x', 'y',
    'position', 'data', 'config', '__typename'
  ]);

  if (workflow.nodes && workflow.nodes.length > 0) {
    for (const node of workflow.nodes) {
      // Extract the full task config from node data
      const taskConfig = node.data?.config || {};

      // Filter to only valid fields and clean up invalid ones
      const cleanConfig: Record<string, any> = {};
      for (const [key, value] of Object.entries(taskConfig)) {
        // Skip excluded fields
        if (excludedFields.has(key)) {
          continue;
        }
        // Only include valid fields
        if (validTaskFields.has(key)) {
          cleanConfig[key] = value;
        } else if (key === 'kafka_request' || key === 'http_request') {
          // Move task-specific configs into inputParameters
          cleanConfig.inputParameters = {
            ...cleanConfig.inputParameters,
            [key]: value
          };
        }
      }

      // loopOver should contain full task objects, not just references
      // Keep the task objects as they are - Conductor expects full task definitions
      if (cleanConfig.loopOver && !Array.isArray(cleanConfig.loopOver)) {
        cleanConfig.loopOver = [];
      }

      // forkTasks should contain full task objects in each branch
      // Keep the task objects as they are - Conductor expects full task definitions
      if (cleanConfig.forkTasks && Array.isArray(cleanConfig.forkTasks)) {
        // Validate that each branch is an array
        cleanConfig.forkTasks = cleanConfig.forkTasks.map((branch: any) => {
          return Array.isArray(branch) ? branch : [];
        });
      }

      // defaultCase should contain full task objects, not strings
      if (cleanConfig.defaultCase && !Array.isArray(cleanConfig.defaultCase)) {
        cleanConfig.defaultCase = [];
      }

      // Clean decisionCases - recursively clean nested tasks in each case
      if (cleanConfig.decisionCases && typeof cleanConfig.decisionCases === 'object') {
        const cleanedCases: Record<string, unknown> = {};
        for (const [caseKey, caseTasks] of Object.entries(cleanConfig.decisionCases)) {
          if (Array.isArray(caseTasks)) {
            cleanedCases[caseKey] = caseTasks.map(task => cleanTaskObject(task, excludedFields));
          } else {
            cleanedCases[caseKey] = cleanTaskObject(caseTasks, excludedFields);
          }
        }
        cleanConfig.decisionCases = cleanedCases;
      }

      // Final pass: clean any remaining nested objects/arrays to remove excluded fields
      const finalCleanConfig = cleanTaskObject(cleanConfig, excludedFields) as Record<string, unknown>;

      // Create the task object
      const taskObject: Record<string, unknown> = {
        name: node.data?.taskName || node.data?.label || 'Unnamed Task',
        taskReferenceName: node.id,
        type: node.data?.taskType || 'GENERIC',
        description: node.data?.description,
        inputParameters: finalCleanConfig.inputParameters || node.data?.inputParameters || {},
        ...finalCleanConfig, // Spread additional task fields from config
      };

      // Ensure required fields are present for operator tasks
      const taskWithDefaults = ensureRequiredOperatorFields(taskObject);
      
      tasks.push(taskWithDefaults as unknown as WorkflowTask);
    }
  }

  return {
    name: workflow.name || 'Unnamed Workflow',
    description: workflow.description || settings.description || '',
    version: settings.version || workflow.version || 1,
    tasks,
    inputParameters: settings.inputParameters || workflow.inputParameters || [],
    outputParameters: settings.outputParameters || workflow.outputParameters || {},
    timeoutSeconds: settings.timeoutSeconds || workflow.timeoutSeconds || 3600,
    restartable: settings.restartable ?? workflow.restartable ?? true,
    schemaVersion: settings.schemaVersion || workflow.schemaVersion || 2,
    timeoutPolicy: settings.timeoutPolicy || workflow.timeoutPolicy || 'TIME_OUT_WF',
    workflowStatusListenerEnabled: settings.workflowStatusListenerEnabled || workflow.workflowStatusListenerEnabled || false,
  };
}
