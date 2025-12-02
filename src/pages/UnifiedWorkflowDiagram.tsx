import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore } from '@/stores/workflowStore';
import {
  ArrowLeftIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  DownloadIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MaximizeIcon,
} from 'lucide-react';
import { useConductorApi } from '@/hooks/useConductorApi';
import { workflowToMermaid, type WorkflowDefinition } from '@/utils/workflowToMermaid';
import { localWorkflowToConductor } from '@/utils/workflowConverter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { JsonViewer } from '@/components/ui/json-viewer';
import mermaid from 'mermaid';

type DiagramMode = 'workflow' | 'execution' | 'preview';

interface WorkflowTask {
  name?: string;
  taskName?: string;
  taskReferenceName?: string;
  taskId?: string;
  type?: string;
  taskType?: string;
  status?: string;
  description?: string;
  inputParameters?: Record<string, unknown>;
  inputData?: unknown;
  outputData?: unknown;
}

interface DiagramDataType {
  name?: string;
  tasks?: WorkflowTask[];
  workflowDefinition?: { tasks?: WorkflowTask[] };
  [key: string]: unknown;
}

function getStatusBadgeClass(status?: string): string {
  if (!status) return 'bg-muted';

  const upper = status.toUpperCase();
  if (upper === 'COMPLETED') return 'bg-success';
  if (upper === 'FAILED') return 'bg-destructive';
  if (upper === 'IN_PROGRESS') return 'bg-primary';

  return 'bg-muted';
}

const TASK_TYPE_PATTERNS: Record<string, string[]> = {
  HTTP: ['http', 'api', 'request'],
  LAMBDA: ['lambda', 'function'],
  MAPPER: ['transform', 'map', 'mapper'],
  DECISION: ['decision', 'switch', 'condition'],
  FORK_JOIN: ['fork', 'parallel'],
  CONVERGE: ['join', 'converge'],
  WAIT_FOR_SIGNAL: ['wait', 'signal'],
  WAIT: ['wait'],
  SIGNAL: ['signal'],
  EVENT: ['event', 'publish'],
  DO_WHILE: ['loop', 'while'],
  TERMINATE: ['terminate', 'end', 'stop'],
  SUB_WORKFLOW: ['workflow', 'sub'],
  DYNAMIC: ['dynamic'],
  PASS_THROUGH: ['pass', 'passthrough'],
};

function inferTaskType(taskName: string): string {
  const nameLower = taskName.toLowerCase();

  // Check for WAIT_FOR_SIGNAL first (compound check)
  if (nameLower.includes('wait') && nameLower.includes('signal')) {
    return 'WAIT_FOR_SIGNAL';
  }

  // Check other patterns
  for (const [type, patterns] of Object.entries(TASK_TYPE_PATTERNS)) {
    if (type === 'WAIT_FOR_SIGNAL') continue; // Already checked above

    if (patterns.some((pattern) => nameLower.includes(pattern))) {
      return type;
    }
  }

  return 'GENERIC';
}

// Helper component to safely render JSON data without type issues
function SafeJsonViewer({
  data,
  maxHeight = '200px',
  collapsible = true,
}: {
  readonly data: unknown;
  readonly maxHeight?: string;
  readonly collapsible?: boolean;
}) {
  if (data === undefined || data === null) {
    return <div className="text-sm text-muted-foreground">No data</div>;
  }
  return <JsonViewer data={data} maxHeight={maxHeight} collapsible={collapsible} />;
}

