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
              // Ensure workflows have complete definitions
              const normalizedWorkflows = parsed.map((wf: unknown) => {
                const workflow = wf as Record<string, unknown>;
                // If nodes/edges are empty but definition exists, restore from definition
                if (
                  (!workflow.nodes ||
                    (Array.isArray(workflow.nodes) && workflow.nodes.length === 0)) &&
                  workflow.definition &&
                  typeof workflow.definition === 'object'
                ) {
                  const def = workflow.definition as Record<string, unknown>;
                  return {
                    ...workflow,
                    nodes: def.nodes || workflow.nodes || [],
                    edges: def.edges || workflow.edges || [],
                    settings: def.settings || workflow.settings,
                    tasks: def.tasks || workflow.tasks,
                  } as unknown as Workflow;
                }
                return workflow as unknown as Workflow;
              });
              useWorkflowStore.getState().loadWorkflows(normalizedWorkflows);
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
          // Map filestore format (with definition) back to workflow format
          const normalizedWorkflows = storedWorkflows.map((wf: unknown) => {
            const workflow = wf as Record<string, unknown>;
            const definition = (workflow.definition || {}) as Record<string, unknown>;

            return {
              id: workflow.id,
              name: workflow.name || definition.name || 'Unnamed Workflow',
              description: workflow.description || definition.description,
              version: definition.version as number | undefined,
              schemaVersion: definition.schemaVersion as number | undefined,
              ownerEmail: definition.ownerEmail as string | undefined,
              ownerApp: definition.ownerApp as string | undefined,
              createdBy: definition.createdBy as string | undefined,
              updatedBy: definition.updatedBy as string | undefined,
              createTime: definition.createTime as string | undefined,
              updateTime: definition.updateTime as string | undefined,
              // Restore nodes and edges from definition
              nodes: (definition.nodes || workflow.nodes || []) as unknown[],
              edges: (definition.edges || workflow.edges || []) as unknown[],
              createdAt: workflow.createdAt as string | undefined,
              status: (workflow.status || 'draft') as 'draft' | 'active' | 'paused',
              syncStatus: (workflow.syncStatus || 'local-only') as
                | 'local-only'
                | 'synced'
                | 'syncing',
              restartable: definition.restartable as boolean | undefined,
              timeoutSeconds: definition.timeoutSeconds as number | undefined,
              timeoutPolicy: definition.timeoutPolicy as string | undefined,
              workflowStatusListenerEnabled: definition.workflowStatusListenerEnabled as
                | boolean
                | undefined,
              failureWorkflow: definition.failureWorkflow as string | undefined,
              inputParameters: definition.inputParameters as string[] | undefined,
              outputParameters: definition.outputParameters as Record<string, unknown>,
              inputTemplate: definition.inputTemplate as Record<string, unknown>,
              accessPolicy: definition.accessPolicy as Record<string, unknown>,
              variables: definition.variables as Record<string, unknown>,
              tasks: definition.tasks as unknown[],
              settings: definition.settings,
            } as Workflow;
          });
          useWorkflowStore.getState().loadWorkflows(normalizedWorkflows);
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
            <Route path="workflow-designer/:id" element={<WorkflowDesigner />} />
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
