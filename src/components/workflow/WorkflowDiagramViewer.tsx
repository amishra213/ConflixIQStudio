import { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DownloadIcon, ZoomInIcon, ZoomOutIcon, MaximizeIcon, RefreshCwIcon } from 'lucide-react';
import mermaid from 'mermaid';
import {
  workflowToMermaid,
  WorkflowDefinition,
  WorkflowExecution,
} from '@/utils/workflowToMermaid';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { JsonViewer } from '@/components/ui/json-viewer';

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

interface WorkflowDiagramViewerProps {
  readonly workflow: WorkflowDefinition | WorkflowExecution | null;
  readonly type: 'definition' | 'execution' | 'preview';
  readonly autoRefresh?: boolean;
  readonly onRefresh?: () => void;
  readonly isFullscreen?: boolean;
  readonly onToggleFullscreen?: () => void;
}

const TASK_TYPE_MAP: Record<string, string> = {
  'http|api|request': 'HTTP',
  'lambda|function': 'LAMBDA',
  'transform|map|mapper': 'MAPPER',
  'decision|switch|condition': 'DECISION',
  'fork|parallel': 'FORK_JOIN',
  'join|converge': 'CONVERGE',
  wait_signal: 'WAIT_FOR_SIGNAL',
  wait: 'WAIT',
  signal: 'SIGNAL',
  'event|publish': 'EVENT',
  'loop|while': 'DO_WHILE',
  'terminate|end|stop': 'TERMINATE',
  'workflow|sub': 'SUB_WORKFLOW',
  dynamic: 'DYNAMIC',
  'pass|passthrough': 'PASS_THROUGH',
};

function inferTaskType(taskName: string): string {
  const nameLower = taskName.toLowerCase();
  for (const [pattern, type] of Object.entries(TASK_TYPE_MAP)) {
    const keywords = pattern.split('|');
    for (const keyword of keywords) {
      if (keyword.includes('_')) {
        const parts = keyword.split('_');
        if (parts.every((part) => nameLower.includes(part))) {
          return type;
        }
      } else if (nameLower.includes(keyword)) {
        return type;
      }
    }
  }
  return 'GENERIC';
}

const getStatusBadgeClass = (status: string): string => {
  const statusLower = status.toLowerCase();
  if (statusLower === 'completed') return 'bg-green-600';
  if (statusLower === 'failed') return 'bg-red-600';
  if (statusLower === 'running') return 'bg-blue-600';
  if (statusLower === 'pending') return 'bg-gray-600';
  return 'bg-gray-500';
};

const handleNodeClick = (
  node: Element,
  workflow: WorkflowDefinition | WorkflowExecution | null
): WorkflowTask | null => {
  if (!workflow) return null;

  const nodeId = node.id;
  const taskRef = nodeId.split('_')[0];

  const tasks =
    'workflowDefinition' in workflow ? workflow.workflowDefinition.tasks : workflow.tasks;

  const task = tasks?.find(
    (t: WorkflowTask) => t.taskReferenceName?.replaceAll(/[^a-zA-Z0-9]/g, '_') === taskRef
  );

  return task || null;
};

