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
    <div className="p-8 space-y-8 bg-[#0f1419]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white hover:bg-[#2a3142]"
            title="Back to dashboard"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Workflow Validation Hub</h1>
            <p className="text-base text-gray-400">
              AI-powered test scenario generation and workflow validation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/50 px-4 py-2">
            🤖 LLM-Powered
          </Badge>
        </div>
      </div>

      <Card className="p-6 bg-[#1a1f2e] border-[#2a3142]">
        <h3 className="text-xl font-semibold text-white mb-4">How Validation Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-purple-500">1</span>
            </div>
            <h4 className="text-sm font-semibold text-white">Select Workflow</h4>
            <p className="text-xs text-gray-400">
              Choose a workflow and provide sample input JSON with optional context
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-cyan-500">2</span>
            </div>
            <h4 className="text-sm font-semibold text-white">LLM Analysis</h4>
            <p className="text-xs text-gray-400">
              LLM recursively analyzes each task and generates test scenarios
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-green-500">3</span>
            </div>
            <h4 className="text-sm font-semibold text-white">Generate Tests</h4>
            <p className="text-xs text-gray-400">
              Auto-generate test input JSONs for each scenario or create custom ones
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-blue-500">4</span>
            </div>
            <h4 className="text-sm font-semibold text-white">Execute & Validate</h4>
            <p className="text-xs text-gray-400">
              Run tests on Conductor and view detailed execution results
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-[#1a1f2e] border-[#2a3142]">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="search"
              placeholder="Search workflows to validate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-[#0f1419] text-white border-[#2a3142] focus-visible:ring-cyan-500 placeholder:text-gray-500"
            />
          </div>
          <Button
            variant="outline"
            className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142] hover:text-white"
          >
            <FilterIcon className="w-5 h-5 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {filteredWorkflows.length === 0 ? (
        <Card className="p-16 bg-[#1a1f2e] border-[#2a3142] text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-purple-500/10 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircleIcon className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-2xl font-semibold text-white">No workflows found</h3>
            <p className="text-base text-gray-400">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Create workflows first to start validation'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => navigate('/workflows')}
                className="bg-cyan-500 text-white hover:bg-cyan-600 shadow-sm font-medium"
              >
                Go to Workflows
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="bg-[#1a1f2e] border-[#2a3142]">
          <Table>
            <TableHeader>
              <TableRow className="border-[#2a3142] hover:bg-[#0f1419]">
                <TableHead className="text-gray-400 font-semibold">Workflow Name</TableHead>
                <TableHead className="text-gray-400 font-semibold">Description</TableHead>
                <TableHead className="text-gray-400 font-semibold">Status</TableHead>
                <TableHead className="text-gray-400 font-semibold text-center">Tasks</TableHead>
                <TableHead className="text-gray-400 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkflows.map((workflow) => {
                let badgeClassName = '';
                if (workflow.status === 'active') {
                  badgeClassName =
                    'bg-green-500/20 text-green-400 border border-green-500/50 font-medium';
                } else if (workflow.status === 'paused') {
                  badgeClassName =
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 font-medium';
                } else {
                  badgeClassName =
                    'bg-gray-500/20 text-gray-400 border border-gray-500/50 font-medium';
                }
                return (
                  <TableRow
                    key={workflow.id}
                    className="border-[#2a3142] hover:bg-[#0f1419] transition-colors"
                  >
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircleIcon className="w-4 h-4 text-purple-500" />
                        </div>
                        {workflow.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400 max-w-md truncate">
                      {workflow.description}
                    </TableCell>
                    <TableCell>
                      <Badge className={badgeClassName}>{workflow.status.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 font-medium">
                        {workflow.nodes?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleValidateWorkflow(workflow.id)}
                          className="text-purple-400 border-[#2a3142] hover:bg-purple-500/10 hover:text-purple-300"
                        >
                          <FlaskConicalIcon className="w-4 h-4 mr-1" />
                          View Test Cases
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate('/executions')}
                          className="text-cyan-400 border-[#2a3142] hover:bg-cyan-500/10 hover:text-cyan-300"
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
