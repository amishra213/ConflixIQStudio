import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWorkflowStore } from '@/stores/workflowStore';
import { ArrowLeftIcon, RefreshCwIcon } from 'lucide-react';
import { WorkflowDiagramViewer } from '@/components/workflow/WorkflowDiagramViewer';
import { WorkflowExecution, WorkflowTask } from '@/utils/workflowToMermaid';

export function ExecutionDiagram() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { executions } = useWorkflowStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [workflowExecution, setWorkflowExecution] = useState<WorkflowExecution | null>(null);

  const execution = executions.find((e) => e.id === id);

  const convertToWorkflowExecution = useCallback(() => {
    if (!execution) return;

    // Map execution status to valid WorkflowTask status
    const mapStatus = (status: string): 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'TIMED_OUT' | 'SKIPPED' | 'CANCELED' | undefined => {
      const upperStatus = status.toUpperCase();
      switch (upperStatus) {
        case 'PENDING':
          return 'SCHEDULED';
        case 'RUNNING':
          return 'IN_PROGRESS';
        case 'COMPLETED':
          return 'COMPLETED';
        case 'FAILED':
          return 'FAILED';
        default:
          return undefined;
      }
    };

    const converted: WorkflowExecution = {
      workflowId: execution.id,
      workflowDefinition: {
        name: execution.workflowName,
        version: 1,
        tasks: execution.tasks.map(task => ({
          name: task.taskName,
          taskReferenceName: task.taskId,
          type: task.taskType || 'GENERIC',
          status: mapStatus(task.status),
        })),
      },
      tasks: execution.tasks.map(task => ({
        taskId: task.taskId,
        name: task.taskName,
        taskReferenceName: task.taskId,
        type: task.taskType || 'GENERIC',
        status: mapStatus(task.status),
        workflowTask: {
          name: task.taskName,
          taskReferenceName: task.taskId,
          type: task.taskType || 'GENERIC',
          status: mapStatus(task.status),
        },
        startTime: task.startTime ? new Date(task.startTime).getTime() : undefined,
        endTime: task.endTime ? new Date(task.endTime).getTime() : undefined,
        inputData: task.input,
        outputData: task.output,
      })) as Array<WorkflowTask & {
        taskId: string;
        workflowTask: WorkflowTask;
        status: string;
        startTime?: number;
        endTime?: number;
        inputData?: Record<string, unknown>;
        outputData?: Record<string, unknown>;
      }>,
      status: execution.status.toUpperCase(),
      startTime: new Date(execution.startTime).getTime(),
      endTime: execution.endTime ? new Date(execution.endTime).getTime() : undefined,
    };

    setWorkflowExecution(converted);
  }, [execution]);

  useEffect(() => {
    if (execution) {
      convertToWorkflowExecution();
    }
  }, [execution, convertToWorkflowExecution]);

  const handleRefresh = () => {
    convertToWorkflowExecution();
  };

  if (!execution) {
    return (
      <div className="p-8">
        <Card className="p-12 bg-card border-border text-center">
          <p className="text-foreground">Execution not found</p>
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

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'p-8'} space-y-8`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/executions/${id}`)}
            className="bg-transparent text-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-medium text-foreground">{execution.workflowName}</h1>
            <p className="text-muted-foreground mt-1">Execution Diagram - {execution.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {execution.status === 'running' && (
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

      <WorkflowDiagramViewer
        workflow={workflowExecution}
        type="execution"
        autoRefresh={autoRefresh && execution.status === 'running'}
        onRefresh={handleRefresh}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />
    </div>
  );
}
