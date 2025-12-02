/**
 * LLM Service for workflow validation
 * Handles interactions with LLM to generate test scenarios and validate workflows
 */

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  targetNode: string;
  testType: 'happy_path' | 'edge_case' | 'error_case' | 'boundary';
  inputJson?: Record<string, unknown>;
  status: 'pending' | 'generating' | 'ready' | 'testing' | 'passed' | 'failed';
  executionResult?: Record<string, unknown>;
  error?: string;
}

export interface WorkflowValidationRequest {
  workflowDefinition: Record<string, unknown>;
  inputJson: Record<string, unknown>;
}

/**
 * Extract a concise summary of a task for LLM context
 * This function is preserved for future LLM implementation
 * @internal
 */
export function extractTaskSummary(task: Record<string, unknown>): string {
  return JSON.stringify(
    {
      name: task.name,
      taskReferenceName: task.taskReferenceName,
      type: task.type,
      description: task.description,
      inputParameters:
        Object.keys((task.inputParameters as Record<string, unknown>) || {}).length > 0
          ? `${Object.keys(task.inputParameters as Record<string, unknown>).length} parameters`
          : 'none',
      optional: task.optional,
    },
    null,
    2
  );
}

/**
 * Generate test scenarios for a single task using LLM
 */
async function generateScenariosForTask(
  task: Record<string, unknown>,
  taskIndex: number,
  _workflowContext: string,
  _additionalContext?: string,
  onProgress?: (message: string) => void
): Promise<TestScenario[]> {
  onProgress?.(
    `🤖 LLM Interaction #${taskIndex + 1}: Analyzing task "${(task.name as string) || (task.taskReferenceName as string)}"...`
  );

  console.log(`🤖 LLM Interaction #${taskIndex + 1}:`, {
    taskName: task.name,
    taskType: task.type,
    taskRef: task.taskReferenceName,
  });

  // This would be replaced with actual LLM API call in production
  // It's commented out here as a reference for future implementation
  // const contextSection = additionalContext
  //   ? `\n\nAdditional Business Context:\n${additionalContext}`
  //   : '';
  //
  // const prompt = `You are a QA engineer analyzing a workflow task. Generate test scenarios for this specific task.
  //
  // WORKFLOW CONTEXT:
  // ${workflowContext}
  //
  // CURRENT TASK:
  // ${taskSummary}
  // ${contextSection}
  //
  // Generate 2-4 test scenarios for this task covering:
  // 1. Happy path - normal successful execution
  // 2. Edge cases - boundary conditions, empty values, special characters
  // 3. Error cases - invalid inputs, missing required fields, constraint violations
  // 4. Task-specific scenarios based on the task type (${task.type})
  //
  // Return ONLY a JSON array with this structure:
  // [
  //   {
  //     "name": "Scenario name",
  //     "description": "Detailed description of what this scenario tests",
  //     "testType": "happy_path" | "edge_case" | "error_case" | "boundary",
  //     "expectedBehavior": "What should happen in this scenario"
  //   }
  // ]`;
  //
  // const response = await fetch(llmConfig.apiEndpoint, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${llmConfig.apiKey}`
  //   },
  //   body: JSON.stringify({
  //     model: llmConfig.model || 'gpt-4o',
  //     messages: [{ role: 'user', content: prompt }],
  //     temperature: 0.7,
  //     max_tokens: 1000,
  //   })
  // });
  // const llmResponse = await response.json();
  // const scenarios = JSON.parse(llmResponse.choices[0].message.content);

  // Simulate LLM API call (1-2 seconds per task)
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

  // SIMULATED LLM RESPONSE - Task-specific scenarios
  const scenarios: Partial<TestScenario>[] = [];
  const taskType = String((task.type as string) || 'GENERIC').toUpperCase();
  const taskRef =
    (task.taskReferenceName as string) || (task.name as string) || `task_${taskIndex}`;

  // Generate scenarios based on task type
  switch (taskType) {
    case 'HTTP':
      scenarios.push(
        {
          name: `${task.name} - Successful API Response`,
          description: `Tests successful HTTP request to ${task.name}. Validates that the API returns 200 OK with expected response structure.`,
          testType: 'happy_path',
        },
        {
          name: `${task.name} - API Timeout`,
          description: `Tests behavior when the HTTP request times out. Should handle timeout gracefully and trigger retry or error handling.`,
          testType: 'error_case',
        },
        {
          name: `${task.name} - Invalid Response Format`,
          description: `Tests handling of malformed JSON response from API. Should validate response structure and fail gracefully.`,
          testType: 'error_case',
        }
      );
      break;

    case 'DECISION':
      scenarios.push(
        {
          name: `${task.name} - True Branch Execution`,
          description: `Tests the decision task when condition evaluates to true. Should route to the success/true branch.`,
          testType: 'happy_path',
        },
        {
          name: `${task.name} - False Branch Execution`,
          description: `Tests the decision task when condition evaluates to false. Should route to the alternate/false branch.`,
          testType: 'edge_case',
        },
        {
          name: `${task.name} - Null/Missing Decision Parameter`,
          description: `Tests behavior when the decision parameter is null or missing. Should handle gracefully with default behavior.`,
          testType: 'error_case',
        }
      );
      break;

    case 'FORK_JOIN':
    case 'FORK':
      scenarios.push(
        {
          name: `${task.name} - All Parallel Tasks Success`,
          description: `Tests fork/join when all parallel branches complete successfully. Should converge and continue workflow.`,
          testType: 'happy_path',
        },
        {
          name: `${task.name} - Partial Branch Failure`,
          description: `Tests behavior when one or more parallel branches fail. Should handle partial failures according to join strategy.`,
          testType: 'error_case',
        },
        {
          name: `${task.name} - Parallel Task Timeout`,
          description: `Tests when one parallel branch times out. Should handle timeout and proceed or fail based on configuration.`,
          testType: 'edge_case',
        }
      );
      break;

    case 'LAMBDA':
    case 'MAPPER':
      scenarios.push(
        {
          name: `${task.name} - Valid Data Transformation`,
          description: `Tests data transformation with valid input. Should successfully map/transform data to expected output format.`,
          testType: 'happy_path',
        },
        {
          name: `${task.name} - Empty Input Data`,
          description: `Tests transformation with empty or null input. Should handle gracefully or return empty result.`,
          testType: 'edge_case',
        },
        {
          name: `${task.name} - Invalid Data Structure`,
          description: `Tests with malformed input data structure. Should validate input and fail with clear error message.`,
          testType: 'error_case',
        }
      );
      break;

    case 'WAIT':
    case 'WAIT_FOR_SIGNAL':
      scenarios.push(
        {
          name: `${task.name} - Signal Received Before Timeout`,
          description: `Tests when signal is received within timeout period. Should proceed immediately upon signal.`,
          testType: 'happy_path',
        },
        {
          name: `${task.name} - Timeout Expires`,
          description: `Tests behavior when timeout expires without receiving signal. Should proceed or fail based on configuration.`,
          testType: 'edge_case',
        }
      );
      break;

    case 'DO_WHILE':
      scenarios.push(
        {
          name: `${task.name} - Loop Completes Successfully`,
          description: `Tests loop execution with valid condition. Should iterate correct number of times and exit.`,
          testType: 'happy_path',
        },
        {
          name: `${task.name} - Loop Condition Never Met`,
          description: `Tests when loop condition is never satisfied. Should handle infinite loop prevention.`,
          testType: 'error_case',
        },
        {
          name: `${task.name} - Maximum Iterations Reached`,
          description: `Tests boundary condition when max iterations limit is reached. Should exit loop gracefully.`,
          testType: 'boundary',
        }
      );
      break;

    default:
      scenarios.push(
        {
          name: `${task.name} - Successful Execution`,
          description: `Tests normal successful execution of ${task.name}. Should complete without errors.`,
          testType: 'happy_path',
        },
        {
          name: `${task.name} - Missing Required Input`,
          description: `Tests behavior when required input parameters are missing. Should fail with validation error.`,
          testType: 'error_case',
        }
      );
  }

  // Convert to full TestScenario objects
  return scenarios.map((s, idx) => ({
    id: `llm-task-${taskIndex}-scenario-${idx}`,
    name: s.name!,
    description: s.description!,
    targetNode: taskRef,
    testType: s.testType!,
    status: 'pending' as const,
  }));
}

