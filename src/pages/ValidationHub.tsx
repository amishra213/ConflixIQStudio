import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useWorkflowStore } from '@/stores/workflowStore';
import { CheckCircleIcon, PlayIcon, SearchIcon, FilterIcon, ClockIcon } from 'lucide-react';

export function ValidationHub() {
  const navigate = useNavigate();
  const { workflows } = useWorkflowStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWorkflows = workflows.filter((workflow) =>
    workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleValidateWorkflow = (workflowId: string) => {
    navigate(`/workflows/${workflowId}/validate`);
  };

  return (
    <div className="p-8 space-y-8 bg-[#0f1419]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Workflow Validation Hub</h1>
          <p className="text-base text-gray-400">
            AI-powered test scenario generation and workflow validation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/50 px-4 py-2">
            🤖 LLM-Powered
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-[#1a1f2e] border-[#2a3142]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <CheckCircleIcon className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Recursive Analysis</h3>
              <p className="text-sm text-gray-400">
                LLM analyzes each workflow task individually, generating targeted test scenarios
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-[#1a1f2e] border-[#2a3142]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <PlayIcon className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Auto Test Generation</h3>
              <p className="text-sm text-gray-400">
                Automatically generates test inputs for happy path, edge cases, and error scenarios
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-[#1a1f2e] border-[#2a3142]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <ClockIcon className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Performance Optimized</h3>
              <p className="text-sm text-gray-400">
                Handles large workflows (1500+ lines) with caching and efficient task processing
              </p>
            </div>
          </div>
        </Card>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <Card
              key={workflow.id}
              className="p-6 bg-[#1a1f2e] border-[#2a3142] hover:border-cyan-500/50 transition-all duration-200 cursor-pointer group"
              onClick={() => handleValidateWorkflow(workflow.id)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircleIcon className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                        {workflow.name}
                      </h3>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-400 line-clamp-2 min-h-[40px]">
                  {workflow.description}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={
                      workflow.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50 font-medium'
                        : workflow.status === 'paused'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 font-medium'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/50 font-medium'
                    }
                  >
                    {workflow.status.toUpperCase()}
                  </Badge>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 font-medium">
                    {workflow.nodes?.length || 0} Tasks
                  </Badge>
                </div>

                <div className="pt-4 border-t border-[#2a3142]">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleValidateWorkflow(workflow.id);
                    }}
                    className="w-full bg-purple-500 text-white hover:bg-purple-600 font-medium"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Validate Workflow
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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
    </div>
  );
}
