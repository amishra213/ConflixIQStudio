import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWorkflowStore } from '@/stores/workflowStore';
import { CheckCircle2Icon, BoxIcon, ClockIcon } from 'lucide-react';

export default function WorkflowSummary() {
  const { currentWorkflow, canvasNodes } = useWorkflowStore();

  const tasksByType = canvasNodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const configuredTasks = canvasNodes.filter(node => node.config).length;
  const unconfiguredTasks = canvasNodes.length - configuredTasks;

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-foreground">Workflow Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Organization ID</p>
              <p className="text-sm font-medium text-foreground">{currentWorkflow?.orgId || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Workflow ID</p>
              <p className="text-sm font-medium text-foreground">{currentWorkflow?.workflowId || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Workflow Name</p>
              <p className="text-sm font-medium text-foreground">{currentWorkflow?.name || 'Untitled Workflow'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Version</p>
              <p className="text-sm font-medium text-foreground">v{currentWorkflow?.version || 1}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge 
                variant="outline"
                className={
                  currentWorkflow?.status === 'ACTIVE' 
                    ? 'bg-success/10 text-success border-success/20'
                    : currentWorkflow?.status === 'DRAFT'
                    ? 'bg-warning/10 text-warning border-warning/20'
                    : 'bg-muted text-muted-foreground'
                }
              >
                {currentWorkflow?.status || 'DRAFT'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Effective Date</p>
              <p className="text-sm font-medium text-foreground">{currentWorkflow?.effectiveDate || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">End Date</p>
              <p className="text-sm font-medium text-foreground">{currentWorkflow?.endDate || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Tasks</p>
              <p className="text-sm font-medium text-foreground">{canvasNodes.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Timeout</p>
              <p className="text-sm font-medium text-foreground">{currentWorkflow?.timeoutSeconds || 3600}s</p>
            </div>
          </div>

          {currentWorkflow?.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground">{currentWorkflow.description}</p>
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
                <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-background">
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
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks added yet
                </p>
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
                <div key={node.id} className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{node.name}</p>
                      {node.config && (
                        <CheckCircle2Icon className="h-3 w-3 text-success flex-shrink-0" strokeWidth={2} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{node.type}</p>
                    {node.config && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Task ID: {node.config.taskId}
                      </p>
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
