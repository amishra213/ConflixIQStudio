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
  createdBy?: string;
  updatedBy?: string;
  ownerEmail?: string;
  ownerApp?: string;
  inputTemplate?: Record<string, unknown>;
  accessPolicy?: Record<string, unknown>;
  failureWorkflow?: string;
  variables?: Record<string, unknown>;
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
    createdBy?: string;
    updatedBy?: string;
    ownerEmail?: string;
    ownerApp?: string;
    inputTemplate?: Record<string, unknown>;
    accessPolicy?: Record<string, unknown>;
    failureWorkflow?: string;
    variables?: Record<string, unknown>;
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
  ownerApp?: string;
  timeoutPolicy?: string;
  timeoutSeconds?: number;
  createdBy?: string;
  updatedBy?: string;
  inputTemplate?: Record<string, unknown>;
  accessPolicy?: Record<string, unknown>;
  failureWorkflow?: string;
  variables?: Record<string, unknown>;
}

/**
 * Recursively clean a task object or array of tasks, removing internal graph fields
 */
function cleanTaskObject(obj: unknown, excludedFields: Set<string>): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => cleanTaskObject(item, excludedFields));
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
/**
 * Set a field to null if it's undefined
 */
function ensureNullableField(obj: Record<string, unknown>, fieldName: string): void {
  if (obj[fieldName] === undefined) {
    obj[fieldName] = null;
  }
}

/**
 * Add default values for required fields in operator tasks
 */
function ensureRequiredOperatorFields(task: Record<string, unknown>): Record<string, unknown> {
  const result = { ...task };

  // CRITICAL: Ensure 'type' field is always set and valid - Conductor will fail to deserialize if type is null
  if (!result.type || result.type === '') {
    const taskName = typeof task.name === 'string' ? task.name : 'unknown';
    throw new Error(
      `Task "${taskName}" is missing a required 'type' field. All tasks must have a valid Conductor task type.`
    );
  }

  // Remove workflowTaskType field - Conductor backend only uses 'type', not 'workflowTaskType'
  delete result.workflowTaskType;

  // Ensure ALL tasks have these base required fields with proper defaults
  result.optional ??= false;
  result.asyncComplete ??= false;
  if (!result.inputParameters) {
    result.inputParameters = {};
  }

  // Set explicit null for fields that should be nullable (not undefined)
  const nullableFields = [
    'description',
    'retryCount',
    'rateLimited',
    'evaluatorType',
    'expression',
    'scriptExpression',
    'decisionCases',
    'defaultCase',
    'forkTasks',
    'joinOn',
    'loopCondition',
    'loopOver',
    'dynamicTaskNameParam',
    'sink',
    'subWorkflowParam',
    'outputParameters',
    'defaultExclusiveJoinTask',
    'dynamicForkTasksParam',
    'dynamicForkTasksInputParamName',
  ];

  for (const field of nullableFields) {
    ensureNullableField(result, field);
  }

  // startDelay defaults to 0, not null
  if (result.startDelay === undefined) {
    result.startDelay = 0;
  }

  // Ensure required fields for specific operator types
  const taskType = result.type as string;

  switch (taskType) {
    case 'DO_WHILE':
      result.loopCondition ??= 'True';
      result.loopOver ??= [];
      break;
    case 'FORK_JOIN':
      result.forkTasks ??= [[]];
      break;
    case 'SWITCH':
      result.expression ??= '${workflow.input}';
      result.decisionCases ??= {};
      break;
    case 'DYNAMIC':
      result.dynamicTaskNameParam ??= 'taskName';
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
  const inputParams: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(taskConfig)) {
    // Skip excluded fields
    if (excludedFields.has(key)) {
      continue;
    }

    // Only include valid fields
    if (validTaskFields.has(key)) {
      cleanConfig[key] = value;
    } else if (key === 'kafka_request' || key === 'http_request') {
      // Merge task-specific request config properties into inputParameters
      if (typeof value === 'object' && value !== null) {
        Object.assign(inputParams, value as Record<string, unknown>);
      }
    }
  }

  // Set inputParameters if we have accumulated any
  if (Object.keys(inputParams).length > 0) {
    cleanConfig.inputParameters = {
      ...(typeof cleanConfig.inputParameters === 'object' && cleanConfig.inputParameters !== null
        ? (cleanConfig.inputParameters as Record<string, unknown>)
        : {}),
      ...inputParams,
    };
  }

  return cleanConfig;
}

/**
 * Clean and prepare defaultCase tasks
 * Note: Despite GraphQL schema showing [String], Conductor backend expects task objects
 */
function cleanDefaultCase(
  defaultCase: unknown,
  excludedFields: Set<string>
): unknown[] | undefined {
  if (!defaultCase) return undefined;

  const tasks: unknown[] = Array.isArray(defaultCase) ? defaultCase : [defaultCase];
  const cleanedTasks = tasks.map((task) => cleanTaskObject(task, excludedFields));

  // Return cleaned task objects (not strings) - Conductor backend expects objects
  return cleanedTasks;
}

/**
 * Clean and prepare decisionCases tasks
 */
function cleanDecisionCases(
  decisionCases: unknown,
  excludedFields: Set<string>
): Record<string, unknown> | undefined {
  if (!decisionCases || typeof decisionCases !== 'object') return undefined;

  const cleanedCases: Record<string, unknown> = {};
  for (const [caseKey, caseTasks] of Object.entries(decisionCases as Record<string, unknown>)) {
    if (Array.isArray(caseTasks)) {
      cleanedCases[caseKey] = caseTasks.map((task) => cleanTaskObject(task, excludedFields));
    } else {
      cleanedCases[caseKey] = cleanTaskObject(caseTasks, excludedFields);
    }
  }
  return cleanedCases;
}

