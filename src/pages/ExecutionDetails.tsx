import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ActivityIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  MaximizeIcon,
  NetworkIcon,
} from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { JsonViewer } from '@/components/ui/json-viewer';
import { ExecutionDetails as ExecutionDetailsData } from '@/services/executionService';
import { useExecutionService } from '@/hooks/useExecutionService';

interface TaskModalData {
  type: 'input' | 'output';
  data: Record<string, unknown>;
  taskName: string;
}

export function ExecutionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchExecutionDetails } = useExecutionService();
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<TaskModalData | null>(null);
  const [execution, setExecution] = useState<ExecutionDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch execution details when component mounts
  useEffect(() => {
    const loadExecutionDetails = async () => {
      if (!id) {
        setError('No execution ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchExecutionDetails(id);
        setExecution(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load execution details';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadExecutionDetails();
  }, [id, toast, fetchExecutionDetails]);

  const toggleTaskExpansion = useCallback((taskIndex: number) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskIndex)) {
        newSet.delete(taskIndex);
      } else {
        newSet.add(taskIndex);
      }
      return newSet;
    });
  }, []);

  const handleCopyJson = useCallback(
    (data: unknown, label: string) => {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast({
        title: 'Copied to clipboard',
        description: `${label} JSON copied successfully`,
      });
    },
    [toast]
  );

  const handleDownloadJson = useCallback(
    (data: unknown, filename: string) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({
        title: 'Download started',
        description: `${filename} is being downloaded`,
      });
    },
    [toast]
  );

  // Map API task status to UI status
  const mapTaskStatus = (apiStatus: string): string => {
    const statusMap: Record<string, string> = {
      'SCHEDULED': 'pending',
      'IN_PROGRESS': 'running',
      'COMPLETED': 'completed',
      'FAILED': 'failed',
      'TIMED_OUT': 'failed',
      'SKIPPED': 'pending',
      'CANCELED': 'failed',
    };
    return statusMap[apiStatus] || 'pending';
  };

  const getStatusBadgeClass = useCallback((status: string) => {
    const uiStatus = mapTaskStatus(status);
    if (uiStatus === 'completed') return 'bg-success text-white';
    if (uiStatus === 'failed') return 'bg-destructive text-white';
    if (uiStatus === 'running') return 'bg-primary text-primary-foreground';
    return 'bg-muted text-muted-foreground';
  }, []);

  const getOutputMessage = useCallback((status: string) => {
    const uiStatus = mapTaskStatus(status);
    if (uiStatus === 'pending') return 'Task has not started yet';
    if (uiStatus === 'running') return 'Task is currently running...';
    return 'No output data available for this task';
  }, []);

  const taskStats = useMemo(() => {
    if (!execution?.tasks) {
      return { total: 0, completed: 0, failed: 0, running: 0, pending: 0 };
    }

    return execution.tasks.reduce(
      (acc, task) => {
        acc.total++;
        const uiStatus = mapTaskStatus(task.status);
        acc[uiStatus] = (acc[uiStatus] || 0) + 1;
        return acc;
      },
      { total: 0, completed: 0, failed: 0, running: 0, pending: 0 } as Record<string, number>
    );
  }, [execution]);

  if (isLoading) {
    return (
      <div className="p-8">
        <Card className="p-12 bg-card border-border text-center">
          <ActivityIcon className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-foreground">Loading execution details...</p>
        </Card>
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="p-8">
        <Card className="p-12 bg-card border-border text-center">
          <p className="text-destructive text-lg font-medium">
            {error ? `Error: ${error}` : 'Execution not found'}
          </p>
          <Button
            onClick={() => navigate('/executions')}
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Back to Executions
          </Button>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    const uiStatus = mapTaskStatus(status);
    switch (uiStatus) {
      case 'completed':
        return <CheckCircle2Icon className="w-6 h-6 text-success" />;
      case 'failed':
        return <XCircleIcon className="w-6 h-6 text-destructive" />;
      case 'running':
        return <ActivityIcon className="w-6 h-6 text-primary animate-pulse" />;
      default:
        return <ClockIcon className="w-6 h-6 text-muted-foreground" />;
    }
  };

  // Get workflow name from execution or use workflowType as fallback
  const workflowName = execution.workflowName || execution.workflowType || 'Unknown Workflow';

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/executions')}
          className="bg-transparent text-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back
        </Button>
        <div className="flex-1 flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-medium text-foreground">{workflowName}</h1>
            <p className="text-muted-foreground mt-1">Execution ID: {execution.workflowId}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/executions/${id}/diagram`)}
            className="text-purple-500 border-purple-500 hover:bg-purple-500/10"
          >
            <NetworkIcon className="w-4 h-4 mr-2" />
            View Diagram
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-card border-border">
          <div className="flex items-start gap-4">
            {getStatusIcon(execution.status)}
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-medium text-foreground capitalize">{execution.status}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-start gap-4">
            <ClockIcon className="w-6 h-6 text-tertiary" />
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-lg font-medium text-foreground">
                {execution.endTime && execution.startTime
                  ? `${((execution.endTime - execution.startTime) / 1000).toFixed(2)}s`
                  : 'In progress'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Start Time</p>
            <p className="text-sm font-normal text-foreground">
              {new Date(execution.startTime).toLocaleString()}
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div>
            <p className="text-sm text-muted-foreground mb-2">End Time</p>
            <p className="text-sm font-normal text-foreground">
              {execution.endTime ? new Date(execution.endTime).toLocaleString() : '-'}
            </p>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger
            value="tasks"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Task Breakdown
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Logs
          </TabsTrigger>
          <TabsTrigger
            value="input"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Input/Output
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card className="p-6 bg-card border-border">
            <div className="grid grid-cols-5 gap-4 mb-6 pb-6 border-b border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{taskStats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{taskStats.completed || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">{taskStats.failed || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Failed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{taskStats.running || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Running</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">{taskStats.pending || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Pending</p>
              </div>
            </div>

            <div className="space-y-3">
              {execution.tasks && execution.tasks.length > 0 ? (
                execution.tasks.map((task, index) => {
                  const isExpanded = expandedTasks.has(index);
                  const uiStatus = mapTaskStatus(task.status);

                  return (
                    <Card
                      key={task.taskId + index}
                      className="bg-background border-border overflow-hidden"
                    >
                      <button
                        type="button"
                        className="w-full flex items-start gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors text-left"
                        onClick={() => toggleTaskExpansion(index)}
                      >
                        <div className="mt-1 flex-shrink-0">
                          {uiStatus === 'completed' && (
                            <CheckCircle2Icon className="w-5 h-5 text-success" />
                          )}
                          {uiStatus === 'failed' && (
                            <XCircleIcon className="w-5 h-5 text-destructive" />
                          )}
                          {uiStatus === 'running' && (
                            <ActivityIcon className="w-5 h-5 text-primary animate-pulse" />
                          )}
                          {uiStatus === 'pending' && (
                            <ClockIcon className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h4 className="text-sm font-medium text-foreground">{task.referenceTaskName}</h4>
                              <Badge className={getStatusBadgeClass(task.status)}>
                                {uiStatus}
                              </Badge>
                              <span className="text-xs text-muted-foreground">Task #{index + 1}</span>
                              {task.retried && (
                                <Badge variant="outline" className="text-yellow-600">
                                  Retried ({task.retryCount})
                                </Badge>
                              )}
                              {task.workerId && (
                                <span className="text-xs text-muted-foreground">Worker: {task.workerId}</span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskExpansion(index);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDownIcon className="w-4 h-4" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4" />
                              )}
                            </Button>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            {task.startTime ? (
                              <span>Started: {new Date(task.startTime).toLocaleTimeString()}</span>
                            ) : null}
                            {task.endTime ? (
                              <span>Ended: {new Date(task.endTime).toLocaleTimeString()}</span>
                            ) : null}
                            {task.startTime && task.endTime ? (
                              <span className="text-primary font-medium">
                                Duration: {((task.endTime - task.startTime) / 1000).toFixed(2)}s
                              </span>
                            ) : null}
                            {task.pollCount > 0 && (
                              <span>Polls: {task.pollCount}</span>
                            )}
                            {task.queueWaitTime > 0 && (
                              <span>Queue Wait: {(task.queueWaitTime / 1000).toFixed(2)}s</span>
                            )}
                          </div>
                        </div>
                      </button>

                    {isExpanded && (
                      <div className="border-t border-border bg-muted/30 p-4 space-y-4">
                        {/* Task Metadata */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4 border-b border-border">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">Task Type</p>
                            <p className="text-sm text-foreground">{task.taskType}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">Task Def Name</p>
                            <p className="text-sm text-foreground">{task.taskDefName}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">Task ID</p>
                            <p className="text-xs font-mono text-muted-foreground truncate">{task.taskId}</p>
                          </div>
                          {task.workflowInstanceId && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">Workflow Instance</p>
                              <p className="text-xs font-mono text-muted-foreground truncate">{task.workflowInstanceId}</p>
                            </div>
                          )}
                          {task.workerId && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">Worker</p>
                              <p className="text-sm text-foreground">{task.workerId}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">Sequence</p>
                            <p className="text-sm text-foreground">{task.seq}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">Iteration</p>
                            <p className="text-sm text-foreground">{task.iteration || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">Retry Count</p>
                            <p className="text-sm text-foreground">{task.retryCount}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">Poll Count</p>
                            <p className="text-sm text-foreground">{task.pollCount}</p>
                          </div>
                          {task.reasonForIncompletion && (
                            <div className="col-span-full">
                              <p className="text-xs font-semibold text-destructive">Reason for Incompletion</p>
                              <p className="text-sm text-foreground">{task.reasonForIncompletion}</p>
                            </div>
                          )}
                          {task.subWorkflowId && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">Sub-Workflow ID</p>
                              <p className="text-xs font-mono text-muted-foreground truncate">{task.subWorkflowId}</p>
                            </div>
                          )}
                        </div>

                        {/* Input Data */}
                        {task.inputData ? (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-semibold text-foreground">Input Data</h5>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyJson(task.inputData, 'Input')}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <CopyIcon className="w-3 h-3 mr-1" />
                                    Copy
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDownloadJson(task.inputData, `task-${index + 1}-${task.referenceTaskName}-input.json`)
                                    }
                                    className="h-7 px-2 text-xs"
                                  >
                                    <DownloadIcon className="w-3 h-3 mr-1" />
                                    Download
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setSelectedTaskForModal({
                                        type: 'input',
                                        data: task.inputData as Record<string, unknown>,
                                        taskName: task.referenceTaskName,
                                      })
                                    }
                                    className="h-7 px-2 text-xs"
                                  >
                                    <MaximizeIcon className="w-3 h-3 mr-1" />
                                    Expand
                                  </Button>
                                </div>
                              </div>
                              <JsonViewer data={task.inputData} maxHeight="300px" collapsible={true} />
                            </div>
                          ) : (
                            <div>
                              <h5 className="text-sm font-semibold text-foreground mb-2">Input Data</h5>
                              <div className="bg-background border border-border rounded-lg p-4 text-xs text-muted-foreground">
                                No input data available for this task
                              </div>
                            </div>
                          )}

                        {/* Output Data */}
                        {task.outputData ? (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-semibold text-foreground">Output Data</h5>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyJson(task.outputData, 'Output')}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <CopyIcon className="w-3 h-3 mr-1" />
                                    Copy
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDownloadJson(
                                        task.outputData,
                                        `task-${index + 1}-${task.referenceTaskName}-output.json`
                                      )
                                    }
                                    className="h-7 px-2 text-xs"
                                  >
                                    <DownloadIcon className="w-3 h-3 mr-1" />
                                    Download
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setSelectedTaskForModal({
                                        type: 'output',
                                        data: task.outputData as Record<string, unknown>,
                                        taskName: task.referenceTaskName,
                                      })
                                    }
                                    className="h-7 px-2 text-xs"
                                  >
                                    <MaximizeIcon className="w-3 h-3 mr-1" />
                                    Expand
                                  </Button>
                                </div>
                              </div>
                              <JsonViewer data={task.outputData} maxHeight="300px" collapsible={true} />
                            </div>
                          ) : (
                            <div>
                              <h5 className="text-sm font-semibold text-foreground mb-2">Output Data</h5>
                              <div className="bg-background border border-border rounded-lg p-4 text-xs text-muted-foreground">
                                {getOutputMessage(task.status)}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </Card>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tasks found in this execution</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="p-6 bg-card border-border">
            <pre className="text-sm text-foreground font-mono bg-background p-4 rounded-lg border border-border overflow-x-auto">
              {`[${new Date(execution.startTime).toISOString()}] Workflow execution started
[${new Date(execution.startTime).toISOString()}] Initializing tasks...
${execution.tasks && execution.tasks.length > 0
  ? execution.tasks
    .map(
      (task) =>
        `[${task.startTime ? new Date(task.startTime).toISOString() : 'pending'}] Task ${task.referenceTaskName}: ${task.status}`
    )
    .join('\n')
  : '[...] No tasks recorded'}
${execution.endTime ? '[' + new Date(execution.endTime).toISOString() + '] Workflow execution completed' : '[...] Execution in progress'}`}
            </pre>
          </Card>
        </TabsContent>

        <TabsContent value="input">
          <Card className="p-6 bg-card border-border">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Input</h3>
                <pre className="text-sm text-foreground font-mono bg-background p-4 rounded-lg border border-border overflow-x-auto">
                  {JSON.stringify(execution.input || {}, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Output</h3>
                <pre className="text-sm text-foreground font-mono bg-background p-4 rounded-lg border border-border overflow-x-auto">
                  {execution.output
                    ? JSON.stringify(execution.output, null, 2)
                    : 'Output will be available when execution completes'}
                </pre>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedTaskForModal && (
        <dialog
          open
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 w-full h-full bg-transparent backdrop:bg-black/80 m-0 max-w-none max-h-none p-0"
        >
          <button
            type="button"
            className="absolute inset-0 w-full h-full bg-transparent cursor-default"
            onClick={() => setSelectedTaskForModal(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSelectedTaskForModal(null);
              }
            }}
            aria-label="Close modal"
          >
            <span className="sr-only">Close modal</span>
          </button>
          <div className="flex items-center justify-center h-full p-8 relative pointer-events-none">
            <Card className="w-full max-w-6xl h-full bg-card border-border flex flex-col pointer-events-auto">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h3 id="modal-title" className="text-xl font-semibold text-foreground">
                    {selectedTaskForModal.taskName} -{' '}
                    {selectedTaskForModal.type === 'input' ? 'Input' : 'Output'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Full JSON view</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopyJson(
                        selectedTaskForModal.data,
                        selectedTaskForModal.type === 'input' ? 'Input' : 'Output'
                      )
                    }
                  >
                    <CopyIcon className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDownloadJson(
                        selectedTaskForModal.data,
                        `${selectedTaskForModal.taskName.replaceAll(/\s+/g, '-')}-${selectedTaskForModal.type}.json`
                      )
                    }
                  >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedTaskForModal(null)}>
                    Close
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <JsonViewer
                  data={selectedTaskForModal.data}
                  collapsible={true}
                  defaultExpanded={false}
                />
              </div>
            </Card>
          </div>
        </dialog>
      )}
    </div>
  );
}
