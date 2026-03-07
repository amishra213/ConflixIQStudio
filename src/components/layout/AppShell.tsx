import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Toaster } from '@/components/ui/toaster';
import { TroubleshootDrawer } from '@/components/TroubleshootDrawer';

export function AppShell() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Toaster />
      {/* AI Troubleshoot drawer — available on every page via TopBar button */}
      <TroubleshootDrawer />
    </div>
  );
}