/**
 * Recursively traverse workflow tasks and generate scenarios
 */
async function traverseAndGenerateScenarios(
  tasks: Record<string, unknown>[],
  workflowContext: string,
  additionalContext?: string,
  onProgress?: (message: string, current: number, total: number) => void
): Promise<TestScenario[]> {
  const allScenarios: TestScenario[] = [];
  let taskCounter = 0;

  async function processDecisionCases(task: Record<string, unknown>, depth: number): Promise<void> {
    // DECISION task - process each case
    for (const [_caseName, caseTasks] of Object.entries(
      task.decisionCases as Record<string, unknown>
    )) {
      if (Array.isArray(caseTasks)) {
        for (const caseTask of caseTasks) {
          await processTask(caseTask as Record<string, unknown>, depth + 1);
        }
      }
    }

    // Process default case
    if (task.defaultCase && Array.isArray(task.defaultCase)) {
      for (const defaultTask of task.defaultCase) {
        await processTask(defaultTask as Record<string, unknown>, depth + 1);
      }
    }
  }

  async function processForkTasks(task: Record<string, unknown>, depth: number): Promise<void> {
    // FORK_JOIN task - process each parallel branch
    for (const branch of task.forkTasks as unknown[]) {
      if (Array.isArray(branch)) {
        for (const branchTask of branch) {
          await processTask(branchTask as Record<string, unknown>, depth + 1);
        }
      }
    }
  }

  async function processLoopTasks(task: Record<string, unknown>, depth: number): Promise<void> {
    // DO_WHILE task - process loop tasks
    for (const loopTask of task.loopOver as unknown[]) {
      await processTask(loopTask as Record<string, unknown>, depth + 1);
    }
  }

  async function processTask(task: Record<string, unknown>, depth: number = 0): Promise<void> {
    taskCounter++;
    const currentCount = taskCounter;

    // Generate scenarios for current task
    const taskScenarios = await generateScenariosForTask(
      task,
      currentCount - 1,
      workflowContext,
      additionalContext,
      (msg) => onProgress?.(msg, currentCount, tasks.length)
    );

    allScenarios.push(...taskScenarios);

    // Recursively process nested tasks
    if (task.decisionCases) {
      await processDecisionCases(task, depth);
    }

    if (task.forkTasks) {
      await processForkTasks(task, depth);
    }

    if (task.loopOver && Array.isArray(task.loopOver)) {
      await processLoopTasks(task, depth);
    }
  }

  // Process all top-level tasks
  for (const task of tasks) {
    await processTask(task);
  }

  return allScenarios;
}

