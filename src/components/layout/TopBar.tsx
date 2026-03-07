import { SearchIcon, BellIcon, HelpCircleIcon, BotIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';

export function TopBar() {
  const location = useLocation();
  const { toggleTroubleshoot, isTroubleshootOpen } = useUIStore();
  const { openAiLlm } = useSettingsStore();

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/workflow-designer') return 'Workflow Designer';
    if (path === '/workflows') return 'Workflows';
    if (path.startsWith('/workflows/')) return 'Workflow Designer';
    if (path === '/tasks') return 'Tasks';
    if (path === '/executions') return 'Executions';
    if (path.startsWith('/executions/')) return 'Execution Details';
    if (path === '/settings') return 'Settings';
    if (path === '/logs') return 'API Logs';
    if (path === '/validation') return 'Validation';
    return 'ConflixIQ Studio';
  };

  const isLlmConfigured = !!openAiLlm.apiKey;

  return (
    <header className="h-16 bg-card border-b border-border px-8 flex items-center justify-between">
      <div className="flex items-center gap-6 flex-1">
        <h2 className="text-xl font-semibold text-foreground">{getBreadcrumb()}</h2>
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search workflows, tasks..."
            className="pl-10 h-9 bg-background text-foreground border-border focus-visible:ring-primary placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* AI Troubleshoot toggle button */}
        <Button
          variant={isTroubleshootOpen ? 'secondary' : 'ghost'}
          size="sm"
          onClick={toggleTroubleshoot}
          className={`flex items-center gap-1.5 font-medium transition-all ${
            isTroubleshootOpen
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
          title="AI Troubleshoot — ask about Conductor, workflows, and errors"
        >
          <BotIcon className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">AI Troubleshoot</span>
          {!isLlmConfigured && (
            <span
              className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"
              title="LLM API key not configured"
            />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-secondary hover:text-foreground"
          onClick={() =>
            window.open(
              'https://github.com/amishra213/ConflixIQStudio/blob/main/README.md',
              '_blank'
            )
          }
          title="View Documentation"
        >
          <HelpCircleIcon className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-secondary hover:text-foreground relative"
        >
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
        </Button>
      </div>
    </header>
  );
}
