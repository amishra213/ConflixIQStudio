import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HeaderBar from '../components/HeaderBar';
import ConnectionStatus from '../components/ConnectionStatus';

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <HeaderBar />
        <main className="flex-1 overflow-y-auto px-8 py-8 lg:px-12 lg:py-12">
          <Outlet />
        </main>
      </div>
      <ConnectionStatus />
    </div>
  );
}
