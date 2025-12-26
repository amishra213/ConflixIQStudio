import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  WorkflowIcon,
  ListChecksIcon,
  ActivityIcon,
  SettingsIcon,
  MoonIcon,
  SunIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PenToolIcon,
  CheckCircleIcon,
  FileTextIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useThemeStore } from '@/stores/themeStore';
import logo from '../../../resources/logo.svg';
import { useState } from 'react';

export function Sidebar() {
  const location = useLocation();
  const { isDark, toggleTheme } = useThemeStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
    { path: '/workflow-designer', label: 'Designer', icon: PenToolIcon, isDesigner: true },
    { path: '/workflows', label: 'Workflows', icon: WorkflowIcon },
    { path: '/tasks', label: 'Tasks', icon: ListChecksIcon },
    { path: '/executions', label: 'Executions', icon: ActivityIcon },
    { path: '/validation', label: 'Validation', icon: CheckCircleIcon },
    { path: '/logs', label: 'API Logs', icon: FileTextIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside
      className={`h-screen bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-6 flex items-center justify-between border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </Button>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isInWorkflowDesigner =
            location.pathname.startsWith('/workflows/') ||
            location.pathname === '/workflow-designer';
          const isActive =
            location.pathname === item.path ||
            (item.path === '/workflow-designer' && isInWorkflowDesigner) ||
            (item.path === '/workflows' && location.pathname === '/workflows') ||
            (item.path === '/validation' && location.pathname.includes('/validate'));
          return (
            <Link key={`${item.path}-${item.label}-${index}`} to={item.path}>
              <Button
                variant="ghost"
                className={`w-full justify-start font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-secondary text-primary hover:bg-secondary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                } ${isCollapsed ? 'px-2 justify-center' : 'px-4'}`}
              >
                <Icon className="w-5 h-5 min-w-5" />
                {!isCollapsed && <span className="ml-3 text-sm">{item.label}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-border" />

      <div className="p-4 space-y-4 border-t border-border">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'}`}>
          {!isCollapsed && (
            <>
              <Avatar className="w-10 h-10 bg-cyan-500">
                <div className="flex items-center justify-center w-full h-full text-white font-semibold">
                  JD
                </div>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">John Doe</p>
                <p className="text-xs text-gray-400 truncate">john@example.com</p>
              </div>
            </>
          )}
          {isCollapsed && (
            <Avatar className="w-10 h-10 bg-cyan-500">
              <div className="flex items-center justify-center w-full h-full text-white font-semibold">
                JD
              </div>
            </Avatar>
          )}
        </div>

        <div className={`flex gap-2 ${isCollapsed ? 'flex-col' : 'px-2'}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
