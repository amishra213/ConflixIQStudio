import { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DownloadIcon, ZoomInIcon, ZoomOutIcon, MaximizeIcon, RefreshCwIcon } from 'lucide-react';
import mermaid from 'mermaid';
import { workflowToMermaid, WorkflowDefinition, WorkflowExecution } from '@/utils/workflowToMermaid';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { JsonViewer } from '@/components/ui/json-viewer';

interface WorkflowDiagramViewerProps {
  workflow: WorkflowDefinition | WorkflowExecution | any | null;
  type: 'definition' | 'execution' | 'preview';
  autoRefresh?: boolean;
  onRefresh?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

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

export function WorkflowDiagramViewer({
  workflow,
  type,
  autoRefresh = false,
  onRefresh,
  isFullscreen = false,
  onToggleFullscreen,
}: WorkflowDiagramViewerProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

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

  const renderDiagram = useCallback(async () => {
    if (workflow && mermaidRef.current) {
      try {
        let workflowToRender = workflow;
        
        // If it's a preview (raw local workflow), convert it first
        if (type === 'preview' && !workflow.tasks) {
          const { localWorkflowToConductor } = await import('@/utils/workflowToMermaid');
          workflowToRender = localWorkflowToConductor(workflow);
        }
        
        const mermaidCode = workflowToMermaid(workflowToRender, {
          showStatus: type === 'execution',
          interactive: true,
          theme: 'dark',
          direction: 'TD',
        });
        
        const elementId = `mermaid-${type}-${Date.now()}`;
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
                
                const tasks = 'workflowDefinition' in workflow 
                  ? workflow.workflowDefinition.tasks 
                  : workflow.tasks;
                
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
  }, [workflow, type]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  useEffect(() => {
    if (autoRefresh && onRefresh) {
      const interval = setInterval(() => {
        onRefresh();
        renderDiagram();
      }, 3000);
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, onRefresh, renderDiagram]);

  const handleDownloadSVG = () => {
    if (mermaidRef.current) {
      const svgElement = mermaidRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const workflowName = 'name' in workflow ? workflow.name : 'workflow';
        a.download = `${workflowName.replace(/\s+/g, '-')}-diagram.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleDownloadMermaid = () => {
    if (workflow) {
      const mermaidCode = workflowToMermaid(workflow, {
        showStatus: type === 'execution',
        interactive: true,
        theme: 'dark',
        direction: 'TD',
      });
      
      const blob = new Blob([mermaidCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const workflowName = 'name' in workflow ? workflow.name : 'workflow';
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

  if (!workflow) {
    return (
      <Card className="p-12 bg-card border-border text-center">
        <p className="text-foreground">No workflow data available</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="space-y-3 flex-1">
            {type === 'execution' && (
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
            {type === 'execution' && onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="text-foreground border-border hover:bg-muted"
              >
                <RefreshCwIcon className="w-4 h-4" />
              </Button>
            )}
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
            {onToggleFullscreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFullscreen}
                className="text-foreground border-border hover:bg-muted"
              >
                <MaximizeIcon className="w-4 h-4" />
              </Button>
            )}
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
    </>
  );
}
