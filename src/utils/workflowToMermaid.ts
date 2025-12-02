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
  status?:
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'FAILED'
    | 'TIMED_OUT'
    | 'SKIPPED'
    | 'CANCELED';
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
  tasks: Array<
    WorkflowTask & {
      taskId: string;
      workflowTask: WorkflowTask;
      status: string;
      startTime?: number;
      endTime?: number;
      inputData?: unknown;
      outputData?: unknown;
    }
  >;
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
    case 'SWITCH':
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
 * Process DECISION task with proper branch convergence
 */
function processDecisionTask(
  task: WorkflowTask,
  nodeId: string,
  mermaidLines: string[],
  nodeIndex: { value: number },
  config: MermaidConfig
): string[] {
  const allBranchEndNodes: string[] = [];

  if (task.decisionCases) {
    for (const [caseValue, caseTasks] of Object.entries(task.decisionCases)) {
      if (caseTasks && caseTasks.length > 0) {
        const firstCaseTask = caseTasks[0];
        const caseNodeId = generateNodeId(firstCaseTask.taskReferenceName, nodeIndex.value++);
        const caseNodes = processTaskList(caseTasks, mermaidLines, nodeIndex, config, caseNodeId);
        mermaidLines.push(`    ${nodeId} -->|${caseValue}| ${caseNodeId}`);
        allBranchEndNodes.push(...caseNodes);
      }
    }
  }

  if (task.defaultCase && task.defaultCase.length > 0) {
    const firstDefaultTask = task.defaultCase[0];
    const defaultNodeId = generateNodeId(firstDefaultTask.taskReferenceName, nodeIndex.value++);
    const defaultNodes = processTaskList(
      task.defaultCase,
      mermaidLines,
      nodeIndex,
      config,
      defaultNodeId
    );
    mermaidLines.push(`    ${nodeId} -->|default| ${defaultNodeId}`);
    allBranchEndNodes.push(...defaultNodes);
  }

  // If we have multiple branch end nodes, create a join point to converge them
  if (allBranchEndNodes.length > 1) {
    const convergeNodeId = `${nodeId}_converge`;
    const convergeLabel = 'Join';
    mermaidLines.push(`    ${convergeNodeId}${getNodeShape('JOIN', convergeLabel)}`);

    for (const endNode of allBranchEndNodes) {
      mermaidLines.push(`    ${endNode} --> ${convergeNodeId}`);
    }

    return [convergeNodeId];
  }

  return allBranchEndNodes;
}

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

        const branchNodes = processTaskList(
          forkBranch,
          mermaidLines,
          nodeIndex,
          config,
          branchNodeId
        );

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
 * Process a task and return its end nodes
 */
function processTaskNode(
  task: WorkflowTask,
  activeNodeId: string,
  mermaidLines: string[],
  nodeIndex: { value: number },
  config: MermaidConfig,
  isLastTask: boolean
): { endNodes: string[]; nextPreviousId: string | undefined } {
  const endNodes: string[] = [];
  let nextPreviousId: string | undefined;

  switch ((task.type || 'GENERIC').toUpperCase()) {
    case 'DECISION':
    case 'SWITCH': {
      const branchEndNodes = processDecisionTask(
        task,
        activeNodeId,
        mermaidLines,
        nodeIndex,
        config
      );
      if (isLastTask) {
        endNodes.push(...branchEndNodes);
      } else {
        nextPreviousId = branchEndNodes.length > 0 ? branchEndNodes[0] : undefined;
      }
      break;
    }
    case 'FORK_JOIN': {
      const joinNodeId = processForkJoinTask(task, activeNodeId, mermaidLines, nodeIndex, config);
      nextPreviousId = joinNodeId;
      break;
    }
    case 'DO_WHILE': {
      const exitNodeId = processDoWhileTask(task, activeNodeId, mermaidLines, nodeIndex, config);
      nextPreviousId = exitNodeId;
      break;
    }
    case 'TERMINATE':
      endNodes.push(activeNodeId);
      break;
    default:
      if (isLastTask) {
        endNodes.push(activeNodeId);
      } else {
        nextPreviousId = activeNodeId;
      }
      break;
  }

  return { endNodes, nextPreviousId };
}

/**
 * Process a list of tasks with proper branching and convergence
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
    const currentNodeId =
      previousNodeId || generateNodeId(task.taskReferenceName, nodeIndex.value++);
    const label = task.name || task.taskReferenceName;
    const nodeShape = getNodeShape(task.type || 'GENERIC', label);
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
    const isLastTask = index === tasks.length - 1;

    const { endNodes: taskEndNodes, nextPreviousId } = processTaskNode(
      task,
      activeNodeId,
      mermaidLines,
      nodeIndex,
      config,
      isLastTask
    );

    endNodes.push(...taskEndNodes);
    previousNodeId = nextPreviousId;
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
    const emptyFlowLines = ['    Start([Start])', '    End([End])', '    Start --> End'];
    mermaidLines.push(...emptyFlowLines);
    return mermaidLines.join('\n');
  }

  const nodeIndex = { value: 0 };
  const startNodeId = `start_${nodeIndex.value++}`;
  mermaidLines.push(`    ${startNodeId}([Start])`);

  const endNodeIds = processTaskList(
    workflow.tasks,
    mermaidLines,
    nodeIndex,
    mermaidConfig,
    startNodeId
  );

  const endNodeId = `end_${nodeIndex.value++}`;
  mermaidLines.push(`    ${endNodeId}([End])`);

  for (const nodeId of endNodeIds) {
    mermaidLines.push(`    ${nodeId} --> ${endNodeId}`);
  }

  // Add CSS classes with fixed node dimensions
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
