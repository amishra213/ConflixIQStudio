/**
 * LLM Troubleshoot Service
 *
 * Provides context-aware troubleshooting for Conductor OSS and ConflixIQ Studio.
 * Gathers runtime context (logs, execution events, settings, metrics) and sends
 * it alongside the user's question to the configured LLM endpoint.
 */

import { useLoggingStore } from '@/stores/loggingStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useWorkflowStore } from '@/stores/workflowStore';
import { localWorkflowToConductor } from '@/utils/workflowConverter';
import type { ExecutionDetails } from './executionService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isError?: boolean;
}

export interface TroubleshootContext {
  /** Raw logs snapshot for LLM */
  logSnapshot: string;
  /** Current execution details (optional, set when user is on a specific execution) */
  executionDetails?: Partial<ExecutionDetails>;
  /** Dashboard stats snapshot */
  dashboardStats?: string;
  /** Settings snapshot (no secrets) */
  settingsSnapshot?: string;
  /** Free-form extra context provided by user */
  userContext?: string;
  /**
   * The Conductor-format JSON of the workflow currently open in the UI.
   * Injected automatically when the user is on a workflow page.
   */
  activeWorkflowJson?: string;
  /**
   * A compact summary of the active execution currently open in the UI,
   * or the most-recent execution of the current workflow.
   */
  activeExecutionSummary?: string;
  /**
   * Human-readable label of the active page (e.g. "Workflow Designer – my-workflow").
   * Used so the LLM knows what context was captured.
   */
  pageLabel?: string;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert Conductor OSS and ConflixIQ Studio troubleshooting assistant.

CONDUCTOR OSS KNOWLEDGE:
- Conductor is a workflow orchestration engine by Netflix/Orkes.
- Workflows are composed of tasks (SIMPLE, SUB_WORKFLOW, FORK_JOIN, DECISION, WAIT, HTTP, INLINE, etc.).
- Task statuses: SCHEDULED, IN_PROGRESS, COMPLETED, FAILED, TIMED_OUT, SKIPPED, CANCELED.
- Workflow statuses: RUNNING, COMPLETED, FAILED, TIMED_OUT, TERMINATED, PAUSED.
- Common failure causes: worker not polling, responseTimeoutSeconds exceeded, task input/output mapping errors,
  cyclic dependencies, missing task definitions, improper FORK_JOIN usage, missing JOIN tasks.
- Best practices: set appropriate timeoutSeconds on tasks and workflows, use retryCount for transient failures,
  always join fork branches, use correlationId for tracing, use reasonForIncompletion to debug failures.
- API endpoints: GET /api/workflow/{id} (details), GET /api/workflow/search (list), DELETE /api/workflow/{id} (terminate),
  PUT /api/workflow/{id}/pause, PUT /api/workflow/{id}/resume, POST /api/workflow/{id}/retry,
  POST /api/workflow/{id}/restart, GET /api/tasks/{taskId}/log.

CONFLIXIQ STUDIO KNOWLEDGE:
- ConflixIQ Studio is a web-based Conductor management UI built with React/TypeScript.
- It communicates with Conductor via a GraphQL proxy (port 4000) for definitions and direct REST for execution operations.
- Configuration is in Settings: Proxy Server URL, Conductor API endpoint, API Key, OpenAI LLM config.
- If the proxy is not running, definition CRUD will fail; execution operations (start/stop/retry) may still work via direct REST.
- The LLM troubleshoot feature requires a valid OpenAI API key and endpoint in Settings → OpenAI LLM Configuration.

CONTEXT AWARENESS:
- When "Active Workflow JSON" is present in the RUNTIME CONTEXT below, it contains the full Conductor-format
  definition of the workflow currently open in the UI. Use it directly without asking the user to paste it.
- When "Active Execution Summary" is present, it contains key details of the execution currently in view.
- When "Runtime Logs" is present, reference specific errors, workflow IDs, and task names from it.
- Always reference the injected context before asking the user for information that's already available.

GUIDELINES:
- Be concise and actionable. Provide step-by-step remediation when relevant.
- If logs or execution context are provided, reference specific details (workflow IDs, error messages, task names).
- If the workflow JSON is available, analyse it directly and cite specific task names, types, and config values.
- If configuration looks misconfigured, call it out.
- If you cannot determine the cause from the given context, say so and suggest what additional info would help.
- Format responses clearly using markdown-style sections when listing steps.`;

// ─── Context Builder ──────────────────────────────────────────────────────────

/**
 * Builds a rich context string to inject as a system message for each LLM call.
 */
export function buildContextString(ctx: TroubleshootContext): string {
  const sections: string[] = [];

  if (ctx.pageLabel) {
    sections.push(`### Current Page\n${ctx.pageLabel}`);
  }

  if (ctx.dashboardStats) {
    sections.push(`### Dashboard Stats\n${ctx.dashboardStats}`);
  }

  if (ctx.settingsSnapshot) {
    sections.push(`### Settings (no secrets)\n${ctx.settingsSnapshot}`);
  }

  // Active workflow JSON — the most valuable context for workflow questions
  if (ctx.activeWorkflowJson && ctx.activeWorkflowJson.trim()) {
    sections.push(`### Active Workflow JSON\n\`\`\`json\n${ctx.activeWorkflowJson}\n\`\`\``);
  }

  // Active execution summary
  if (ctx.activeExecutionSummary && ctx.activeExecutionSummary.trim()) {
    sections.push(`### Active Execution Summary\n${ctx.activeExecutionSummary}`);
  }

  if (ctx.executionDetails) {
    const ed = ctx.executionDetails;
    const taskSummary = Array.isArray(ed.tasks)
      ? ed.tasks
          .slice(0, 20)
          .map(
            (t) =>
              `  - [${t.status}] ${t.taskType} / ${t.referenceTaskName}` +
              (t.reasonForIncompletion ? ` → ${t.reasonForIncompletion}` : '')
          )
          .join('\n')
      : 'N/A';

    sections.push(
      `### Current Execution\n` +
        `- Workflow: ${ed.workflowType ?? 'unknown'} (${ed.workflowId ?? 'unknown'})\n` +
        `- Status: ${ed.status ?? 'unknown'}\n` +
        `- Reason: ${ed.reasonForIncompletion ?? 'none'}\n` +
        `- Tasks (up to 20):\n${taskSummary}`
    );
  }

  if (ctx.logSnapshot && ctx.logSnapshot.trim()) {
    sections.push(`### Runtime Logs\n\`\`\`\n${ctx.logSnapshot}\n\`\`\``);
  }

  if (ctx.userContext && ctx.userContext.trim()) {
    sections.push(`### Additional Context from User\n${ctx.userContext}`);
  }

  return sections.join('\n\n');
}