export function UnifiedWorkflowDiagram() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { workflows, executions } = useWorkflowStore();

  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [diagramData, setDiagramData] = useState<DiagramDataType | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'local' | 'execution'>('local');
  const [mode, setMode] = useState<DiagramMode>('workflow');
  const [error, setError] = useState<string | null>(null);

  const { fetchWorkflowByName, fetchExecution, loading } = useConductorApi({
    enableFallback: true,
  });

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
    });
  }, []);

  // Determine mode from URL
  useEffect(() => {
    const modeParam = searchParams.get('mode') as DiagramMode;
    if (modeParam) {
      setMode(modeParam);
    } else {
      const path = globalThis.location.pathname;
      if (path.includes('/executions/')) {
        setMode('execution');
      } else if (path.includes('/workflows/')) {
        setMode('workflow');
      } else {
        setMode('preview');
      }
    }
  }, [searchParams]);

  const loadWorkflow = useCallback(async () => {
    const workflow = workflows.find((w) => w.id === id);
    if (!workflow) return;

    setError(null);

    try {
      // Check if workflow is published/on server, otherwise use local version
      if (workflow.publicationStatus === 'LOCAL' || workflow.syncStatus === 'local-only') {
        // Local draft workflow - use local version, don't fetch from API
        const converted = localWorkflowToConductor(workflow);
        setDiagramData(converted as DiagramDataType);
        setDataSource('local');
        return;
      }

      // Published workflow - try to fetch from API
      const apiWorkflow = await fetchWorkflowByName(workflow.name);

      if (apiWorkflow) {
        setDiagramData(apiWorkflow as DiagramDataType);
        setDataSource('api');
      } else {
        // Workflow not found on API - fallback to local version
        console.warn(
          `Workflow "${workflow.name}" not found on Conductor server, using local version`
        );
        const converted = localWorkflowToConductor(workflow);
        setDiagramData(converted as DiagramDataType);
        setDataSource('local');
      }
    } catch (err) {
      console.warn('Error loading workflow from API, falling back to local:', err);
      // Fallback: use local workflow version if API fails
      const converted = localWorkflowToConductor(workflow);
      setDiagramData(converted as DiagramDataType);
      setDataSource('local');
    }
  }, [id, workflows, fetchWorkflowByName]);

  const loadExecution = useCallback(async () => {
    const execution = executions.find((e) => e.id === id);
    if (!execution) return;

    try {
      const apiExecution = id ? await fetchExecution(id) : null;

      if (apiExecution) {
        setDiagramData(apiExecution as unknown as DiagramDataType);
        setDataSource('api');
      } else {
        const converted: DiagramDataType = {
          workflowId: execution.id,
          workflowDefinition: {
            tasks: execution.tasks.map((task) => ({
              name: task.taskName,
              taskReferenceName: task.taskId,
              type: task.taskType || 'GENERIC',
              status: task.status.toUpperCase() as unknown as string,
            })),
          },
          tasks: execution.tasks.map((task) => ({
            taskId: task.taskId,
            name: task.taskName,
            taskReferenceName: task.taskId,
            type: task.taskType || 'GENERIC',
            status: task.status.toUpperCase(),
            workflowTask: {
              name: task.taskName,
              taskReferenceName: task.taskId,
              type: task.taskType || 'GENERIC',
            },
            startTime: task.startTime ? new Date(task.startTime).getTime() : undefined,
            endTime: task.endTime ? new Date(task.endTime).getTime() : undefined,
            inputData: task.input,
            outputData: task.output,
          })),
          status: execution.status.toUpperCase(),
          startTime: new Date(execution.startTime).getTime(),
          endTime: execution.endTime ? new Date(execution.endTime).getTime() : undefined,
        };
        setDiagramData(converted);
        setDataSource('execution');
      }

      if (execution.status === 'running') {
        setAutoRefresh(true);
      }
    } catch (err) {
      // Fallback: use local execution data
      console.error('Failed to load execution from API:', err);
    }
  }, [id, executions, fetchExecution]);

  const loadPreview = useCallback(() => {
    const workflow = workflows.find((w) => w.id === id);
    if (workflow) {
      const converted = localWorkflowToConductor(workflow);
      setDiagramData(converted as DiagramDataType);
      setDataSource('local');
    }
  }, [id, workflows]);

  const loadDiagram = useCallback(async () => {
    if (!id) return;

    try {
      if (mode === 'execution') {
        await loadExecution();
      } else if (mode === 'workflow') {
        await loadWorkflow();
      } else if (mode === 'preview') {
        loadPreview();
      }
    } catch (err) {
      console.error('Failed to load diagram:', err);
    }
  }, [id, mode, loadExecution, loadWorkflow, loadPreview]);

  useEffect(() => {
    if (id) {
      loadDiagram();
    }
  }, [id, mode, loadDiagram]);

  const handleNodeClick = useCallback((node: Element, workflowToRender: WorkflowDefinition) => {
    const nodeId = node.id;
    const taskRef = nodeId.split('_')[0];

    const tasks =
      'workflowDefinition' in workflowToRender
        ? (workflowToRender as unknown as { workflowDefinition: WorkflowDefinition })
            .workflowDefinition.tasks
        : workflowToRender.tasks;

    const task = tasks?.find(
      (t: WorkflowTask) => t.taskReferenceName?.replaceAll(/[^a-zA-Z0-9]/g, '_') === taskRef
    );

    if (task) {
      setSelectedTask(task);
    }
  }, []);

  const setupNodeListeners = useCallback(
    (svgElement: SVGElement, workflowToRender: WorkflowDefinition) => {
      const nodes = svgElement.querySelectorAll('.node');
      for (const node of nodes) {
        node.addEventListener('click', () => handleNodeClick(node, workflowToRender));
        (node as HTMLElement).style.cursor = 'pointer';
      }
    },
    [handleNodeClick]
  );

  const renderDiagram = useCallback(async () => {
    if (!diagramData || !mermaidRef.current) return;

    try {
      let workflowToRender: WorkflowDefinition = diagramData as unknown as WorkflowDefinition;

      if (mode === 'preview' && diagramData && !('tasks' in diagramData)) {
        workflowToRender = localWorkflowToConductor(
          diagramData as unknown as Parameters<typeof localWorkflowToConductor>[0]
        );
      }

      const mermaidCode = workflowToMermaid(workflowToRender, {
        showStatus: mode === 'execution',
        interactive: true,
        theme: 'dark',
        direction: 'TD',
      });

      const elementId = `mermaid-${mode}-${Date.now()}`;
      const { svg } = await mermaid.render(elementId, mermaidCode);

      mermaidRef.current.innerHTML = svg;

      const svgElement = mermaidRef.current.querySelector('svg');
      if (svgElement) {
        setupNodeListeners(svgElement as SVGElement, workflowToRender);
      }
    } catch (error) {
      console.error('Error rendering diagram:', error);
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML =
          '<p class="text-destructive">Error rendering workflow diagram</p>';
      }
    }
  }, [diagramData, mode, setupNodeListeners]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  useEffect(() => {
    if (autoRefresh && mode === 'execution') {
      const interval = setInterval(() => {
        loadDiagram();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, mode, loadDiagram]);

  const handleRefresh = useCallback(() => {
    loadDiagram();
  }, [loadDiagram]);

  const handleDownloadSVG = useCallback(() => {
    if (mermaidRef.current) {
      const svgElement = mermaidRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(diagramData?.name || 'workflow').replaceAll(/\s+/g, '-')}-diagram.svg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    }
  }, [diagramData]);

  const handleDownloadMermaid = useCallback(() => {
    if (diagramData?.name) {
      const mermaidCode = workflowToMermaid(diagramData as WorkflowDefinition, {
        showStatus: mode === 'execution',
        interactive: true,
        theme: 'dark',
        direction: 'TD',
      });

      const blob = new Blob([mermaidCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${diagramData.name.replaceAll(/\s+/g, '-')}-diagram.mmd`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  }, [diagramData, mode]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const getBackRoute = () => {
    switch (mode) {
      case 'execution':
        return `/executions/${id}`;
      case 'workflow':
        return '/workflows';
      case 'preview':
        return `/workflows/${id}`;
      default:
        return '/workflows';
    }
  };

  const getTitle = () => {
    if (mode === 'execution') {
      const execution = executions.find((e) => e.id === id);
      return execution?.workflowName || 'Execution Diagram';
    } else {
      const workflow = workflows.find((w) => w.id === id);
      return workflow?.name || 'Workflow Diagram';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'execution':
        return `Execution Diagram - ${id}`;
      case 'workflow':
        return 'Workflow Definition Diagram';
      case 'preview':
        return 'Live Preview';
      default:
        return 'Workflow Diagram';
    }
  };

  if (!id) {
    return (
      <div className="p-8">
        <Card className="p-12 bg-card border-border text-center">
          <p className="text-foreground">No workflow or execution ID provided</p>
          <Button
            onClick={() => navigate('/workflows')}
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Back to Workflows
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'p-8'} space-y-8`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(getBackRoute())}
            className="bg-transparent text-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-medium text-foreground">{getTitle()}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">{getSubtitle()}</p>

              {mode === 'workflow' && dataSource === 'local' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/50 rounded text-xs text-yellow-400">
                  <AlertCircleIcon className="w-3 h-3" />
                  <span>Local Data</span>
                </div>
              )}
              {mode === 'workflow' && dataSource === 'api' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/50 rounded text-xs text-green-400">
                  <span>Conductor API</span>
                </div>
              )}
              {mode === 'execution' && dataSource === 'execution' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/50 rounded text-xs text-blue-400">
                  <span>Local Execution</span>
                </div>
              )}
              {mode === 'execution' && dataSource === 'api' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/50 rounded text-xs text-green-400">
                  <span>Conductor API</span>
                </div>
              )}
              {mode === 'preview' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 border border-purple-500/50 rounded text-xs text-purple-400">
                  <span>Preview Mode</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="text-foreground border-border hover:bg-muted"
          >
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {mode === 'execution' && (
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={
                autoRefresh
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground border-border hover:bg-muted'
              }
            >
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="bg-red-500/10 border border-red-500/50">
          <div className="p-4 flex items-start gap-3">
            <AlertCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-400 mb-1">Warning</h3>
              <p className="text-sm text-red-300/80">{error}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => loadDiagram()}
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300 flex-shrink-0"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      <Card className="bg-card border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="space-y-3 flex-1">
            {mode === 'execution' && (
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-2">Task Status</h4>
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#4caf50]"></div>
                    <span className="text-muted-foreground">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#f44336]"></div>
                    <span className="text-muted-foreground">Failed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#2196f3]"></div>
                    <span className="text-muted-foreground">Running</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#9e9e9e]"></div>
                    <span className="text-muted-foreground">Pending</span>
                  </div>
                </div>
              </div>
            )}
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Task Types</h4>
              <div className="flex items-center gap-4 text-xs flex-wrap">
                <span className="text-muted-foreground">◻️ Standard</span>
                <span className="text-muted-foreground">◆ Decision</span>
                <span className="text-muted-foreground">⬠ Fork/Join</span>
                <span className="text-muted-foreground">⬢ Loop</span>
                <span className="text-muted-foreground">⬭ Wait</span>
                <span className="text-muted-foreground">▶ Signal/Event</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              className="text-foreground border-border hover:bg-muted"
            >
              <ZoomOutIcon className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center">{zoom}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              className="text-foreground border-border hover:bg-muted"
            >
              <ZoomInIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-foreground border-border hover:bg-muted"
            >
              <MaximizeIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSVG}
              className="text-foreground border-border hover:bg-muted"
            >
              <DownloadIcon className="w-4 h-4 mr-1" />
              SVG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadMermaid}
              className="text-foreground border-border hover:bg-muted"
            >
              <DownloadIcon className="w-4 h-4 mr-1" />
              Mermaid
            </Button>
          </div>
        </div>

        <div
          className="p-8 overflow-auto"
          style={{ minHeight: isFullscreen ? 'calc(100vh - 200px)' : '600px' }}
        >
          {diagramData === null ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <AlertCircleIcon className="w-12 h-12 text-red-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Unable to Load Workflow</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    {error || 'No workflow data available'}
                  </p>
                </div>
                <Button
                  onClick={() => loadDiagram()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4"
                >
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div
              ref={mermaidRef}
              className="flex items-center justify-center"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease',
              }}
            />
          )}
        </div>
      </Card>

      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Task Details - {selectedTask?.name || selectedTask?.taskName}
            </DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground" htmlFor="task-ref">
                    Task Reference
                  </label>
                  <p className="text-sm text-muted-foreground mt-1 font-mono" id="task-ref">
                    {selectedTask.taskReferenceName || selectedTask.taskId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground" htmlFor="task-type">
                    Task Type
                  </label>
                  <div id="task-type">
                    <Badge className="mt-1 bg-purple-500 text-white">
                      {selectedTask.type ||
                        selectedTask.taskType ||
                        inferTaskType(selectedTask.name || selectedTask.taskName || '')}
                    </Badge>
                  </div>
                </div>
                {selectedTask.status && (
                  <div>
                    <label className="text-sm font-semibold text-foreground" htmlFor="task-status">
                      Status
                    </label>
                    <div id="task-status">
                      <Badge
                        className={`mt-1 ${getStatusBadgeClass(selectedTask.status)} text-white`}
                      >
                        {selectedTask.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {selectedTask.description && (
                <div>
                  <label className="text-sm font-semibold text-foreground" htmlFor="task-desc">
                    Description
                  </label>
                  <p className="text-sm text-muted-foreground mt-1" id="task-desc">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {selectedTask.inputParameters &&
                Object.keys(selectedTask.inputParameters).length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-foreground" htmlFor="input-params">
                      Input Parameters
                    </label>
                    <div id="input-params" className="text-sm text-muted-foreground mt-1">
                      <SafeJsonViewer
                        data={selectedTask.inputParameters}
                        maxHeight="200px"
                        collapsible={true}
                      />
                    </div>
                  </div>
                )}

              {selectedTask.inputData !== undefined && selectedTask.inputData !== null && (
                <div>
                  <label
                    className="text-sm font-semibold text-foreground mb-2 block"
                    htmlFor="input-data-viewer"
                  >
                    Input Data
                  </label>
                  <div id="input-data-viewer">
                    <SafeJsonViewer
                      data={selectedTask.inputData}
                      maxHeight="200px"
                      collapsible={true}
                    />
                  </div>
                </div>
              )}

              {selectedTask.outputData !== undefined && selectedTask.outputData !== null && (
                <div>
                  <label
                    className="text-sm font-semibold text-foreground mb-2 block"
                    htmlFor="output-data-viewer"
                  >
                    Output Data
                  </label>
                  <div id="output-data-viewer">
                    <SafeJsonViewer
                      data={selectedTask.outputData}
                      maxHeight="200px"
                      collapsible={true}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
