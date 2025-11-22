/**
 * Utility to convert Conductor workflow definitions to Mermaid diagrams
 * Supports both local workflow definitions and Conductor API responses
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
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'TIMED_OUT' | 'SKIPPED' | 'CANCELED';
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

export interface WorkflowExecution {
  workflowId: string;
  workflowDefinition: WorkflowDefinition;
  tasks: Array<WorkflowTask & { 
    taskId: string;
    workflowTask: WorkflowTask;
    status: string;
    startTime?: number;
    endTime?: number;
    inputData?: unknown;
    outputData?: unknown;
  }>;
  status: string;
  startTime?: number;
  endTime?: number;
}

interface MermaidConfig {
  showStatus?: boolean;
  interactive?: boolean;
  theme?: 'dark' | 'light';
  direction?: 'TD' | 'LR';
}

/**
 * Get Mermaid node shape based on task type
 */
function getNodeShape(taskType: string, label: string): string {
  switch (taskType.toUpperCase()) {
    case 'DECISION':
      return `{${label}}`;
    case 'FORK_JOIN':
    case 'FORK':
      return `[/${label}/]`;
    case 'JOIN':
    case 'CONVERGE':
      return `((${label}))`;
    case 'DO_WHILE':
      return `{{${label}}}`;
    case 'TERMINATE':
      return `[${label}]:::terminate`;
    case 'WAIT':
    case 'WAIT_FOR_SIGNAL':
    case 'WAIT_UNTIL':
      return `[(${label})]`;
    case 'EVENT':
    case 'SIGNAL':
      return `>${label}]`;
    case 'SUB_WORKFLOW':
      return `[[${label}]]`;
    case 'DYNAMIC':
    case 'DYNAMIC_FORK':
      return `[\\${label}/]`;
    default:
      return `[${label}]`;
  }
}

/**
 * Get CSS class based on task status
 */
function getStatusClass(status?: string): string {
  if (!status) return 'default';
  
  switch (status.toUpperCase()) {
    case 'COMPLETED':
      return 'completed';
    case 'FAILED':
    case 'FAILED_WITH_TERMINAL_ERROR':
      return 'failed';
    case 'IN_PROGRESS':
    case 'SCHEDULED':
      return 'running';
    case 'TIMED_OUT':
      return 'timeout';
    case 'SKIPPED':
      return 'skipped';
    case 'CANCELED':
      return 'canceled';
    default:
      return 'default';
  }
}

/**
 * Generate unique node ID
 */
function generateNodeId(taskRef: string, index: number): string {
  return `${taskRef.replaceAll(/[^a-zA-Z0-9]/g, '_')}_${index}`;
}

/**
 * Process DECISION task
 */
function processDecisionTask(
  task: WorkflowTask,
  nodeId: string,
  mermaidLines: string[],
  nodeIndex: { value: number },
  config: MermaidConfig
): string[] {
  const nextNodes: string[] = [];
  
  if (task.decisionCases) {
    for (const [caseValue, caseTasks] of Object.entries(task.decisionCases)) {
      if (caseTasks && caseTasks.length > 0) {
        const firstCaseTask = caseTasks[0];
        const caseNodeId = generateNodeId(firstCaseTask.taskReferenceName, nodeIndex.value++);
        const caseNodes = processTaskList(caseTasks, mermaidLines, nodeIndex, config, caseNodeId);
        mermaidLines.push(`    ${nodeId} -->|${caseValue}| ${caseNodeId}`);
        nextNodes.push(...caseNodes);
      }
    }
  }
  
  if (task.defaultCase && task.defaultCase.length > 0) {
    const firstDefaultTask = task.defaultCase[0];
    const defaultNodeId = generateNodeId(firstDefaultTask.taskReferenceName, nodeIndex.value++);
    const defaultNodes = processTaskList(task.defaultCase, mermaidLines, nodeIndex, config, defaultNodeId);
    mermaidLines.push(`    ${nodeId} -->|default| ${defaultNodeId}`);
    nextNodes.push(...defaultNodes);
  }
  
  return nextNodes;
}

/**
 * Process FORK_JOIN task
 */
