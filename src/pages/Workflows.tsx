import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore, Workflow } from '@/stores/workflowStore';
import { PlusIcon, PlayIcon, Trash2Icon, EditIcon, NetworkIcon, CheckCircleIcon, DownloadIcon, ListIcon, XIcon, SearchIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ExecuteWorkflowModal } from '@/components/modals/ExecuteWorkflowModal';
import { useConductorApi } from '@/hooks/useConductorApi';
import { conductorWorkflowToLocal } from '@/lib/utils';

export function Workflows() {
  const navigate = useNavigate();
  const { workflows, deleteWorkflow, executeWorkflow, addWorkflow } = useWorkflowStore();
  const { toast } = useToast();
  const { syncWorkflows, loading: syncLoading, fetchWorkflowExecution } = useConductorApi();
  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [workflowListOpen, setWorkflowListOpen] = useState(false);
  const [serverWorkflows, setServerWorkflows] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [workflowIdModalOpen, setWorkflowIdModalOpen] = useState(false);
  const [workflowIdInput, setWorkflowIdInput] = useState('');
  const [isLoadingExecution, setIsLoadingExecution] = useState(false);

  const handleCreateWorkflow = () => {
    navigate('/workflow-designer');
  };

  const handleSyncFromFileStore = async () => {
    try {
      const conductorWorkflows = await syncWorkflows();
      
      if (conductorWorkflows.length === 0) {
        toast({
          title: 'No workflows found',
          description: 'No workflows were found on the Conductor server.',
          variant: 'default',
        });
        return;
      }

      let addedCount = 0;
      for (const conductorWorkflow of conductorWorkflows) {
        const localWorkflow = conductorWorkflowToLocal(conductorWorkflow);
        addWorkflow(localWorkflow);
        addedCount += 1;
      }

      toast({
        title: 'Workflows synced successfully',
        description: `${addedCount} workflow(s) have been imported from Conductor server.`,
      });
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to sync workflows from Conductor server',
        variant: 'destructive',
      });
    }
  };

  const handleGetWorkflowList = async () => {
    setListLoading(true);
    try {
      const conductorWorkflows = await syncWorkflows();
      
      if (conductorWorkflows.length === 0) {
        toast({
          title: 'No workflows found',
          description: 'No workflows were found on the Conductor server.',
          variant: 'default',
        });
        setListLoading(false);
        return;
      }

      setServerWorkflows(conductorWorkflows);
      setWorkflowListOpen(true);
    } catch (error) {
      toast({
        title: 'Failed to fetch workflow list',
        description: error instanceof Error ? error.message : 'Failed to fetch workflows from Conductor server',
        variant: 'destructive',
      });
    } finally {
      setListLoading(false);
    }
  };

  const handleLoadWorkflowById = async () => {
    if (!workflowIdInput.trim()) {
      toast({
        title: 'Invalid input',
        description: 'Please enter a workflow ID',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingExecution(true);
    try {
      const workflowExecution = await fetchWorkflowExecution(workflowIdInput.trim());
      
      if (!workflowExecution) {
        toast({
          title: 'Workflow not found',
          description: `No workflow found with ID: ${workflowIdInput}`,
          variant: 'destructive',
        });
        setIsLoadingExecution(false);
        return;
      }

      // Extract workflow definition from execution
      const workflowDef = workflowExecution.workflowDefinition || workflowExecution;
      const localWorkflow = conductorWorkflowToLocal(workflowDef);

      // Add to store and navigate to designer
      addWorkflow(localWorkflow);
      
      toast({
        title: 'Workflow loaded',
        description: `Workflow "${workflowDef.name}" has been loaded successfully.`,
      });

      // Navigate to workflow designer
      setTimeout(() => {
        navigate(`/workflow-designer`);
      }, 500);

      // Reset modal
      setWorkflowIdModalOpen(false);
      setWorkflowIdInput('');
    } catch (error) {
      toast({
        title: 'Failed to load workflow',
        description: error instanceof Error ? error.message : 'Failed to load workflow execution',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingExecution(false);
    }
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
    navigate('/validation-hub');
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
        <div className="flex gap-3">
          <Button
            onClick={() => setWorkflowIdModalOpen(true)}
            className="bg-orange-500 text-white hover:bg-orange-600 shadow-sm font-medium"
          >
            <SearchIcon className="w-5 h-5 mr-2" />
            Load by ID
          </Button>
          <Button
            onClick={handleGetWorkflowList}
            className="bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm font-medium"
            disabled={listLoading}
          >
            <ListIcon className="w-5 h-5 mr-2" />
            {listLoading ? 'Loading...' : 'Get Workflow List'}
          </Button>
          <Button
            onClick={handleSyncFromFileStore}
            className="bg-purple-500 text-white hover:bg-purple-600 shadow-sm font-medium"
            disabled={syncLoading}
          >
            <DownloadIcon className="w-5 h-5 mr-2" />
            {syncLoading ? 'Syncing...' : 'Sync from File Store'}
          </Button>
          <Button
            onClick={handleCreateWorkflow}
            className="bg-cyan-500 text-white hover:bg-cyan-600 shadow-sm font-medium"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Workflow
          </Button>
        </div>
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

      {workflowListOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl bg-[#1a1f2e] border-[#2a3142] max-h-[90vh] overflow-hidden shadow-lg">
            <div className="flex items-center justify-between p-6 border-b border-[#2a3142]">
              <h2 className="text-2xl font-bold text-white">Conductor Server Workflows</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setWorkflowListOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-[#2a3142]"
              >
                <XIcon className="w-5 h-5" />
              </Button>
            </div>

            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              {serverWorkflows.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No workflows found on the Conductor server</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {serverWorkflows.map((workflow: any) => (
                    <Card key={`${workflow.name}-${workflow.version}`} className="p-4 bg-[#0f1419] border-[#2a3142] hover:border-[#3a4152] transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">{workflow.name}</h3>
                            <p className="text-sm text-gray-400 line-clamp-2">{workflow.description || 'No description'}</p>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/50 font-medium ml-4">
                            v{workflow.version}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm mt-3 pt-3 border-t border-[#2a3142]">
                          <div>
                            <span className="text-gray-500">Owner App:</span>
                            <p className="text-gray-400">{workflow.ownerApp || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <p className="text-gray-400">
                              {workflow.createTime ? new Date(workflow.createTime).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Tasks Count:</span>
                            <p className="text-gray-400">{workflow.tasks?.length || 0}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3 pt-3 border-t border-[#2a3142]">
                          <Button
                            size="sm"
                            className="bg-cyan-500 text-white hover:bg-cyan-600 flex-1"
                            onClick={() => {
                              const localWorkflow = conductorWorkflowToLocal(workflow);
                              addWorkflow(localWorkflow);
                              toast({
                                title: 'Workflow imported',
                                description: `${workflow.name} has been imported successfully.`,
                              });
                            }}
                          >
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Import
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-400 hover:bg-[#2a3142] flex-1"
                            onClick={() => {
                              const jsonStr = JSON.stringify(workflow, null, 2);
                              const blob = new Blob([jsonStr], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${workflow.name}-v${workflow.version}.json`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Export JSON
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {workflowIdModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-[#1a1f2e] border-[#2a3142] shadow-lg">
            <div className="flex items-center justify-between p-6 border-b border-[#2a3142]">
              <h2 className="text-2xl font-bold text-white">Load Workflow by ID</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setWorkflowIdModalOpen(false);
                  setWorkflowIdInput('');
                }}
                className="text-gray-400 hover:text-white hover:bg-[#2a3142]"
              >
                <XIcon className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="workflowIdInput" className="block text-sm font-medium text-gray-300">
                  Workflow Execution ID
                </label>
                <input
                  id="workflowIdInput"
                  type="text"
                  value={workflowIdInput}
                  onChange={(e) => setWorkflowIdInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleLoadWorkflowById();
                    }
                  }}
                  placeholder="Enter workflow execution ID"
                  className="w-full px-4 py-2 bg-[#0f1419] border border-[#2a3142] rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                <p className="text-xs text-gray-500">
                  Enter the workflow execution ID to load the workflow from Conductor server
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[#2a3142]">
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-400 hover:bg-[#2a3142]"
                  onClick={() => {
                    setWorkflowIdModalOpen(false);
                    setWorkflowIdInput('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-orange-500 text-white hover:bg-orange-600"
                  disabled={isLoadingExecution || !workflowIdInput.trim()}
                  onClick={handleLoadWorkflowById}
                >
                  {isLoadingExecution ? 'Loading...' : 'Load Workflow'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