/**
 * Process and clean operator-specific task structures
 */
function processOperatorFields(
  cleanConfig: Record<string, unknown>,
  excludedFields: Set<string>
): Record<string, unknown> {
  // loopOver should contain full task objects in an array, not just references
  if (cleanConfig.loopOver && !Array.isArray(cleanConfig.loopOver)) {
    cleanConfig.loopOver = [];
  } else if (cleanConfig.loopOver && Array.isArray(cleanConfig.loopOver)) {
    // Clean each task in loopOver array
    cleanConfig.loopOver = (cleanConfig.loopOver as unknown[]).map((task) =>
      cleanTaskObject(task, excludedFields)
    );
  }

  // forkTasks should contain full task objects in each branch (array of arrays)
  if (cleanConfig.forkTasks && Array.isArray(cleanConfig.forkTasks)) {
    cleanConfig.forkTasks = (cleanConfig.forkTasks as unknown[]).map((branch) => {
      if (Array.isArray(branch)) {
        return branch.map((task) => cleanTaskObject(task, excludedFields));
      }
      return [];
    });
  }

  // Clean defaultCase - recursively clean nested tasks (returns array of objects, not strings)
  if (cleanConfig.defaultCase) {
    cleanConfig.defaultCase = cleanDefaultCase(cleanConfig.defaultCase, excludedFields);
  }

  // Clean decisionCases - recursively clean nested tasks in each case (returns object with arrays of objects)
  if (cleanConfig.decisionCases) {
    cleanConfig.decisionCases = cleanDecisionCases(cleanConfig.decisionCases, excludedFields);
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
  // Extract the task type from either taskType or type field
  const taskType = (node.data?.taskType || node.data?.type || finalCleanConfig.type) as string;

  // Ensure we have a valid type - Conductor requires this field
  if (!taskType) {
    const nodeId = typeof node.id === 'string' ? node.id : 'unknown';
    const taskLabel = typeof node.data?.label === 'string' ? node.data.label : nodeId;
    throw new Error(
      `Task "${taskLabel}" is missing a required 'type' field. All tasks must have a valid type (e.g., HTTP, SIMPLE, EVENT, WAIT, etc.)`
    );
  }

  // Remove workflowTaskType from the final config since Conductor expects only 'type'
  const configWithoutWorkflowTaskType = { ...finalCleanConfig };
  delete configWithoutWorkflowTaskType.workflowTaskType;

  return {
    name: node.data?.taskName || node.data?.label || 'Unnamed Task',
    taskReferenceName: node.id,
    type: taskType,
    description: node.data?.description,
    inputParameters:
      configWithoutWorkflowTaskType.inputParameters || node.data?.inputParameters || {},
    ...configWithoutWorkflowTaskType,
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
    const cleanConfig = buildCleanConfig(
      taskConfig as Record<string, unknown>,
      validTaskFields,
      excludedFields
    );
    const processedConfig = processOperatorFields(cleanConfig, excludedFields);
    const finalCleanConfig = cleanTaskObject(processedConfig, excludedFields) as Record<
      string,
      unknown
    >;
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
    'name',
    'taskReferenceName',
    'type',
    'workflowTaskType',
    'description',
    'inputParameters',
    'outputParameters',
    'optional',
    'asyncComplete',
    'retryCount',
    'startDelay',
    'rateLimited',
    'evaluatorType',
    'expression',
    'scriptExpression',
    'decisionCases',
    'defaultCase',
    'forkTasks',
    'joinOn',
    'defaultExclusiveJoinTask',
    'loopCondition',
    'loopOver',
    'dynamicForkTasksParam',
    'dynamicForkTasksInputParamName',
    'dynamicTaskNameParam',
    'sink',
    'subWorkflowParam',
    'taskDefinition',
  ]);

  // Fields to explicitly exclude (internal graph representation only)
  const excludedFields = new Set([
    'taskRefId',
    'nodeId',
    'id',
    'label',
    'taskName',
    'taskType',
    'x',
    'y',
    'position',
    'data',
    'config',
    '__typename',
  ]);

  const settings = workflow.settings || {};
  const tasks = processWorkflowNodes(workflow.nodes, validTaskFields, excludedFields);

  // Build the complete workflow definition with all supported fields
  const result: Record<string, unknown> = {
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
    workflowStatusListenerEnabled:
      settings.workflowStatusListenerEnabled || workflow.workflowStatusListenerEnabled || false,
  };

  // Add optional fields if they exist in the workflow or settings
  // These fields are supported by the Conductor API
  if (workflow.createdBy || settings.createdBy) {
    result.createdBy = workflow.createdBy || settings.createdBy || 'ConflixIQStudio';
  }

  if (workflow.updatedBy || settings.updatedBy) {
    result.updatedBy = workflow.updatedBy || settings.updatedBy || 'ConflixIQStudio';
  }

  if (workflow.ownerEmail || settings.ownerEmail) {
    result.ownerEmail = workflow.ownerEmail || settings.ownerEmail || '';
  }

  if (workflow.ownerApp || settings.ownerApp) {
    result.ownerApp = workflow.ownerApp || settings.ownerApp || '';
  }

  if (workflow.inputTemplate || settings.inputTemplate) {
    result.inputTemplate = workflow.inputTemplate || settings.inputTemplate || {};
  }

  if (workflow.accessPolicy || settings.accessPolicy) {
    result.accessPolicy = workflow.accessPolicy || settings.accessPolicy || {};
  }

  if (workflow.failureWorkflow || settings.failureWorkflow) {
    result.failureWorkflow = workflow.failureWorkflow || settings.failureWorkflow || '';
  }

  if (workflow.variables || settings.variables) {
    result.variables = workflow.variables || settings.variables || {};
  }

  return result as unknown as WorkflowDefinition;
}
