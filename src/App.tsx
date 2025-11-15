import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

const queryClient = new QueryClient();

function App() {
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
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
