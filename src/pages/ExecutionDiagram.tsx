import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeftIcon, RefreshCwIcon } from 'lucide-react';
import { WorkflowDiagramViewer } from '@/components/workflow/WorkflowDiagramViewer';
import { WorkflowExecution, WorkflowTask } from '@/utils/workflowToMermaid';
import { ExecutionDetails as ExecutionDetailsData } from '@/services/executionService';
import { useExecutionService } from '@/hooks/useExecutionService';

export function ExecutionDiagram() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchExecutionDetails } = useExecutionService();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [workflowExecution, setWorkflowExecution] = useState<WorkflowExecution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executionData, setExecutionData] = useState<ExecutionDetailsData | null>(null);

  // Fetch execution details from API
  useEffect(() => {
    if (!id) return;

    const loadExecutionData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchExecutionDetails(id);
        setExecutionData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load execution details';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadExecutionData();
  }, [id, fetchExecutionDetails]);

  const convertToWorkflowExecution = useCallback(() => {
    if (!executionData) return;

    // Map API status to valid WorkflowTask status
    const mapStatus = (
      status: string
    ):
      | 'SCHEDULED'
      | 'IN_PROGRESS'
      | 'COMPLETED'
      | 'FAILED'
      | 'TIMED_OUT'
      | 'SKIPPED'
      | 'CANCELED'
      | undefined => {
      const upperStatus = status.toUpperCase();
      switch (upperStatus) {
        case 'SCHEDULED':
          return 'SCHEDULED';
        case 'IN_PROGRESS':
          return 'IN_PROGRESS';
        case 'COMPLETED':
          return 'COMPLETED';
        case 'FAILED':
          return 'FAILED';
        case 'TIMED_OUT':
          return 'TIMED_OUT';
        case 'SKIPPED':
          return 'SKIPPED';
        case 'CANCELED':
          return 'CANCELED';
        default:
          return undefined;
      }
    };

    const converted: WorkflowExecution = {
      workflowId: executionData.workflowId,
      workflowDefinition: {
        name: executionData.workflowName || executionData.workflowType || 'Unknown Workflow',
        version: 1,
        tasks: (executionData.tasks || []).map((task) => ({
          name: task.referenceTaskName,
          taskReferenceName: task.referenceTaskName,
          type: task.taskType || 'GENERIC',
          status: mapStatus(task.status),
        })),
      },
      tasks: (executionData.tasks || []).map((task) => ({
        taskId: task.taskId,
        name: task.referenceTaskName,
        taskReferenceName: task.referenceTaskName,
        type: task.taskType || 'GENERIC',
        status: mapStatus(task.status),
        workflowTask: {
          name: task.referenceTaskName,
          taskReferenceName: task.referenceTaskName,
          type: task.taskType || 'GENERIC',
          status: mapStatus(task.status),
        },
        startTime: task.startTime,
        endTime: task.endTime,
        inputData: task.inputData,
        outputData: task.outputData,
      })) as Array<
        WorkflowTask & {
          taskId: string;
          workflowTask: WorkflowTask;
          status: string;
          startTime?: number;
          endTime?: number;
          inputData?: Record<string, unknown>;
          outputData?: Record<string, unknown>;
        }
      >,
      status: executionData.status,
      startTime: executionData.startTime,
      endTime: executionData.endTime,
    };

    setWorkflowExecution(converted);
  }, [executionData]);

  // Convert execution data to workflow execution diagram format
  useEffect(() => {
    if (executionData) {
      convertToWorkflowExecution();
    }
  }, [executionData, convertToWorkflowExecution]);

  const handleRefresh = () => {
    if (executionData) {
      convertToWorkflowExecution();
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Card className="p-12 bg-card border-border text-center">
          <p className="text-foreground">Loading execution diagram...</p>
        </Card>
      </div>
    );
  }

  if (error || !executionData) {
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

  const execution = executionData;

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
            <h1 className="text-3xl font-medium text-foreground">
              {execution.workflowName || execution.workflowType || 'Unknown Workflow'}
            </h1>
            <p className="text-muted-foreground mt-1">Execution Diagram - {execution.workflowId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {execution.status === 'RUNNING' && (
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

      {workflowExecution && (
        <WorkflowDiagramViewer
          workflow={workflowExecution}
          type="execution"
          autoRefresh={autoRefresh && execution.status === 'RUNNING'}
          onRefresh={handleRefresh}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />
      )}
    </div>
  );
}
