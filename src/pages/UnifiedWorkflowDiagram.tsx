import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore } from '@/stores/workflowStore';
import { ArrowLeftIcon, RefreshCwIcon, AlertCircleIcon, DownloadIcon, ZoomInIcon, ZoomOutIcon, MaximizeIcon } from 'lucide-react';
import { useConductorApi } from '@/hooks/useConductorApi';
import { workflowToMermaid, localWorkflowToConductor } from '@/utils/workflowToMermaid';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { JsonViewer } from '@/components/ui/json-viewer';
import mermaid from 'mermaid';

type DiagramMode = 'workflow' | 'execution' | 'preview';

function inferTaskType(taskName: string): string {
  const nameLower = taskName.toLowerCase();
  
  if (nameLower.includes('http') || nameLower.includes('api') || nameLower.includes('request')) return 'HTTP';
  if (nameLower.includes('lambda') || nameLower.includes('function')) return 'LAMBDA';
  if (nameLower.includes('transform') || nameLower.includes('map') || nameLower.includes('mapper')) return 'MAPPER';
  if (nameLower.includes('decision') || nameLower.includes('switch') || nameLower.includes('condition')) return 'DECISION';
  if (nameLower.includes('fork') || nameLower.includes('parallel')) return 'FORK_JOIN';
  if (nameLower.includes('join') || nameLower.includes('converge')) return 'CONVERGE';
  if (nameLower.includes('wait') && nameLower.includes('signal')) return 'WAIT_FOR_SIGNAL';
  if (nameLower.includes('wait')) return 'WAIT';
  if (nameLower.includes('signal')) return 'SIGNAL';
  if (nameLower.includes('event') || nameLower.includes('publish')) return 'EVENT';
  if (nameLower.includes('loop') || nameLower.includes('while')) return 'DO_WHILE';
  if (nameLower.includes('terminate') || nameLower.includes('end') || nameLower.includes('stop')) return 'TERMINATE';
  if (nameLower.includes('workflow') || nameLower.includes('sub')) return 'SUB_WORKFLOW';
  if (nameLower.includes('dynamic')) return 'DYNAMIC';
  if (nameLower.includes('pass') || nameLower.includes('passthrough')) return 'PASS_THROUGH';
  
  return 'GENERIC';
}

