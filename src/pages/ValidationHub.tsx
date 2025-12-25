import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useWorkflowStore } from '@/stores/workflowStore';
import {
  CheckCircleIcon,
  SearchIcon,
  FilterIcon,
  FlaskConicalIcon,
  ListIcon,
  ArrowLeftIcon,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function ValidationHub() {
  const navigate = useNavigate();
  const { workflows } = useWorkflowStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWorkflows = workflows.filter(
    (workflow) =>
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workflow.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleValidateWorkflow = (workflowId: string) => {
    navigate(`/workflows/${workflowId}/validate`);
  };

  return (
    <div className="p-8 space-y-8 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary"
            title="Back to dashboard"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Workflow Validation Hub</h1>
            <p className="text-base text-muted-foreground">
              AI-powered test scenario generation and workflow validation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/20 text-primary border border-primary/50 px-4 py-2">
            🤖 LLM-Powered
          </Badge>
        </div>
      </div>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-xl font-semibold text-foreground mb-4">How Validation Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-primary">1</span>
            </div>
            <h4 className="text-sm font-semibold text-foreground">Select Workflow</h4>
            <p className="text-xs text-muted-foreground">
              Choose a workflow and provide sample input JSON with optional context
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-primary">2</span>
            </div>
            <h4 className="text-sm font-semibold text-foreground">LLM Analysis</h4>
            <p className="text-xs text-muted-foreground">
              LLM recursively analyzes each task and generates test scenarios
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-primary">3</span>
            </div>
            <h4 className="text-sm font-semibold text-foreground">Generate Tests</h4>
            <p className="text-xs text-muted-foreground">
              Auto-generate test input JSONs for each scenario or create custom ones
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-primary">4</span>
            </div>
            <h4 className="text-sm font-semibold text-foreground">Execute & Validate</h4>
            <p className="text-xs text-muted-foreground">
              Run tests on Conductor and view detailed execution results
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search workflows to validate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-background text-foreground border-border focus-visible:ring-primary placeholder:text-muted-foreground"
            />
          </div>
          <Button
            variant="outline"
            className="text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
          >
            <FilterIcon className="w-5 h-5 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {filteredWorkflows.length === 0 ? (
        <Card className="p-16 bg-card border-border text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircleIcon className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground">No workflows found</h3>
            <p className="text-base text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Create workflows first to start validation'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => navigate('/workflows')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium"
              >
                Go to Workflows
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-secondary">
                <TableHead className="text-muted-foreground font-semibold">Workflow Name</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Description</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-center">Tasks</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkflows.map((workflow) => {
                let badgeClassName = '';
                if (workflow.status === 'active') {
                  badgeClassName =
                    'bg-success/20 text-success border border-success/50 font-medium';
                } else if (workflow.status === 'paused') {
                  badgeClassName =
                    'bg-warning/20 text-warning border border-warning/50 font-medium';
                } else {
                  badgeClassName =
                    'bg-muted/20 text-muted-foreground border border-muted/50 font-medium';
                }
                return (
                  <TableRow
                    key={workflow.id}
                    className="border-border hover:bg-secondary transition-colors"
                  >
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircleIcon className="w-4 h-4 text-primary" />
                        </div>
                        {workflow.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-md truncate">
                      {workflow.description}
                    </TableCell>
                    <TableCell>
                      <Badge className={badgeClassName}>{workflow.status.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-primary/20 text-primary border border-primary/50 font-medium">
                        {workflow.nodes?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleValidateWorkflow(workflow.id)}
                          className="text-primary border-border hover:bg-primary/10 hover:text-primary"
                        >
                          <FlaskConicalIcon className="w-4 h-4 mr-1" />
                          View Test Cases
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate('/executions')}
                          className="text-primary border-border hover:bg-primary/10 hover:text-primary"
                        >
                          <ListIcon className="w-4 h-4 mr-1" />
                          Executions
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