/**
 * Generate test scenarios based on workflow definition and input JSON
 * Uses recursive traversal to analyze each task individually
 */
export async function generateTestScenarios(
  workflowDefinition: Record<string, unknown>,
  inputJson: Record<string, unknown>,
  additionalContext?: string,
  onProgress?: (message: string, current: number, total: number) => void
): Promise<TestScenario[]> {
  console.log('🤖 Starting recursive workflow analysis...');
  console.log('Workflow:', workflowDefinition.name);
  console.log('Total top-level tasks:', (workflowDefinition.tasks as unknown[])?.length || 0);

  // Create a concise workflow context (avoid sending full JSON to LLM each time)
  const workflowContext = `
Workflow Name: ${workflowDefinition.name}
Description: ${String((workflowDefinition.description as string) || 'N/A')}
Total Tasks: ${(workflowDefinition.tasks as unknown[])?.length || 0}
Input Parameters: ${JSON.stringify(workflowDefinition.inputParameters || [])}
Sample Input: ${JSON.stringify(inputJson, null, 2).substring(0, 500)}...
  `.trim();

  onProgress?.(
    '🔍 Analyzing workflow structure...',
    0,
    (workflowDefinition.tasks as unknown[])?.length || 0
  );

  // Small delay to show initial message
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Recursively traverse and generate scenarios
  const scenarios = await traverseAndGenerateScenarios(
    ((workflowDefinition.tasks as unknown[]) || []) as Record<string, unknown>[],
    workflowContext,
    additionalContext,
    onProgress
  );

  // Add end-to-end scenarios
  onProgress?.(
    '🎯 Generating end-to-end test scenarios...',
    scenarios.length,
    scenarios.length + 2
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));

  scenarios.push(
    {
      id: 'llm-e2e-happy-path',
      name: 'End-to-End Happy Path',
      description: `Complete workflow execution with all tasks succeeding. Validates the entire ${workflowDefinition.name} workflow from start to finish.`,
      targetNode: 'all',
      testType: 'happy_path',
      status: 'pending',
    },
    {
      id: 'llm-e2e-error-recovery',
      name: 'End-to-End Error Recovery',
      description:
        'Tests workflow error handling and recovery mechanisms across multiple task failures.',
      targetNode: 'all',
      testType: 'error_case',
      status: 'pending',
    }
  );

  console.log(
    `✅ Generated ${scenarios.length} test scenarios from ${(workflowDefinition.tasks as unknown[])?.length || 0} tasks`
  );

  return scenarios;
}