export function UnifiedWorkflowDiagram() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { workflows, executions } = useWorkflowStore();
  
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [diagramData, setDiagramData] = useState<any>(null);
  const [dataSource, setDataSource] = useState<'api' | 'local' | 'execution'>('local');
  const [mode, setMode] = useState<DiagramMode>('workflow');
  
  const { fetchWorkflowByName, fetchExecution, loading } = useConductorApi({
    baseUrl: 'http://localhost:8080/api',
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
      const path = window.location.pathname;
      if (path.includes('/executions/')) {
        setMode('execution');
      } else if (path.includes('/workflows/')) {
        setMode('workflow');
      } else {
        setMode('preview');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (id) {
      loadDiagram();
    }
  }, [id, mode]);

  const loadDiagram = async () => {
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
  };

  const loadWorkflow = async () => {
    const workflow = workflows.find((w) => w.id === id);
    if (!workflow) return;

    try {
      const apiWorkflow = await fetchWorkflowByName(workflow.name);
      
      if (apiWorkflow) {
        setDiagramData(apiWorkflow);
        setDataSource('api');
      } else {
        const converted = localWorkflowToConductor(workflow);
        setDiagramData(converted);
        setDataSource('local');
      }
    } catch (err) {
      const converted = localWorkflowToConductor(workflow);
      setDiagramData(converted);
      setDataSource('local');
    }
  };

  const loadExecution = async () => {
    const execution = executions.find((e) => e.id === id);
    if (!execution) return;

    try {
      const apiExecution = await fetchExecution(id);
      
      if (apiExecution) {
        setDiagramData(apiExecution);
        setDataSource('api');
      } else {
        const converted = {
          workflowId: execution.id,
          workflowDefinition: {
            name: execution.workflowName,
            version: 1,
            tasks: execution.tasks.map(task => ({
              name: task.taskName,
              taskReferenceName: task.taskId,
              type: task.taskType || 'GENERIC',
              status: task.status.toUpperCase() as any,
            })),
          },
          tasks: execution.tasks.map(task => ({
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
      console.error('Failed to load execution:', err);
    }
  };

  const loadPreview = () => {
    const workflow = workflows.find((w) => w.id === id);
    if (workflow) {
      const converted = localWorkflowToConductor(workflow);
      setDiagramData(converted);
      setDataSource('local');
    }
  };

  const renderDiagram = useCallback(async () => {
    if (diagramData && mermaidRef.current) {
      try {
        let workflowToRender = diagramData;
        
        if (mode === 'preview' && !diagramData.tasks) {
          workflowToRender = localWorkflowToConductor(diagramData);
        }
        
        const mermaidCode = workflowToMermaid(workflowToRender, {
          showStatus: mode === 'execution',
          interactive: true,
          theme: 'dark',
          direction: 'TD',
        });
        
        const elementId = `mermaid-${mode}-${Date.now()}`;
        const { svg } = await mermaid.render(elementId, mermaidCode);
        
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
          
          const svgElement = mermaidRef.current.querySelector('svg');
          if (svgElement) {
            const nodes = svgElement.querySelectorAll('.node');
            nodes.forEach((node) => {
              node.addEventListener('click', () => {
                const nodeId = node.id;
                const taskRef = nodeId.split('_')[0];
                
                const tasks = 'workflowDefinition' in workflowToRender 
                  ? workflowToRender.workflowDefinition.tasks 
                  : workflowToRender.tasks;
                
                const task = tasks.find(
                  (t: any) => t.taskReferenceName?.replace(/[^a-zA-Z0-9]/g, '_') === taskRef
                );
                
                if (task) {
                  setSelectedTask(task);
                }
              });
              
              (node as HTMLElement).style.cursor = 'pointer';
            });
          }
        }
      } catch (error) {
        console.error('Error rendering diagram:', error);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = '<p class="text-destructive">Error rendering workflow diagram</p>';
        }
      }
    }
  }, [diagramData, mode]);

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
  }, [autoRefresh, mode]);

  const handleRefresh = () => {
    loadDiagram();
  };

  const handleDownloadSVG = () => {
    if (mermaidRef.current) {
      const svgElement = mermaidRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const workflowName = diagramData?.name || 'workflow';
        a.download = `${workflowName.replace(/\s+/g, '-')}-diagram.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleDownloadMermaid = () => {
    if (diagramData) {
      const mermaidCode = workflowToMermaid(diagramData, {
        showStatus: mode === 'execution',
        interactive: true,
        theme: 'dark',
        direction: 'TD',
      });
      
      const blob = new Blob([mermaidCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const workflowName = diagramData?.name || 'workflow';
      a.download = `${workflowName.replace(/\s+/g, '-')}-diagram.mmd`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

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
              className={autoRefresh ? 'bg-primary text-primary-foreground' : 'text-foreground border-border hover:bg-muted'}
            >
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
          )}
        </div>
      </div>

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
        
        <div className="p-8 overflow-auto" style={{ minHeight: isFullscreen ? 'calc(100vh - 200px)' : '600px' }}>
          <div
            ref={mermaidRef}
            className="flex items-center justify-center"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease',
            }}
          />
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
                  <label className="text-sm font-semibold text-foreground">Task Reference</label>
                  <p className="text-sm text-muted-foreground mt-1 font-mono">
                    {selectedTask.taskReferenceName || selectedTask.taskId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Task Type</label>
                  <Badge className="mt-1 bg-purple-500 text-white">
                    {selectedTask.type || selectedTask.taskType || inferTaskType(selectedTask.name || selectedTask.taskName)}
                  </Badge>
                </div>
                {selectedTask.status && (
                  <div>
                    <label className="text-sm font-semibold text-foreground">Status</label>
                    <Badge className={`mt-1 ${
                      selectedTask.status.toUpperCase() === 'COMPLETED' ? 'bg-success' :
                      selectedTask.status.toUpperCase() === 'FAILED' ? 'bg-destructive' :
                      selectedTask.status.toUpperCase() === 'IN_PROGRESS' ? 'bg-primary' :
                      'bg-muted'
                    } text-white`}>
                      {selectedTask.status.toUpperCase()}
                    </Badge>
                  </div>
                )}
              </div>
              
              {selectedTask.description && (
                <div>
                  <label className="text-sm font-semibold text-foreground">Description</label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
                </div>
              )}
              
              {selectedTask.inputParameters && Object.keys(selectedTask.inputParameters).length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Input Parameters</label>
                  <JsonViewer data={selectedTask.inputParameters} maxHeight="200px" collapsible={true} />
                </div>
              )}
              
              {selectedTask.inputData && (
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Input Data</label>
                  <JsonViewer data={selectedTask.inputData} maxHeight="200px" collapsible={true} />
                </div>
              )}
              
              {selectedTask.outputData && (
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Output Data</label>
                  <JsonViewer data={selectedTask.outputData} maxHeight="200px" collapsible={true} />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
