import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  SearchIcon,
  EyeIcon,
  PlayIcon,
  EditIcon,
  TrashIcon,
  PlusIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { useWorkflowStore } from '../stores/workflowStore';
import { cn } from '@/lib/utils';

interface WorkflowListItem {
  name: string;
  description: string;
  version: number;
  status?: 'active' | 'inactive' | 'draft';
  lastModified: string;
  tasksCount: number;
  executionsCount?: number;
}

export default function WorkflowsList() {
  const navigate = useNavigate();
  const { workflows, loadWorkflows, setCurrentWorkflow } = useWorkflowStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const mockWorkflows: WorkflowListItem[] = [
    {
      name: 'User Registration Flow',
      description: 'Complete user registration workflow with email verification',
      version: 3,
      status: 'active',
      lastModified: '2024-01-15T10:30:00Z',
      tasksCount: 5,
      executionsCount: 1234,
    },
    {
      name: 'Data Processing Pipeline',
      description: 'ETL pipeline for processing customer data',
      version: 2,
      status: 'active',
      lastModified: '2024-01-14T15:45:00Z',
      tasksCount: 8,
      executionsCount: 567,
    },
    {
      name: 'Payment Processing',
      description: 'Handle payment transactions and notifications',
      version: 5,
      status: 'active',
      lastModified: '2024-01-13T09:20:00Z',
      tasksCount: 6,
      executionsCount: 2891,
    },
    {
      name: 'Order Fulfillment',
      description: 'Complete order fulfillment workflow',
      version: 1,
      status: 'draft',
      lastModified: '2024-01-12T14:10:00Z',
      tasksCount: 4,
      executionsCount: 0,
    },
    {
      name: 'Email Campaign Manager',
      description: 'Automated email campaign workflow',
      version: 2,
      status: 'inactive',
      lastModified: '2024-01-10T11:00:00Z',
      tasksCount: 7,
      executionsCount: 456,
    },
    {
      name: 'Inventory Sync',
      description: 'Synchronize inventory across multiple systems',
      version: 4,
      status: 'active',
      lastModified: '2024-01-09T16:30:00Z',
      tasksCount: 5,
      executionsCount: 789,
    },
  ];

  const allWorkflows = [...workflows.map(w => ({
    name: w.name,
    description: w.description,
    version: w.version,
    status: 'active' as const,
    lastModified: new Date().toISOString(),
    tasksCount: w.tasks.length,
    executionsCount: 0,
  })), ...mockWorkflows];

  const filteredWorkflows = allWorkflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || workflow.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      case 'draft':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active':
        return CheckCircle2Icon;
      case 'inactive':
        return XCircleIcon;
      case 'draft':
        return AlertCircleIcon;
      default:
        return ClockIcon;
    }
  };

  const handleViewWorkflow = (workflow: WorkflowListItem) => {
    const existingWorkflow = workflows.find(w => w.name === workflow.name);
    if (existingWorkflow) {
      setCurrentWorkflow(existingWorkflow);
    }
    navigate('/workflows');
  };

  const handleCreateNew = () => {
    navigate('/workflows');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Workflows</h1>
          <p className="text-muted-foreground mt-2">
            Browse and manage your workflow definitions
          </p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <PlusIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
          Create Workflow
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
              <Input
                type="search"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background text-foreground border-border"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={selectedStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('all')}
                className={selectedStatus === 'all' ? '' : 'bg-transparent text-foreground border-border hover:bg-accent'}
              >
                All
              </Button>
              <Button
                variant={selectedStatus === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('active')}
                className={selectedStatus === 'active' ? '' : 'bg-transparent text-foreground border-border hover:bg-accent'}
              >
                Active
              </Button>
              <Button
                variant={selectedStatus === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('draft')}
                className={selectedStatus === 'draft' ? '' : 'bg-transparent text-foreground border-border hover:bg-accent'}
              >
                Draft
              </Button>
              <Button
                variant={selectedStatus === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('inactive')}
                className={selectedStatus === 'inactive' ? '' : 'bg-transparent text-foreground border-border hover:bg-accent'}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator className="bg-border" />
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            {filteredWorkflows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="text-center space-y-3">
                  <p className="text-lg font-medium text-muted-foreground">No workflows found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? 'Try adjusting your search criteria'
                      : 'Create your first workflow to get started'}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={handleCreateNew}
                      className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                      Create Workflow
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredWorkflows.map((workflow, index) => {
                  const StatusIcon = getStatusIcon(workflow.status);
                  return (
                    <div
                      key={`${workflow.name}-${index}`}
                      className="p-6 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-heading text-lg font-semibold text-foreground">
                                  {workflow.name}
                                </h3>
                                <Badge
                                  className={cn('text-xs', getStatusColor(workflow.status))}
                                >
                                  <StatusIcon className="h-3 w-3 mr-1" strokeWidth={1.5} />
                                  {workflow.status}
                                </Badge>
                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                  v{workflow.version}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {workflow.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" strokeWidth={1.5} />
                              <span>Modified {formatDate(workflow.lastModified)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>{workflow.tasksCount} tasks</span>
                            </div>
                            {workflow.executionsCount !== undefined && (
                              <div className="flex items-center gap-1">
                                <PlayIcon className="h-3 w-3" strokeWidth={1.5} />
                                <span>{workflow.executionsCount.toLocaleString()} executions</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewWorkflow(workflow)}
                            className="bg-transparent text-foreground border-border hover:bg-accent"
                          >
                            <EyeIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-transparent text-foreground border-border hover:bg-accent"
                            aria-label="Execute workflow"
                            title="Execute workflow"
                          >
                            <PlayIcon className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleViewWorkflow(workflow)}
                            className="bg-transparent text-foreground border-border hover:bg-accent"
                            aria-label="Edit workflow"
                            title="Edit workflow"
                          >
                            <EditIcon className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-transparent text-destructive border-border hover:bg-destructive/10"
                            aria-label="Delete workflow"
                            title="Delete workflow"
                          >
                            <TrashIcon className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