function processForkJoinTask(
  task: WorkflowTask,
  nodeId: string,
  mermaidLines: string[],
  nodeIndex: { value: number },
  config: MermaidConfig
): string {
  const joinNodeId = `${nodeId}_join`;
  const joinLabel = task.joinOn ? `Join: ${task.joinOn.join(', ')}` : 'Join';
  const joinLines: string[] = [`    ${joinNodeId}${getNodeShape('JOIN', joinLabel)}`];
  
  if (task.forkTasks) {
    for (let branchIndex = 0; branchIndex < task.forkTasks.length; branchIndex++) {
      const forkBranch = task.forkTasks[branchIndex];
      if (forkBranch && forkBranch.length > 0) {
        const firstTask = forkBranch[0];
        const branchNodeId = generateNodeId(firstTask.taskReferenceName, nodeIndex.value++);
        joinLines.push(`    ${nodeId} -->|branch ${branchIndex + 1}| ${branchNodeId}`);
        
        const branchNodes = processTaskList(forkBranch, mermaidLines, nodeIndex, config, branchNodeId);
        
        for (const endNode of branchNodes) {
          joinLines.push(`    ${endNode} --> ${joinNodeId}`);
        }
      }
    }
  }
  
  mermaidLines.push(...joinLines);
  return joinNodeId;
}

/**
 * Process DO_WHILE task
 */
function processDoWhileTask(
  task: WorkflowTask,
  nodeId: string,
  mermaidLines: string[],
  nodeIndex: { value: number },
  config: MermaidConfig
): string {
  if (task.loopOver && task.loopOver.length > 0) {
    const firstLoopTask = task.loopOver[0];
    const loopNodeId = generateNodeId(firstLoopTask.taskReferenceName, nodeIndex.value++);
    const loopLines: string[] = [`    ${nodeId} --> ${loopNodeId}`];
    
    const loopNodes = processTaskList(task.loopOver, mermaidLines, nodeIndex, config, loopNodeId);
    
    for (const endNode of loopNodes) {
      loopLines.push(`    ${endNode} -->|loop| ${nodeId}`);
    }
    
    const exitNodeId = `${nodeId}_exit`;
    loopLines.push(`    ${nodeId} -->|exit| ${exitNodeId}`);
    mermaidLines.push(...loopLines);
    return exitNodeId;
  }
  
  return nodeId;
}

/**
 * Process a list of tasks
 */
function processTaskList(
  tasks: WorkflowTask[],
  mermaidLines: string[],
  nodeIndex: { value: number },
  config: MermaidConfig,
  startNodeId?: string
): string[] {
  const endNodes: string[] = [];
  let previousNodeId = startNodeId;
  
  for (let index = 0; index < tasks.length; index++) {
    const task = tasks[index];
    const currentNodeId = previousNodeId || generateNodeId(task.taskReferenceName, nodeIndex.value++);
    const label = task.name || task.taskReferenceName;
    const nodeShape = getNodeShape(task.type, label);
    const taskLines: string[] = [];
    
    if (!previousNodeId) {
      taskLines.push(`    ${currentNodeId}${nodeShape}`);
    } else if (index > 0) {
      const newNodeId = generateNodeId(task.taskReferenceName, nodeIndex.value++);
      taskLines.push(`    ${newNodeId}${nodeShape}`, `    ${previousNodeId} --> ${newNodeId}`);
      previousNodeId = newNodeId;
    } else {
      taskLines.push(`    ${currentNodeId}${nodeShape}`);
    }
    
    if (config.showStatus && task.status) {
      const statusClass = getStatusClass(task.status);
      taskLines.push(`    class ${currentNodeId || previousNodeId} ${statusClass}`);
    }
    
    mermaidLines.push(...taskLines);
    
    const activeNodeId = previousNodeId || currentNodeId;
    
    switch (task.type.toUpperCase()) {
      case 'DECISION':
        { const decisionNextNodes = processDecisionTask(task, activeNodeId, mermaidLines, nodeIndex, config);
        endNodes.push(...decisionNextNodes);
        previousNodeId = undefined;
        break; }
        
      case 'FORK_JOIN':
        { const joinNodeId = processForkJoinTask(task, activeNodeId, mermaidLines, nodeIndex, config);
        previousNodeId = joinNodeId;
        break; }
        
      case 'DO_WHILE':
        { const exitNodeId = processDoWhileTask(task, activeNodeId, mermaidLines, nodeIndex, config);
        previousNodeId = exitNodeId;
        break; }
        
      case 'TERMINATE':
        endNodes.push(activeNodeId);
        previousNodeId = undefined;
        break;
        
      default:
        if (index === tasks.length - 1) {
          endNodes.push(activeNodeId);
        }
        break;
    }
  }
  
  if (previousNodeId && endNodes.length === 0) {
    endNodes.push(previousNodeId);
  }
  
  return endNodes;
}

