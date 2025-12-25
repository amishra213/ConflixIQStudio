import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useLoggingStore } from '@/stores/loggingStore';
import {
  ActivityIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';

export function Dashboard() {
  const { workflows, executions } = useWorkflowStore();
  const { logs, clearLogs } = useLoggingStore();
  const { toast } = useToast();

  // Calculate cache sizes
  const workflowCacheSize = useMemo(() => {
    const workflowsStr = JSON.stringify(workflows);
    return (new Blob([workflowsStr]).size / 1024).toFixed(2); // KB
  }, [workflows]);

  const logCacheSize = useMemo(() => {
    const logsStr = JSON.stringify(logs);
    return (new Blob([logsStr]).size / 1024).toFixed(2); // KB
  }, [logs]);

  const handleClearWorkflowCache = () => {
    // Clear localStorage
    localStorage.removeItem('conductor-workflow-store');
    toast({
      title: 'Cache Cleared',
      description: 'Workflow cache has been cleared. Please refresh the page.',
    });
  };

  const handleClearLogCache = () => {
    clearLogs();
    toast({
      title: 'Logs Cleared',
      description: 'API logs have been cleared.',
    });
  };

  const activeWorkflows = workflows.filter((w) => w.status === 'active').length;
  const completedExecutions = executions.filter((e) => e.status === 'completed').length;
  const failedExecutions = executions.filter((e) => e.status === 'failed').length;

  const avgDuration =
    executions.filter((e) => e.duration).reduce((acc, e) => acc + (e.duration || 0), 0) /
    (executions.filter((e) => e.duration).length || 1);

  const chartData = [
    { name: 'Mon', executions: 12 },
    { name: 'Tue', executions: 19 },
    { name: 'Wed', executions: 15 },
    { name: 'Thu', executions: 22 },
    { name: 'Fri', executions: 18 },
    { name: 'Sat', executions: 8 },
    { name: 'Sun', executions: 5 },
  ];

  return (
    <div className="p-8 space-y-8 bg-background">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-base text-muted-foreground">Overview of your workflow orchestration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Active Workflows</p>
              <p className="text-3xl font-bold text-foreground">{activeWorkflows}</p>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <ActivityIcon className="w-6 h-6 text-cyan-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Completed</p>
              <p className="text-3xl font-bold text-foreground">{completedExecutions}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl">
              <CheckCircle2Icon className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Failed</p>
              <p className="text-3xl font-bold text-foreground">{failedExecutions}</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl">
              <XCircleIcon className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Avg Duration</p>
              <p className="text-3xl font-bold text-foreground">{Math.round(avgDuration)}s</p>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <ClockIcon className="w-6 h-6 text-cyan-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 bg-card border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground">Execution Trends</h3>
            <TrendingUpIcon className="w-5 h-5 text-cyan-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Bar dataKey="executions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-card border-border shadow-sm">
          <h3 className="text-xl font-semibold text-foreground mb-6">Recent Executions</h3>
          <div className="space-y-4">
            {executions.slice(0, 5).map((execution) => {
              let badgeClassName = 'bg-primary text-primary-foreground font-medium';
              if (execution.status === 'completed') {
                badgeClassName = 'bg-success text-white font-medium';
              } else if (execution.status === 'failed') {
                badgeClassName = 'bg-destructive text-white font-medium';
              }

              return (
                <div key={execution.id} className="flex items-start gap-3">
                  <div className="mt-1">
                    {execution.status === 'completed' && (
                      <CheckCircle2Icon className="w-5 h-5 text-success" />
                    )}
                    {execution.status === 'failed' && (
                      <XCircleIcon className="w-5 h-5 text-destructive" />
                    )}
                    {execution.status === 'running' && (
                      <ActivityIcon className="w-5 h-5 text-primary animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {execution.workflowName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(execution.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge className={badgeClassName}>{execution.status}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card border-border shadow-sm">
        <h3 className="text-xl font-semibold text-foreground mb-6">Cache Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-border rounded-lg bg-background">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Workflow Cache</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-foreground">{workflowCacheSize} KB</p>
                  <p className="text-sm text-muted-foreground">({workflows.length} workflows)</p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleClearWorkflowCache}
              variant="outline"
              className="w-full border-red-600/50 text-red-400 hover:bg-red-900/20 hover:border-red-500"
            >
              Clear Workflow Cache
            </Button>
          </div>

          <div className="p-4 border border-border rounded-lg bg-background">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">API Logs</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-foreground">{logCacheSize} KB</p>
                  <p className="text-sm text-muted-foreground">({logs.length} entries)</p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleClearLogCache}
              variant="outline"
              className="w-full border-red-600/50 text-red-400 hover:bg-red-900/20 hover:border-red-500"
            >
              Clear API Logs
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
