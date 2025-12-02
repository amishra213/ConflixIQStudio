import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useParams } from 'react-router-dom';
import { CheckCircle2Icon, BoxIcon, ClockIcon, MailIcon } from 'lucide-react';

const getStatusBadgeClass = (status: string | undefined) => {
  if (status === 'active') return 'bg-success/10 text-success border-success/20';
  if (status === 'draft') return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-muted text-muted-foreground';
};

export default function WorkflowSummary() {
  const { id } = useParams();
  const { workflows, canvasNodes } = useWorkflowStore();
  const workflow = id ? workflows.find((w) => w.id === id) : null;

  const tasksByType = canvasNodes.reduce(
    (acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const configuredTasks = canvasNodes.filter((node) => node.config).length;
  const unconfiguredTasks = canvasNodes.length - configuredTasks;

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-foreground">
            Workflow Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Workflow Name</p>
              <p className="text-sm font-medium text-foreground">
                {workflow?.name || 'Untitled Workflow'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Version</p>
              <p className="text-sm font-medium text-foreground">v{workflow?.version || 1}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Owner Email</p>
              <div className="flex items-center gap-1.5">
                <MailIcon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-sm font-medium text-foreground">
                  {workflow?.ownerEmail || 'Not set'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Schema Version</p>
              <p className="text-sm font-medium text-foreground">{workflow?.schemaVersion || 2}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Tasks</p>
              <p className="text-sm font-medium text-foreground">{canvasNodes.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Timeout Policy</p>
              <Badge variant="outline" className="text-xs">
                {workflow?.timeoutPolicy || 'TIME_OUT_WF'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Timeout Seconds</p>
              <p className="text-sm font-medium text-foreground">
                {workflow?.timeoutSeconds || 0}s
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Restartable</p>
              <Badge
                variant="outline"
                className={
                  workflow?.restartable
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-muted text-muted-foreground'
                }
              >
                {workflow?.restartable ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge variant="outline" className={getStatusBadgeClass(workflow?.status)}>
                {workflow?.status || 'draft'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status Listener</p>
              <Badge
                variant="outline"
                className={
                  workflow?.workflowStatusListenerEnabled
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-muted text-muted-foreground'
                }
              >
                {workflow?.workflowStatusListenerEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>

          {workflow?.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground">{workflow.description}</p>
            </div>
          )}

          {workflow?.inputParameters && workflow.inputParameters.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Input Parameters</p>
              <div className="flex flex-wrap gap-1.5">
                {workflow.inputParameters.map((param: string) => (
                  <Badge key={param} variant="outline" className="text-xs bg-background">
                    {param}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {workflow?.outputParameters && Object.keys(workflow.outputParameters).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Output Parameters</p>
              <div className="space-y-1.5">
                {Object.entries(workflow.outputParameters).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 text-xs bg-background rounded px-2 py-1"
                  >
                    <span className="font-medium text-foreground">{key}:</span>
                    <span className="text-muted-foreground font-mono">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {workflow?.inputTemplate && Object.keys(workflow.inputTemplate).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Input Template</p>
              <div className="space-y-1.5">
                {Object.entries(workflow.inputTemplate).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 text-xs bg-background rounded px-2 py-1"
                  >
                    <span className="font-medium text-foreground">{key}:</span>
                    <span className="text-muted-foreground font-mono">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {workflow?.failureWorkflow && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Failure Workflow</p>
              <p className="text-sm font-medium text-foreground">{workflow.failureWorkflow}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-foreground">Task Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle2Icon className="h-5 w-5 text-success" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-muted-foreground">Configured</p>
                <p className="text-lg font-bold text-foreground">{configuredTasks}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <ClockIcon className="h-5 w-5 text-warning" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-muted-foreground">Unconfigured</p>
                <p className="text-lg font-bold text-foreground">{unconfiguredTasks}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-foreground">Task Types</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {Object.entries(tasksByType).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-2 rounded-lg bg-background"
                >
                  <div className="flex items-center gap-2">
                    <BoxIcon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    <span className="text-sm text-foreground">{type}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {count} {count === 1 ? 'task' : 'tasks'}
                  </Badge>
                </div>
              ))}
              {Object.keys(tasksByType).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No tasks added yet</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-foreground">Task Sequence</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {canvasNodes.map((node, index) => (
                <div
                  key={node.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{node.name}</p>
                      {node.config && (
                        <CheckCircle2Icon
                          className="h-3 w-3 text-success flex-shrink-0"
                          strokeWidth={2}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {node.type}
                      </Badge>
                      {node.config?.workflowTaskType && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-primary/10 text-primary border-primary/20"
                        >
                          {node.config.workflowTaskType}
                        </Badge>
                      )}
                    </div>
                    {node.config && (
                      <>
                        <p className="text-xs text-muted-foreground mt-1">
                          Task Ref: {node.config.taskReferenceName || node.config.name}
                        </p>
                        {node.config.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {node.config.description}
                          </p>
                        )}
                        {node.config.taskDefinition && (
                          <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                            <p className="text-xs font-medium text-foreground">Task Definition</p>
                            {node.config.taskDefinition.retryCount !== undefined && (
                              <p className="text-xs text-muted-foreground">
                                Retry: {node.config.taskDefinition.retryCount} x{' '}
                                {node.config.taskDefinition.retryLogic || 'FIXED'}
                              </p>
                            )}
                            {node.config.taskDefinition.timeoutSeconds !== undefined && (
                              <p className="text-xs text-muted-foreground">
                                Timeout: {node.config.taskDefinition.timeoutSeconds}s (
                                {node.config.taskDefinition.timeoutPolicy || 'RETRY'})
                              </p>
                            )}
                            {node.config.taskDefinition.rateLimitPerFrequency !== undefined && (
                              <p className="text-xs text-muted-foreground">
                                Rate Limit: {node.config.taskDefinition.rateLimitPerFrequency}/
                                {node.config.taskDefinition.rateLimitFrequencyInSeconds}s
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              {canvasNodes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks in workflow
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