export function WorkflowDiagramViewer({
  workflow,
  type,
  autoRefresh = false,
  onRefresh,
  isFullscreen = false,
  onToggleFullscreen,
}: Readonly<WorkflowDiagramViewerProps>) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis',
        nodeSpacing: 80,
        rankSpacing: 120,
        padding: 20,
      },
    });
  }, []);

  const setupDiagramInteractions = useCallback(
    (svgElement: SVGElement) => {
      const nodes = svgElement.querySelectorAll('.node');
      for (const node of nodes) {
        node.addEventListener('click', () => {
          const task = handleNodeClick(node, workflow);
          if (task) {
            setSelectedTask(task);
          }
        });
        (node as HTMLElement).style.cursor = 'pointer';
      }
    },
    [workflow]
  );

  const convertWorkflowForRendering = useCallback(async () => {
    if (!workflow) return null;

    let workflowToRender = workflow;

    // If it's a WorkflowExecution, extract the definition
    if ('workflowDefinition' in workflowToRender) {
      return workflowToRender.workflowDefinition;
    }

    // If it's a preview (raw local workflow), convert it first
    if (type === 'preview' && !('tasks' in workflowToRender)) {
      const { localWorkflowToConductor } = await import('@/utils/workflowConverter');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      workflowToRender = localWorkflowToConductor(workflowToRender as any);
    }

    return workflowToRender;
  }, [workflow, type]);

  const renderDiagram = useCallback(async () => {
    if (!workflow || !mermaidRef.current) {
      return;
    }

    try {
      const workflowToRender = await convertWorkflowForRendering();
      if (!workflowToRender) {
        return;
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
          setupDiagramInteractions(svgElement);
        }
      }
    } catch (error) {
      console.error('Error rendering diagram:', error);
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML =
          '<p class="text-destructive">Error rendering workflow diagram</p>';
      }
    }
  }, [workflow, type, convertWorkflowForRendering, setupDiagramInteractions]);

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
        clearInterval(interval);
      };
    }

    if (refreshInterval && !autoRefresh) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, onRefresh, renderDiagram, refreshInterval]);

  const handleDownloadSVG = () => {
    if (!mermaidRef.current || !workflow) {
      return;
    }

    const svgElement = mermaidRef.current.querySelector('svg');
    if (!svgElement) {
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const workflowName = 'name' in workflow ? workflow.name : 'workflow';
    a.download = `${workflowName.replaceAll(' ', '-')}-diagram.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMermaid = () => {
    if (!workflow) {
      return;
    }

    const workflowDef = 'workflowDefinition' in workflow ? workflow.workflowDefinition : workflow;
    const mermaidCode = workflowToMermaid(workflowDef, {
      showStatus: type === 'execution',
      interactive: true,
      theme: 'dark',
      direction: 'TD',
    });

    const blob = new Blob([mermaidCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const workflowName = 'name' in workflowDef ? workflowDef.name : 'workflow';
    a.download = `${workflowName.replaceAll(' ', '-')}-diagram.mmd`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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

        <div
          className="p-8 overflow-auto"
          style={{ minHeight: isFullscreen ? 'calc(100vh - 200px)' : '600px' }}
        >
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
                  <label htmlFor="task-ref" className="text-sm font-semibold text-foreground">
                    Task Reference
                  </label>
                  <p id="task-ref" className="text-sm text-muted-foreground mt-1 font-mono">
                    {selectedTask.taskReferenceName || selectedTask.taskId}
                  </p>
                </div>
                <div>
                  <label htmlFor="task-type" className="text-sm font-semibold text-foreground">
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
                    <label htmlFor="task-status" className="text-sm font-semibold text-foreground">
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
                  <label htmlFor="task-desc" className="text-sm font-semibold text-foreground">
                    Description
                  </label>
                  <p id="task-desc" className="text-sm text-muted-foreground mt-1">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {selectedTask.inputParameters &&
                Object.keys(selectedTask.inputParameters).length > 0 && (
                  <div>
                    <label
                      htmlFor="task-input-params"
                      className="text-sm font-semibold text-foreground mb-2 block"
                    >
                      Input Parameters
                    </label>
                    <div id="task-input-params">
                      <JsonViewer
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
                    htmlFor="task-input-data"
                    className="text-sm font-semibold text-foreground mb-2 block"
                  >
                    Input Data
                  </label>
                  <div id="task-input-data">
                    <JsonViewer
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
                    htmlFor="task-output-data"
                    className="text-sm font-semibold text-foreground mb-2 block"
                  >
                    Output Data
                  </label>
                  <div id="task-output-data">
                    <JsonViewer
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
    </>
  );
}
