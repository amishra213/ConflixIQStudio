import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { LayoutDashboardIcon, WorkflowIcon, ListTodoIcon, SettingsIcon, ChevronLeftIcon, MenuIcon, FileTextIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SidebarProps {
  readonly collapsed: boolean;
  readonly onToggleCollapse: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboardIcon, path: '/' },
  { id: 'workflows', label: 'Workflow Designer', icon: WorkflowIcon, path: '/workflows' },
  { id: 'workflows-list', label: 'Workflows', icon: WorkflowIcon, path: '/workflows/list' },
  { id: 'tasks', label: 'Tasks', icon: ListTodoIcon, path: '/tasks' },
  { id: 'logs', label: 'API Logs', icon: FileTextIcon, path: '/logs' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' },
];

export default function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sidebarRef.current) {
      gsap.to(sidebarRef.current, {
        width: collapsed ? '80px' : '256px',
        duration: 0.3,
        ease: 'power2.inOut',
      });
    }
  }, [collapsed]);

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  return (
    <>
      <div
        ref={sidebarRef}
        className="hidden h-full flex-col border-r border-border bg-card md:flex"
        style={{ width: collapsed ? '80px' : '256px' }}
      >
        <div className="flex h-16 items-center justify-between px-4 lg:h-20">
          {!collapsed && (
            <h2 className="font-heading text-xl font-bold text-foreground">Dashboard</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <MenuIcon className="h-5 w-5" strokeWidth={1.5} /> : <ChevronLeftIcon className="h-5 w-5" strokeWidth={1.5} />}
          </Button>
        </div>
        
        <Separator className="bg-border" />
        
        <nav className="flex-1 space-y-2 px-3 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.path)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-normal transition-all duration-200',
                  'hover:bg-accent hover:text-accent-foreground cursor-pointer',
                  isActive && 'bg-gradient-to-r from-primary/20 to-tertiary/20 border-l-2 border-primary text-foreground',
                  !isActive && 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="fixed bottom-4 left-4 z-50 md:hidden">
        <Button
          variant="default"
          size="icon"
          onClick={onToggleCollapse}
          className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
          aria-label="Toggle menu"
          title="Toggle menu"
        >
          <MenuIcon className="h-6 w-6" strokeWidth={1.5} />
        </Button>
      </div>
    </>
  );
}
