import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboardIcon, WorkflowIcon, ListChecksIcon, ActivityIcon, SettingsIcon, MoonIcon, SunIcon, LogOutIcon, ChevronLeftIcon, ChevronRightIcon, PenToolIcon, CheckCircleIcon } from 'lucide-react';
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
    { path: '/workflow-designer', label: 'Designer', icon: PenToolIcon },
    { path: '/workflows', label: 'Workflows', icon: WorkflowIcon },
    { path: '/tasks', label: 'Tasks', icon: ListChecksIcon },
    { path: '/executions', label: 'Executions', icon: ActivityIcon },
    { path: '/validation', label: 'Validation', icon: CheckCircleIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside
      className={`h-screen bg-[#1a1f2e] border-r border-[#2a3142] flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-6 flex items-center justify-between border-b border-[#2a3142]">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <img src={logo} alt="Netflix Conductor Designer Logo" className="w-8 h-8" />
            <h1 className="text-xl font-semibold text-white tracking-tight">Netflix Conductor Designer</h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-transparent text-gray-400 hover:bg-[#2a3142] hover:text-white"
        >
          {isCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
        </Button>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === '/workflow-designer' && location.pathname.startsWith('/workflows/')) ||
            (item.path === '/validation' && location.pathname.includes('/validate'));
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                className={`w-full justify-start font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#2a3142] text-cyan-400 hover:bg-[#2a3142]'
                    : 'text-gray-400 hover:bg-[#2a3142] hover:text-white'
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

      <div className="p-4 space-y-4 border-t border-[#2a3142]">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'}`}>
          {!isCollapsed && (
            <>
              <Avatar className="w-10 h-10 bg-cyan-500">
                <div className="flex items-center justify-center w-full h-full text-white font-semibold">JD</div>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">John Doe</p>
                <p className="text-xs text-gray-400 truncate">john@example.com</p>
              </div>
            </>
          )}
          {isCollapsed && (
            <Avatar className="w-10 h-10 bg-cyan-500">
              <div className="flex items-center justify-center w-full h-full text-white font-semibold">JD</div>
            </Avatar>
          )}
        </div>

        <div className={`flex gap-2 ${isCollapsed ? 'flex-col' : 'px-2'}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-gray-400 hover:bg-[#2a3142] hover:text-white"
          >
            {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:bg-[#2a3142] hover:text-white"
          >
            <LogOutIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
