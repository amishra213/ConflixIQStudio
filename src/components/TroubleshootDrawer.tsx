import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  XIcon,
  SendIcon,
  Trash2Icon,
  BotIcon,
  UserIcon,
  SettingsIcon,
  RefreshCwIcon,
  CopyIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSettingsStore } from '@/stores/settingsStore';
import { useLoggingStore } from '@/stores/loggingStore';
import { useUIStore } from '@/stores/uiStore';
import {
  troubleshoot,
  gatherAutoContext,
  type ChatMessage,
  type TroubleshootContext,
} from '@/services/llmTroubleshootService';

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return (
    text
      .replace(
        /```([\w]*)\n?([\s\S]*?)```/g,
        '<pre class="bg-muted/60 rounded p-2 my-1 overflow-x-auto text-xs font-mono whitespace-pre-wrap">$2</pre>'
      )
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-muted/60 rounded px-1 py-0.5 text-xs font-mono">$1</code>'
      )
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xs font-semibold mt-2 mb-0.5">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-sm font-semibold mt-3 mb-1">$1</h2>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-xs">$1</li>')
      .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-xs">$1</li>')
      .replace(/^---$/gm, '<hr class="border-border my-1" />')
      .replace(/\n/g, '<br />')
  );
}

// ─── Quick suggestions ────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Why is my workflow stuck?',
  'How do I fix a TIMED_OUT task?',
  'Explain FORK_JOIN pattern',
  'How do I configure retries?',
  'Why is my worker not polling?',
  'Analyse the workflow and suggest changes to the config',
];

// ─── Context panel (collapsible) ──────────────────────────────────────────────

