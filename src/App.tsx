import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Workflows } from './pages/Workflows';
import { WorkflowDesigner } from './pages/WorkflowDesigner';
import { UnifiedWorkflowDiagram } from './pages/UnifiedWorkflowDiagram';
import { WorkflowValidation } from './pages/WorkflowValidation';
import { ValidationHub } from './pages/ValidationHub';
import { Executions } from './pages/Executions';
import { ExecutionDetails } from './pages/ExecutionDetails';
import { Settings } from './pages/Settings';
import LogsViewer from './pages/LogsViewer';
import { APILogger } from './utils/apiLogger';
import { useWorkflowStore, type Workflow } from './stores/workflowStore';
import { fileStoreClient } from './utils/fileStore';

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Initialize API logging interceptor
    APILogger.createFetchInterceptor();

    // Load workflows from storage on app startup
    const loadWorkflows = async () => {
      try {
        // Try to load from localStorage first (fastest, most recent)
        const localStorageWorkflows = localStorage.getItem('workflows');
        if (localStorageWorkflows) {
          try {
            const parsed = JSON.parse(localStorageWorkflows);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log('Loaded workflows from localStorage:', parsed.length);
              useWorkflowStore.getState().loadWorkflows(parsed);
              return;
            }
          } catch (err) {
            console.warn('Failed to parse workflows from localStorage:', err);
          }
        }

        // Fallback to fileStore (persistent across app restarts if localStorage cleared)
        const storedWorkflows = await fileStoreClient.loadWorkflows();
        if (storedWorkflows && storedWorkflows.length > 0) {
          console.log('Loaded workflows from filestore:', storedWorkflows.length);
          useWorkflowStore.getState().loadWorkflows(storedWorkflows as Workflow[]);
          return;
        }
      } catch (err) {
        console.warn('Error loading workflows on startup:', err);
      }
    };

    loadWorkflows();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="workflow-designer" element={<WorkflowDesigner />} />
            <Route path="workflows" element={<Workflows />} />
            <Route path="workflows/:id" element={<WorkflowDesigner />} />
            <Route path="workflows/:id/diagram" element={<UnifiedWorkflowDiagram />} />
            <Route path="workflows/:id/validate" element={<WorkflowValidation />} />
            <Route path="validation" element={<ValidationHub />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="executions" element={<Executions />} />
            <Route path="executions/:id" element={<ExecutionDetails />} />
            <Route path="executions/:id/diagram" element={<UnifiedWorkflowDiagram />} />
            <Route path="diagram/:id" element={<UnifiedWorkflowDiagram />} />
            <Route path="logs" element={<LogsViewer />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