/**
 * Main function to convert a workflow definition to Mermaid diagram
 */
export function workflowToMermaid(workflow: WorkflowDefinition, config?: MermaidConfig): string {
  const mermaidConfig = config || { theme: 'light', direction: 'TD' };
  const mermaidLines: string[] = [];
  
  mermaidLines.push(`flowchart ${mermaidConfig.direction || 'TD'}`);
  
  if (!workflow.tasks || workflow.tasks.length === 0) {
    const emptyFlowLines = [
      '    Start([Start])',
      '    End([End])',
      '    Start --> End',
    ];
    mermaidLines.push(...emptyFlowLines);
    return mermaidLines.join('\n');
  }
  
  const nodeIndex = { value: 0 };
  const startNodeId = `start_${nodeIndex.value++}`;
  mermaidLines.push(`    ${startNodeId}([Start])`);
  
  const endNodeIds = processTaskList(workflow.tasks, mermaidLines, nodeIndex, mermaidConfig, startNodeId);
  
  const endNodeId = `end_${nodeIndex.value++}`;
  mermaidLines.push(`    ${endNodeId}([End])`);
  
  for (const nodeId of endNodeIds) {
    mermaidLines.push(`    ${nodeId} --> ${endNodeId}`);
  }
  
  // Add CSS classes
  const cssClasses = [
    '',
    '    classDef default fill:#e1f5ff,stroke:#01579b,stroke-width:2px,color:#000',
    '    classDef completed fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px,color:#000',
    '    classDef failed fill:#ffcdd2,stroke:#c62828,stroke-width:2px,color:#000',
    '    classDef running fill:#fff9c4,stroke:#f57f17,stroke-width:2px,color:#000',
    '    classDef timeout fill:#ffe0b2,stroke:#e65100,stroke-width:2px,color:#000',
    '    classDef skipped fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,color:#000',
    '    classDef canceled fill:#eceff1,stroke:#455a64,stroke-width:2px,color:#000',
    '    classDef terminate fill:#ffcdd2,stroke:#b71c1c,stroke-width:3px,color:#000',
  ];
  mermaidLines.push(...cssClasses);
  
  return mermaidLines.join('\n');
}

/**
 * Convert local workflow (from designer) to Conductor format
 */
export function localWorkflowToConductor(workflow: any): WorkflowDefinition {
  const tasks: WorkflowTask[] = [];

  // Extract settings from workflow.settings or use defaults
  const settings = workflow.settings || {};

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

  if (workflow.nodes && workflow.nodes.length > 0) {
    for (const node of workflow.nodes) {
      // Extract the full task config from node data
      const taskConfig = node.data?.config || {};

      // Filter to only valid fields and clean up invalid ones
      const cleanConfig: Record<string, any> = {};
      for (const [key, value] of Object.entries(taskConfig)) {
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

      // Convert loopOver from array of objects to array of strings (task reference names)
      if (cleanConfig.loopOver && Array.isArray(cleanConfig.loopOver)) {
        cleanConfig.loopOver = cleanConfig.loopOver.map((item: any) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && item.taskReferenceName) {
            return item.taskReferenceName;
          }
          return String(item);
        });
      }

      // Convert forkTasks from array of task arrays to array of string arrays
      if (cleanConfig.forkTasks && Array.isArray(cleanConfig.forkTasks)) {
        cleanConfig.forkTasks = cleanConfig.forkTasks.map((branch: any) => {
          if (!Array.isArray(branch)) return [];
          return branch.map((item: any) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object' && item.taskReferenceName) {
              return item.taskReferenceName;
            }
            return String(item);
          });
        });
      }

      // Convert defaultCase from array of objects to array of strings
      if (cleanConfig.defaultCase && Array.isArray(cleanConfig.defaultCase)) {
        cleanConfig.defaultCase = cleanConfig.defaultCase.map((item: any) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && item.taskReferenceName) {
            return item.taskReferenceName;
          }
          return String(item);
        });
      }

      tasks.push({
        name: node.data?.taskName || node.data?.label || 'Unnamed Task',
        taskReferenceName: node.id,
        type: node.data?.taskType || 'GENERIC',
        description: node.data?.description,
        inputParameters: cleanConfig.inputParameters || node.data?.inputParameters || {},
        ...cleanConfig, // Spread additional task fields from config
      });
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

