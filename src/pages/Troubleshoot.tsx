import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeftIcon,
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
import { useDashboardStore } from '@/stores/dashboardStore';
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
      // Code blocks
      .replace(
        /```([\w]*)\n?([\s\S]*?)```/g,
        '<pre class="bg-muted/60 rounded p-3 my-2 overflow-x-auto text-xs font-mono whitespace-pre-wrap">$2</pre>'
      )
      // Inline code
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-muted/60 rounded px-1 py-0.5 text-xs font-mono">$1</code>'
      )
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-3 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold mt-4 mb-1">$1</h2>')
      // Numbered list items
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
      // Bullet list items
      .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr class="border-border my-2" />')
      // Newlines → <br> (only for non-block elements)
      .replace(/\n/g, '<br />')
  );
}

// ─── Suggestion chips ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Why is my workflow stuck in RUNNING state?',
  'How do I fix a TIMED_OUT execution?',
  'What causes task FAILED status?',
  'Explain the FORK_JOIN pattern',
  'How do I configure retries for a task?',
  'Why is my worker not picking up tasks?',
  'What is the correct way to pass data between tasks?',
  'How do I troubleshoot a TERMINATED workflow?',
];

// ─── Message bubble ───────────────────────────────────────────────────────────

interface MessageBubbleProps {
  msg: ChatMessage;
}