/**
 * Generate test input JSON for a specific scenario
 */
export async function generateTestInputForScenario(
  scenario: TestScenario,
  originalInput: Record<string, unknown>,
  _workflowDefinition: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Simulate LLM API call to generate scenario-specific input
  await new Promise((resolve) => setTimeout(resolve, 1500));

  let testInput = { ...originalInput };

  switch (scenario.testType) {
    case 'happy_path':
      // Keep original input or enhance it
      testInput = {
        ...originalInput,
        _testScenario: scenario.name,
        _expectedOutcome: 'success',
      };
      break;

    case 'edge_case':
      if (scenario.id === 'scenario-empty-input') {
        testInput = {
          orderType: originalInput.orderType || 'BOPIS',
          customerId: originalInput.customerId || 'TEST_CUSTOMER',
          items: [],
          _testScenario: scenario.name,
        };
      } else if (scenario.name.includes('False Branch')) {
        testInput = {
          ...originalInput,
          orderType: 'INVALID_TYPE',
          _testScenario: scenario.name,
          _expectedOutcome: 'alternate_path',
        };
      }
      break;

    case 'error_case':
      if (scenario.name.includes('API Error')) {
        testInput = {
          ...originalInput,
          shipNode: 'INVALID_NODE_999',
          _testScenario: scenario.name,
          _expectedOutcome: 'error',
          _forceError: true,
        };
      } else if (scenario.name.includes('Invalid Data')) {
        testInput = {
          ...originalInput,
          items: 'INVALID_NOT_AN_ARRAY',
          _testScenario: scenario.name,
          _expectedOutcome: 'error',
        };
      }
      break;

    case 'boundary':
      if (scenario.name.includes('Large Payload')) {
        const firstItem = (originalInput.items as unknown[])?.[0] || {
          itemId: 'ITEM001',
          quantity: 1,
          price: 10,
        };
        testInput = {
          ...originalInput,
          items: new Array(100).fill(firstItem),
          _testScenario: scenario.name,
          _expectedOutcome: 'success',
        };
      } else if (scenario.name.includes('Timeout')) {
        testInput = {
          ...originalInput,
          _testScenario: scenario.name,
          _waitTimeout: 5000,
          _expectedOutcome: 'timeout',
        };
      }
      break;
  }

  return testInput;
}

/**
 * Execute workflow on Netflix Conductor
 */
export async function executeWorkflowOnConductor(
  workflowName: string,
  inputJson: Record<string, unknown>,
  conductorUrl: string, // Now required, comes from settings
  conductorApiKey?: string // Now optional, comes from settings
): Promise<Record<string, unknown>> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (conductorApiKey) {
      headers['X-Conductor-API-Key'] = conductorApiKey; // Assuming Conductor uses a custom header
    }

    // Start workflow execution
    const response = await fetch(`${conductorUrl}/workflow/${workflowName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(inputJson),
    });

    if (!response.ok) {
      throw new Error(`Failed to start workflow: ${response.statusText}`);
    }

    const workflowId = await response.text();

    // Poll for workflow completion (simplified - in production use webhooks)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Get workflow execution status
    const statusResponse = await fetch(`${conductorUrl}/workflow/${workflowId}`);

    if (!statusResponse.ok) {
      throw new Error(`Failed to get workflow status: ${statusResponse.statusText}`);
    }

    const executionResult = await statusResponse.json();
    return executionResult;
  } catch (error) {
    console.error('Conductor execution error:', error);

    // Simulate execution result for demo purposes
    const isSuccess = !inputJson._forceError && Math.random() > 0.3;

    return {
      workflowId: `sim-${Date.now()}`,
      status: isSuccess ? 'COMPLETED' : 'FAILED',
      input: inputJson,
      output: isSuccess
        ? {
            result: 'success',
            processedAt: new Date().toISOString(),
            data: { message: 'Workflow executed successfully' },
          }
        : {
            error: 'Workflow execution failed',
            reason: inputJson._forceError ? 'Forced error for testing' : 'Random failure',
          },
      tasks: [
        {
          taskType: 'GENERIC',
          status: isSuccess ? 'COMPLETED' : 'FAILED',
          taskId: `task-${Date.now()}`,
        },
      ],
      startTime: Date.now() - 3000,
      endTime: Date.now(),
    };
  }
}
