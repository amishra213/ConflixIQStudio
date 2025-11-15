import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore, Workflow } from '@/stores/workflowStore';
import { PlusIcon, PlayIcon, PauseIcon, Trash2Icon, EditIcon, NetworkIcon, CheckCircleIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ExecuteWorkflowModal } from '@/components/modals/ExecuteWorkflowModal';
import { ValidateWorkflowModal } from '@/components/modals/ValidateWorkflowModal';

export function Workflows() {
  const navigate = useNavigate();
  const { workflows, deleteWorkflow, executeWorkflow } = useWorkflowStore();
  const { toast } = useToast();
  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const handleCreateWorkflow = () => {
    navigate('/workflow-designer');
  };

  const handleDelete = (id: string, name: string) => {
    deleteWorkflow(id);
    toast({
      title: 'Workflow deleted',
      description: `${name} has been deleted successfully.`,
    });
  };

  const handleExecuteClick = (workflow: Workflow, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkflow(workflow);
    setExecuteModalOpen(true);
  };

  const handleValidateClick = (workflow: Workflow, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkflow(workflow);
    setValidateModalOpen(true);
  };

  const handleValidateWorkflow = (workflowId: string, input: any, llmContext?: string) => {
    const inputParam = encodeURIComponent(JSON.stringify(input));
    const contextParam = llmContext ? `&context=${encodeURIComponent(llmContext)}` : '';
    navigate(`/workflows/${workflowId}/validate?input=${inputParam}${contextParam}`);
    setValidateModalOpen(false);
  };

  const handleExecuteWorkflow = (workflowId: string, input: any) => {
    try {
      const execution = executeWorkflow(workflowId, input);
      
      toast({
        title: 'Workflow execution started',
        description: `Execution ID: ${execution.id}`,
      });

      // Navigate to executions page
      setTimeout(() => {
        navigate('/executions');
      }, 500);
    } catch (error) {
      toast({
        title: 'Execution failed',
        description: error instanceof Error ? error.message : 'Failed to execute workflow',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#0f1419]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Workflows</h1>
          <p className="text-base text-gray-400">Manage and orchestrate your workflows</p>
        </div>
        <Button
          onClick={handleCreateWorkflow}
          className="bg-cyan-500 text-white hover:bg-cyan-600 shadow-sm font-medium"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Workflow
        </Button>
      </div>

      {workflows.length === 0 ? (
        <Card className="p-16 bg-[#1a1f2e] border-[#2a3142] text-center shadow-sm">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-cyan-500 rounded-2xl mx-auto flex items-center justify-center">
              <PlusIcon className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-white">No workflows yet</h3>
            <p className="text-base text-gray-400">
              Get started by creating your first workflow to orchestrate tasks and services.
            </p>
            <Button
              onClick={handleCreateWorkflow}
              className="bg-cyan-500 text-white hover:bg-cyan-600 shadow-sm font-medium"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Workflow
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-[#1a1f2e] border-[#2a3142] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0f1419]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Version</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a3142]">
                {workflows.map((workflow) => (
                  <tr 
                    key={workflow.id} 
                    className="hover:bg-[#2a3142]/30 transition-colors duration-150 cursor-pointer"
                    onClick={() => navigate(`/workflows/${workflow.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-500/10 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-white">{workflow.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400 line-clamp-1">{workflow.description}</span>
                    </td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">
                        {new Date(workflow.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">v1</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/workflows/${workflow.id}`)}
                          className="text-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-400"
                          title="Edit Workflow"
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/workflows/${workflow.id}/diagram`)}
                          className="text-purple-500 hover:bg-purple-500/10 hover:text-purple-400"
                          title="View Diagram"
                        >
                          <NetworkIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleValidateClick(workflow, e)}
                          className="text-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
                          title="Validate Workflow"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleExecuteClick(workflow, e)}
                          className="text-green-500 hover:bg-green-500/10 hover:text-green-400"
                          title="Execute Workflow"
                        >
                          <PlayIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(workflow.id, workflow.name);
                          }}
                          className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                          title="Delete Workflow"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ExecuteWorkflowModal
        open={executeModalOpen}
        onOpenChange={setExecuteModalOpen}
        workflow={selectedWorkflow}
        onExecute={handleExecuteWorkflow}
      />

      <ValidateWorkflowModal
        open={validateModalOpen}
        onOpenChange={setValidateModalOpen}
        workflow={selectedWorkflow}
        onValidate={handleValidateWorkflow}
      />
    </div>
  );
}
