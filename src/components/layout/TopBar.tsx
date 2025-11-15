import { SearchIcon, BellIcon, HelpCircleIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';

export function TopBar() {
  const location = useLocation();

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
    return 'Netflix Conductor Designer';
  };

  return (
    <header className="h-16 bg-[#1a1f2e] border-b border-[#2a3142] px-8 flex items-center justify-between">
      <div className="flex items-center gap-6 flex-1">
        <h2 className="text-xl font-semibold text-white">{getBreadcrumb()}</h2>
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search workflows, tasks..."
            className="pl-10 h-9 bg-[#0f1419] text-white border-[#2a3142] focus-visible:ring-cyan-500 placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-[#2a3142] hover:text-white">
          <HelpCircleIcon className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-[#2a3142] hover:text-white relative">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full"></span>
        </Button>
      </div>
    </header>
  );
}