/**
 * Gathers automatic context from stores and (optionally) a specific execution.
 *
 * @param executionDetails - Optional execution currently in view
 * @param pageContext      - Optional hints about the current page:
 *                          - workflowId: ID of the workflow currently open in the designer
 *                          - executionId: ID of the execution currently in view
 *                          - pageLabel:   Human-readable page label for the LLM
 */
export function gatherAutoContext(
  executionDetails?: Partial<ExecutionDetails>,
  pageContext?: {
    workflowId?: string;
    executionId?: string;
    pageLabel?: string;
  }
): TroubleshootContext {
  const loggingState = useLoggingStore.getState();
  const settingsState = useSettingsStore.getState();
  const dashboardState = useDashboardStore.getState();
  const workflowState = useWorkflowStore.getState();

  // Dashboard stats (no secrets)
  const dashboardStats = [
    `Workflows: total=${dashboardState.workflowStats.total}, running=${dashboardState.workflowStats.running}, failed=${dashboardState.workflowStats.failed}`,
    `Executions: total=${dashboardState.executionStats.total}, running=${dashboardState.executionStats.running}, failed=${dashboardState.executionStats.failed}`,
    `Recent errors: ${dashboardState.recentErrors.length}`,
  ].join('\n');

  // Settings snapshot (strip secrets)
  const settingsSnapshot = [
    `Proxy enabled: ${settingsState.proxyServer.enabled}`,
    `Proxy endpoint: ${settingsState.proxyServer.proxyEndpoint}`,
    `Conductor server: ${settingsState.proxyServer.conductorServerUrl}`,
    `Conductor API endpoint: ${settingsState.conductorApi.endpoint}`,
    `LLM endpoint: ${settingsState.openAiLlm.apiEndpoint}`,
    `LLM model: ${settingsState.openAiLlm.model ?? 'not set'}`,
    `LLM API key configured: ${settingsState.openAiLlm.apiKey ? 'yes' : 'NO (required for troubleshoot)'}`,
  ].join('\n');

  // ── Active workflow JSON ────────────────────────────────────────────────────
  // Pull the workflow currently open in the UI (from URL param or selectedWorkflow)
  let activeWorkflowJson: string | undefined;
  let pageLabel = pageContext?.pageLabel;

  const targetWorkflowId = pageContext?.workflowId;
  const workflow = targetWorkflowId
    ? workflowState.workflows.find((w) => w.id === targetWorkflowId)
    : workflowState.selectedWorkflow ?? undefined;

  if (workflow) {
    try {
      const conductorDef = localWorkflowToConductor(workflow as Parameters<typeof localWorkflowToConductor>[0]);
      // Limit JSON size to ~8 KB to stay within token budget
      const json = JSON.stringify(conductorDef, null, 2);
      activeWorkflowJson = json.length > 8000 ? json.slice(0, 8000) + '\n…(truncated)' : json;
      if (!pageLabel) {
        pageLabel = `Workflow Designer – ${workflow.name}`;
      }
    } catch {
      // If conversion fails, fall back to raw store format
      try {
        const raw = JSON.stringify(
          {
            name: workflow.name,
            description: workflow.description,
            version: workflow.version,
            tasks: workflow.nodes?.map((n) => n.data ?? n),
            inputParameters: workflow.inputParameters,
            outputParameters: workflow.outputParameters,
            timeoutSeconds: workflow.timeoutSeconds,
            failureWorkflow: workflow.failureWorkflow,
          },
          null,
          2
        );
        activeWorkflowJson = raw.length > 8000 ? raw.slice(0, 8000) + '\n…(truncated)' : raw;
      } catch {
        // Silently skip
      }
    }
  }

  // ── Active execution summary ────────────────────────────────────────────────
  let activeExecutionSummary: string | undefined;
  if (executionDetails) {
    const ed = executionDetails;
    const taskLines = Array.isArray(ed.tasks)
      ? ed.tasks
          .slice(0, 20)
          .map(
            (t) =>
              `  [${t.status}] ${t.taskType} / ${t.referenceTaskName}` +
              (t.reasonForIncompletion ? ` → ${t.reasonForIncompletion}` : '')
          )
          .join('\n')
      : '';
    activeExecutionSummary =
      `Workflow: ${ed.workflowType ?? 'unknown'} (${ed.workflowId ?? 'unknown'})\n` +
      `Status: ${ed.status ?? 'unknown'}\n` +
      `Reason: ${ed.reasonForIncompletion ?? 'none'}\n` +
      (taskLines ? `Tasks:\n${taskLines}` : '');
  } else if (pageContext?.executionId) {
    // Best-effort: show execution ID so the LLM can reference it
    activeExecutionSummary = `Execution ID in view: ${pageContext.executionId}`;
    if (!pageLabel) pageLabel = `Execution Details – ${pageContext.executionId}`;
  }

  return {
    logSnapshot: loggingState.getLLMContextSnapshot(30, 20),
    executionDetails,
    dashboardStats,
    settingsSnapshot,
    activeWorkflowJson,
    activeExecutionSummary,
    pageLabel,
  };
}