function MessageBubble({ msg }: MessageBubbleProps) {
  const isUser = msg.role === 'user';
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      toast({ title: 'Copied', description: 'Message copied to clipboard.' });
    });
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
        }`}
      >
        {isUser ? <UserIcon className="w-4 h-4" /> : <BotIcon className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm relative ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : msg.isError
              ? 'bg-destructive/10 border border-destructive/30 text-destructive rounded-tl-sm'
              : 'bg-card border border-border text-foreground rounded-tl-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div
            className="prose prose-sm max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
          />
        )}
        {/* Copy button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary border border-border text-muted-foreground hover:text-foreground rounded-full"
          title="Copy"
        >
          <CopyIcon className="w-3 h-3" />
        </Button>

        {/* Timestamp */}
        <p
          className={`text-xs mt-1 ${isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}
        >
          {new Date(msg.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

// ─── Context panel ────────────────────────────────────────────────────────────

interface ContextPanelProps {
  ctx: TroubleshootContext;
}

function ContextPanel({ ctx }: ContextPanelProps) {
  const [open, setOpen] = useState(false);
  const snapshot = ctx.logSnapshot;
  const hasLogs = snapshot && snapshot.trim().length > 0;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-2 bg-secondary/50 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <RefreshCwIcon className="w-4 h-4 text-muted-foreground" />
          Context injected with next message
          {!hasLogs && (
            <Badge className="bg-amber-500/20 text-amber-600 text-xs border-0">no logs yet</Badge>
          )}
        </span>
        {open ? (
          <ChevronUpIcon className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="p-3 space-y-2 bg-card">
          {ctx.dashboardStats && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Dashboard Stats</p>
              <pre className="text-xs text-foreground font-mono whitespace-pre-wrap bg-muted/40 rounded p-2">
                {ctx.dashboardStats}
              </pre>
            </div>
          )}
          {ctx.settingsSnapshot && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Settings</p>
              <pre className="text-xs text-foreground font-mono whitespace-pre-wrap bg-muted/40 rounded p-2">
                {ctx.settingsSnapshot}
              </pre>
            </div>
          )}
          {hasLogs && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Log Snapshot</p>
              <pre className="text-xs text-foreground font-mono whitespace-pre-wrap bg-muted/40 rounded p-2 max-h-48 overflow-y-auto">
                {snapshot}
              </pre>
            </div>
          )}
          {!hasLogs && (
            <p className="text-xs text-muted-foreground">
              No API or execution logs captured yet. Perform some operations and they will
              automatically be included here.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Troubleshoot() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { openAiLlm } = useSettingsStore();
  const loggingStore = useLoggingStore();
  const dashboardStore = useDashboardStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [ctx, setCtx] = useState<TroubleshootContext>(() => gatherAutoContext());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Refresh context snapshot when store changes
  const refreshContext = useCallback(() => {
    setCtx(gatherAutoContext());
  }, [loggingStore.logs, loggingStore.executionEvents, dashboardStore.executionStats]);

  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  const isConfigured = !!openAiLlm.apiKey;

  const newMsgId = () =>
    `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isStreaming) return;

    if (!isConfigured) {
      toast({
        title: 'LLM not configured',
        description: 'Please add your OpenAI API key in Settings → OpenAI LLM Configuration.',
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

    // Placeholder assistant message for streaming
    const assistantId = newMsgId();
    setStreamingId(assistantId);
    const placeholderMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, placeholderMsg]);

    try {
      // Gather fresh context right before sending
      const freshCtx = gatherAutoContext();

      await troubleshoot(
        content,
        messages, // history before this message
        freshCtx,
        (delta) => {
          // Stream delta into assistant message
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m))
          );
        }
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: `⚠️ Error: ${errorMsg}`,
                isError: true,
              }
            : m
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

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleClearLogs = () => {
    useLoggingStore.getState().clearLogs();
    useLoggingStore.getState().clearExecutionEvents();
    refreshContext();
    toast({ title: 'Logs cleared', description: 'Runtime log context has been cleared.' });
  };

  return (
    <div className="flex flex-col h-full p-8 bg-background space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary"
            title="Back to dashboard"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">AI Troubleshoot</h1>
            <p className="text-base text-muted-foreground">
              Ask questions about Conductor OSS, workflows, executions, and ConflixIQ Studio
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isConfigured && (
            <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 flex items-center gap-1">
              <AlertCircleIcon className="w-3 h-3" />
              LLM not configured
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            title="Configure LLM settings"
          >
            <SettingsIcon className="w-4 h-4" />
            Configure LLM
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            disabled={messages.length === 0}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Trash2Icon className="w-4 h-4" />
            Clear chat
          </Button>
        </div>
      </div>

      {/* Context panel */}
      <div className="flex-shrink-0">
        <ContextPanel ctx={ctx} />
      </div>

      {/* Not configured warning */}
      {!isConfigured && (
        <Card className="flex-shrink-0 p-4 bg-amber-500/10 border-amber-500/30">
          <div className="flex items-start gap-3">
            <AlertCircleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">OpenAI API key required</p>
              <p className="text-xs text-muted-foreground mt-1">
                Go to{' '}
                <button
                  className="underline text-primary hover:text-primary/80"
                  onClick={() => navigate('/settings')}
                >
                  Settings
                </button>{' '}
                and add your OpenAI API key (or compatible endpoint) under{' '}
                <strong>OpenAI LLM Configuration</strong> to start troubleshooting.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Message area */}
      <Card className="flex-1 overflow-hidden flex flex-col bg-card border-border min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="text-center">
                <BotIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-medium text-foreground">How can I help you?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ask about Conductor, workflows, executions, or ConflixIQ Studio configuration.
                  <br />
                  Runtime logs and metrics will be automatically included as context.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    disabled={!isConfigured || isStreaming}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
              {/* Streaming indicator */}
              {isStreaming && streamingId && (
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <BotIcon className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="flex gap-1 items-center px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-sm">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="flex-shrink-0 border-t border-border p-4">
          <div className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isConfigured
                  ? 'Ask about Conductor or ConflixIQ Studio… (Enter to send, Shift+Enter for newline)'
                  : 'Configure your OpenAI API key in Settings to start troubleshooting'
              }
              disabled={!isConfigured || isStreaming}
              rows={2}
              className="flex-1 resize-none bg-secondary border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => handleSend()}
                disabled={!isConfigured || isStreaming || !input.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 p-0 flex items-center justify-center"
                title="Send (Enter)"
              >
                {isStreaming ? (
                  <RefreshCwIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearLogs}
                title="Clear runtime log context"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
              >
                <Trash2Icon className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Context: {loggingStore.logs.length} API logs, {loggingStore.executionEvents.length}{' '}
            execution events · Model: {openAiLlm.model ?? 'gpt-4o'}
          </p>
        </div>
      </Card>
    </div>
  );
}
