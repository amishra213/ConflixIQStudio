import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  WorkflowIcon,
  ListTodoIcon,
  ServerIcon,
  ActivityIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
  PlayIcon,
  PauseIcon,
  SettingsIcon,
} from 'lucide-react';
import { useWorkflowStore } from '../stores/workflowStore';
import { useSettingsStore } from '../stores/settingsStore';
import { cn } from '@/lib/utils';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { workflows } = useWorkflowStore();
  const { isConnected, serverUrl } = useSettingsStore();

  // Mock execution data - in real app, this would come from Conductor API
  const executionStats = {
    running: 12,
    completed: 145,
    failed: 3,
    paused: 2,
    total: 162,
  };

  // Mock task definitions count
  const totalTasks = 24;

  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.dashboard-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
        }
      );
    }
  }, []);

  const getConnectionStatus = () => {
    if (isConnected) {
      return {
        label: 'Connected',
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/20',
        icon: CheckCircle2Icon,
      };
    }
    return {
      label: 'Disconnected',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      borderColor: 'border-border',
      icon: XCircleIcon,
    };
  };

  const connectionStatus = getConnectionStatus();
  const ConnectionIcon = connectionStatus.icon;

  return (
    <div ref={containerRef} className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your Netflix Conductor workflows and tasks
        </p>
      </div>

      {/* Connection Status Banner */}
      {!isConnected && (
        <Card className="dashboard-card border-warning bg-warning/10">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircleIcon
                  className="h-5 w-5 text-warning flex-shrink-0 mt-0.5"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Not Connected to Netflix Conductor
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configure your connection to start managing workflows and view real-time
                    execution data.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => navigate('/settings')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
              >
                <SettingsIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Workflows Card */}
        <Card
          className="dashboard-card border-border bg-card hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/workflows/list')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <WorkflowIcon className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <Badge
                variant="outline"
                className="text-xs bg-primary/10 text-primary border-primary/20"
              >
                View All
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Workflows</p>
              <p className="text-3xl font-bold text-foreground">{workflows.length}</p>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card
          className="dashboard-card border-border bg-card hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/tasks')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-tertiary/10">
                <ListTodoIcon className="h-6 w-6 text-tertiary" strokeWidth={1.5} />
              </div>
              <Badge
                variant="outline"
                className="text-xs bg-tertiary/10 text-tertiary border-tertiary/20"
              >
                View All
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Task Definitions</p>
              <p className="text-3xl font-bold text-foreground">{totalTasks}</p>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status Card */}
        <Card
          className={cn(
            'dashboard-card border-border bg-card',
            !isConnected && 'cursor-pointer hover:shadow-lg transition-shadow'
          )}
          onClick={() => !isConnected && navigate('/settings')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-lg',
                  connectionStatus.bgColor
                )}
              >
                <ServerIcon className={cn('h-6 w-6', connectionStatus.color)} strokeWidth={1.5} />
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  connectionStatus.bgColor,
                  connectionStatus.color,
                  connectionStatus.borderColor
                )}
              >
                <ConnectionIcon className="h-3 w-3 mr-1" strokeWidth={1.5} />
                {connectionStatus.label}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Conductor Server</p>
              <p className="text-sm font-medium text-foreground truncate">
                {serverUrl || 'Not configured'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Executions Card */}
        <Card className="dashboard-card border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <ActivityIcon className="h-6 w-6 text-success" strokeWidth={1.5} />
              </div>
              <Badge
                variant="outline"
                className="text-xs bg-success/10 text-success border-success/20"
              >
                All Time
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Executions</p>
              <p className="text-3xl font-bold text-foreground">{executionStats.total}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Execution Status */}
      <Card className="dashboard-card border-border bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-xl text-foreground">
            Workflow Execution Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Running */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <PlayIcon className="h-5 w-5 text-warning" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Running</p>
                <p className="text-2xl font-bold text-foreground">{executionStats.running}</p>
              </div>
            </div>

            {/* Completed */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2Icon className="h-5 w-5 text-success" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-bold text-foreground">{executionStats.completed}</p>
              </div>
            </div>

            {/* Failed */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <XCircleIcon className="h-5 w-5 text-destructive" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Failed</p>
                <p className="text-2xl font-bold text-foreground">{executionStats.failed}</p>
              </div>
            </div>

            {/* Paused */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <PauseIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Paused</p>
                <p className="text-2xl font-bold text-foreground">{executionStats.paused}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="dashboard-card border-border bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-xl text-foreground">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 bg-transparent text-foreground border-border hover:bg-accent"
              onClick={() => navigate('/workflows')}
            >
              <WorkflowIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-medium">Create Workflow</p>
                <p className="text-xs text-muted-foreground">Design a new workflow</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 bg-transparent text-foreground border-border hover:bg-accent"
              onClick={() => navigate('/workflows/list')}
            >
              <ListTodoIcon className="h-5 w-5 text-tertiary" strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-medium">View Workflows</p>
                <p className="text-xs text-muted-foreground">Browse all workflows</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 bg-transparent text-foreground border-border hover:bg-accent"
              onClick={() => navigate('/tasks')}
            >
              <ActivityIcon className="h-5 w-5 text-success" strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-medium">Manage Tasks</p>
                <p className="text-xs text-muted-foreground">View task definitions</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
