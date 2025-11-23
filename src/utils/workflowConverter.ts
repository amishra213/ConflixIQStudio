/**
 * Utility to convert local workflow definitions to Conductor-compatible format
 * Handles field validation, cleaning internal graph fields, and ensuring required fields
 */

interface WorkflowNode {
  id: string;
  data?: Record<string, unknown>;
}

interface LocalWorkflow {
  name: string;
  description?: string;
  version?: number;
  nodes?: WorkflowNode[];
  settings?: {
    description?: string;
    version?: number;
    timeoutSeconds?: number;
    timeoutPolicy?: string;
    restartable?: boolean;
    schemaVersion?: number;
    workflowStatusListenerEnabled?: boolean;
    inputParameters?: string[];
    outputParameters?: Record<string, unknown>;
  };
  timeoutSeconds?: number;
  restartable?: boolean;
  schemaVersion?: number;
  timeoutPolicy?: string;
  workflowStatusListenerEnabled?: boolean;
  inputParameters?: string[];
  outputParameters?: Record<string, unknown>;
}

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
 * Build clean config by filtering valid task fields and handling special cases
 */
function buildCleanConfig(
  taskConfig: Record<string, unknown>,
  validTaskFields: Set<string>,
  excludedFields: Set<string>
): Record<string, unknown> {
  const cleanConfig: Record<string, unknown> = {};

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
      const inputParams = typeof cleanConfig.inputParameters === 'object' && cleanConfig.inputParameters !== null
        ? cleanConfig.inputParameters as Record<string, unknown>
        : {};
      cleanConfig.inputParameters = {
        ...inputParams,
        [key]: value
      };
    }
  }

  return cleanConfig;
}

/**
 * Process and clean operator-specific task structures
 */
function processOperatorFields(cleanConfig: Record<string, unknown>, excludedFields: Set<string>): Record<string, unknown> {
  // loopOver should contain full task objects, not just references
  if (cleanConfig.loopOver && !Array.isArray(cleanConfig.loopOver)) {
    cleanConfig.loopOver = [];
  }

  // forkTasks should contain full task objects in each branch
  if (cleanConfig.forkTasks && Array.isArray(cleanConfig.forkTasks)) {
    cleanConfig.forkTasks = (cleanConfig.forkTasks as unknown[]).map((branch) => {
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

  return cleanConfig;
}

/**
 * Create task object from node data and config
 */
function createTaskObject(
  node: WorkflowNode,
  finalCleanConfig: Record<string, unknown>
): Record<string, unknown> {
  return {
    name: node.data?.taskName || node.data?.label || 'Unnamed Task',
    taskReferenceName: node.id,
    type: node.data?.taskType || 'GENERIC',
    description: node.data?.description,
    inputParameters: finalCleanConfig.inputParameters || node.data?.inputParameters || {},
    ...finalCleanConfig,
  };
}

/**
 * Process all nodes and convert to workflow tasks
 */
function processWorkflowNodes(
  nodes: WorkflowNode[] | undefined,
  validTaskFields: Set<string>,
  excludedFields: Set<string>
): WorkflowTask[] {
  const tasks: WorkflowTask[] = [];

  if (!nodes || nodes.length === 0) {
    return tasks;
  }

  for (const node of nodes) {
    const taskConfig = node.data?.config || {};
    const cleanConfig = buildCleanConfig(taskConfig as Record<string, unknown>, validTaskFields, excludedFields);
    const processedConfig = processOperatorFields(cleanConfig, excludedFields);
    const finalCleanConfig = cleanTaskObject(processedConfig, excludedFields) as Record<string, unknown>;
    const taskObject = createTaskObject(node, finalCleanConfig);
    const taskWithDefaults = ensureRequiredOperatorFields(taskObject);
    tasks.push(taskWithDefaults as unknown as WorkflowTask);
  }

  return tasks;
}

/**
 * Convert local workflow (from designer) to Conductor-compatible format
 * Removes internal graph fields, cleans task objects, and ensures required fields are present
 */
export function localWorkflowToConductor(workflow: LocalWorkflow): WorkflowDefinition {
  // Valid fields according to GraphQL WorkflowTaskInput schema
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

  const settings = workflow.settings || {};
  const tasks = processWorkflowNodes(workflow.nodes, validTaskFields, excludedFields);

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