// ─── LLM API Call ─────────────────────────────────────────────────────────────

export interface LLMCallOptions {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  onChunk?: (delta: string) => void;
}

/**
 * Calls the configured LLM endpoint (OpenAI-compatible) with the given messages.
 * Supports streaming if onChunk is provided.
 */
export async function callLLM(options: LLMCallOptions): Promise<string> {
  const settings = useSettingsStore.getState().openAiLlm;

  if (!settings.apiKey) {
    throw new Error(
      'No LLM API key configured. Please add your OpenAI API key in Settings → OpenAI LLM Configuration.'
    );
  }

  const model = settings.model || 'gpt-4o';
  const streaming = !!options.onChunk;

  const payload = {
    model,
    messages: options.messages,
    stream: streaming,
    temperature: 0.3,
    max_tokens: 2000,
  };

  const response = await fetch(settings.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`LLM API error ${response.status}: ${errorText}`);
  }

  // ── Streaming path ──
  if (streaming && options.onChunk) {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body reader available');

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const parsed = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const delta = parsed.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            fullText += delta;
            options.onChunk(delta);
          }
        } catch {
          // Skip unparseable lines
        }
      }
    }

    return fullText;
  }

  // ── Non-streaming path ──
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── High-level entry point ───────────────────────────────────────────────────

/**
 * Send a troubleshoot question with enriched context to the LLM.
 *
 * @param userMessage - The question from the user
 * @param history - Previous messages in the conversation
 * @param ctx - Context override (if not provided, auto-gathered from stores)
 * @param onChunk - Optional streaming callback
 */
export async function troubleshoot(
  userMessage: string,
  history: ChatMessage[],
  ctx?: TroubleshootContext,
  onChunk?: (delta: string) => void
): Promise<string> {
  const context = ctx ?? gatherAutoContext();
  const contextString = buildContextString(context);

  // Build the full message list for the LLM
  const systemContent = contextString
    ? `${SYSTEM_PROMPT}\n\n---\n## RUNTIME CONTEXT\n${contextString}`
    : SYSTEM_PROMPT;

  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: systemContent },
    // Include conversation history (skip system messages)
    ...history
      .filter((m) => m.role !== 'system')
      .slice(-10) // Keep last 10 exchanges to stay within token limits
      .map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  return callLLM({ messages, onChunk });
}