function ContextPanel({ ctx }: { ctx: TroubleshootContext }) {
  const [open, setOpen] = useState(false);
  const hasLogs = ctx.logSnapshot && ctx.logSnapshot.trim().length > 0;
  const hasWorkflow = !!(ctx.activeWorkflowJson && ctx.activeWorkflowJson.trim().length > 0);

  return (
    <div className="border-b border-border">
      <button
        className="w-full flex items-center justify-between px-3 py-2 bg-secondary/30 text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-1.5">
          <RefreshCwIcon className="w-3 h-3" />
          {ctx.pageLabel ? (
            <span className="text-foreground">{ctx.pageLabel}</span>
          ) : (
            <span>Context</span>
          )}
          {hasWorkflow && (
            <Badge className="bg-green-500/20 text-green-600 text-[10px] border-0 px-1 py-0">
              workflow JSON
            </Badge>
          )}
          {!hasLogs && (
            <Badge className="bg-amber-500/20 text-amber-600 text-[10px] border-0 px-1 py-0">
              no logs
            </Badge>
          )}
        </span>
        {open ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
      </button>
      {open && (
        <div className="p-3 space-y-2 bg-card max-h-48 overflow-y-auto">
          {ctx.dashboardStats && (
            <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap">
              {ctx.dashboardStats}
            </pre>
          )}
          {hasWorkflow && (
            <div>
              <p className="text-[10px] font-semibold text-green-600 mb-1">Workflow JSON (injected)</p>
              <pre className="text-[10px] font-mono text-foreground whitespace-pre-wrap">
                {ctx.activeWorkflowJson!.slice(0, 800)}
                {ctx.activeWorkflowJson!.length > 800 ? '\n…(truncated in preview)' : ''}
              </pre>
            </div>
          )}
          {hasLogs ? (
            <pre className="text-[10px] font-mono text-foreground whitespace-pre-wrap">
              {ctx.logSnapshot.slice(0, 1500)}
              {ctx.logSnapshot.length > 1500 ? '\n…(truncated)' : ''}
            </pre>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              No logs yet. Perform operations and they'll be included as context.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const { toast } = useToast();

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
        }`}
      >
        {isUser ? <UserIcon className="w-3 h-3" /> : <BotIcon className="w-3 h-3" />}
      </div>
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2 text-xs relative ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : msg.isError
              ? 'bg-destructive/10 border border-destructive/30 text-destructive rounded-tl-sm'
              : 'bg-card border border-border text-foreground rounded-tl-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        ) : (
          <div
            className="leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            navigator.clipboard
              .writeText(msg.content)
              .then(() => toast({ title: 'Copied', description: 'Copied to clipboard' }))
          }
          className="absolute -top-2 -right-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary border border-border text-muted-foreground hover:text-foreground rounded-full p-0"
        >
          <CopyIcon className="w-2.5 h-2.5" />
        </Button>
        <p
          className={`text-[9px] mt-1 ${isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}
        >
          {new Date(msg.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

// ─── Main drawer ──────────────────────────────────────────────────────────────

export function TroubleshootDrawer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { openAiLlm } = useSettingsStore();
  const loggingStore = useLoggingStore();
  const { isTroubleshootOpen, closeTroubleshoot } = useUIStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [ctx, setCtx] = useState<TroubleshootContext>(() => gatherAutoContext());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Derive page context from the current URL so the LLM always knows
   * which workflow / execution is in view.
   */
  const buildPageContext = useCallback(() => {
    const path = location.pathname;

    // /workflows/:id  — Workflow Designer
    const workflowMatch = /^\/workflows\/([^/]+)/.exec(path);
    if (workflowMatch) {
      return {
        workflowId: workflowMatch[1],
        pageLabel: `Workflow Designer`,
      };
    }

    // /executions/:id  — Execution Details
    const executionMatch = /^\/executions\/([^/]+)/.exec(path);
    if (executionMatch) {
      return {
        executionId: executionMatch[1],
        pageLabel: `Execution Details – ${executionMatch[1]}`,
      };
    }

    // /executions  — Execution list
    if (path === '/executions') {
      return { pageLabel: 'Executions List' };
    }

    // /workflow-designer (new/generic designer without ID)
    if (path === '/workflow-designer') {
      return { pageLabel: 'Workflow Designer' };
    }

    return undefined;
  }, [location.pathname]);

  const refreshContext = useCallback(() => {
    setCtx(gatherAutoContext(undefined, buildPageContext()));
  }, [buildPageContext, loggingStore.logs, loggingStore.executionEvents]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh context whenever the drawer opens or the page changes
  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  // Focus textarea when drawer opens
  useEffect(() => {
    if (isTroubleshootOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isTroubleshootOpen]);

  const isConfigured = !!openAiLlm.apiKey;

  const newMsgId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isStreaming) return;

    if (!isConfigured) {
      toast({
        title: 'LLM not configured',
        description: 'Add your OpenAI API key in Settings → OpenAI LLM Configuration.',
        variant: 'destructive',
      });
      return;
    }

    const userMsg: ChatMessage = {
      id: newMsgId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    const assistantId = newMsgId();
    setStreamingId(assistantId);
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString() },
    ]);

    try {
      const freshCtx = gatherAutoContext(undefined, buildPageContext());
      await troubleshoot(content, messages, freshCtx, (delta) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m))
        );
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `⚠️ ${errorMsg}`, isError: true } : m
        )
      );
    } finally {
      setIsStreaming(false);
      setStreamingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isTroubleshootOpen) return null;

  return (
    <>
      {/* Overlay (semi-transparent, clicking closes the drawer) */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={closeTroubleshoot}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[420px] max-w-full bg-background border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-2">
            <BotIcon className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">AI Troubleshoot</p>
              <p className="text-[10px] text-muted-foreground">
                {openAiLlm.model ?? 'gpt-4o'} ·{' '}
                {isConfigured ? (
                  <span className="text-green-500">configured</span>
                ) : (
                  <span className="text-amber-500">not configured</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              className="w-7 h-7 text-muted-foreground hover:text-foreground"
              title="LLM Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMessages([])}
              disabled={messages.length === 0}
              className="w-7 h-7 text-muted-foreground hover:text-foreground"
              title="Clear chat"
            >
              <Trash2Icon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeTroubleshoot}
              className="w-7 h-7 text-muted-foreground hover:text-foreground"
              title="Close"
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Context collapsible */}
        <ContextPanel ctx={ctx} />

        {/* Not configured warning */}
        {!isConfigured && (
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 flex-shrink-0">
            <AlertCircleIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground">
              Add an OpenAI API key in{' '}
              <button
                className="underline text-primary"
                onClick={() => {
                  closeTroubleshoot();
                  navigate('/settings');
                }}
              >
                Settings
              </button>{' '}
              to enable AI troubleshooting.
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <BotIcon className="w-10 h-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">How can I help?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ask about workflows, executions, errors, or Conductor configuration.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    disabled={!isConfigured || isStreaming}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {isStreaming && streamingId && (
                <div className="flex gap-2 items-center">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <BotIcon className="w-3 h-3 text-foreground" />
                  </div>
                  <div className="flex gap-1 items-center px-3 py-2 bg-card border border-border rounded-xl rounded-tl-sm">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-border p-3 bg-card">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isConfigured
                  ? 'Ask anything… (Enter to send)'
                  : 'Configure API key to start'
              }
              disabled={!isConfigured || isStreaming}
              rows={2}
              className="flex-1 resize-none bg-background border-border text-foreground text-xs placeholder:text-muted-foreground focus:border-primary"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!isConfigured || isStreaming || !input.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 w-9 p-0 flex items-center justify-center flex-shrink-0"
            >
              {isStreaming ? (
                <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <SendIcon className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {loggingStore.logs.length} logs · {loggingStore.executionEvents.length} events
            {ctx.activeWorkflowJson ? ' · workflow JSON' : ''} injected as context
          </p>
        </div>
      </div>
    </>
  );
}
