import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore, Workflow } from '@/stores/workflowStore';
import { useWorkflowCacheStore } from '@/stores/workflowCacheStore';
import { PlusIcon, PlayIcon, Trash2Icon, EditIcon, NetworkIcon, CheckCircleIcon, DownloadIcon, ListIcon, XIcon, SearchIcon, CloudUploadIcon, ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ExecuteWorkflowModal } from '@/components/modals/ExecuteWorkflowModal';
import { useConductorApi } from '@/hooks/useConductorApi';
import { conductorWorkflowToLocal, type ConductorWorkflow } from '@/lib/utils';
import { generateUniqueWorkflowName } from '@/utils/nameGenerator';

/**
 * Filter and deduplicate workflows to show only the most recent, non-empty workflows
 * Removes stale/duplicate entries and workflows without any tasks
 */
function filterAndDeduplicate(workflows: Workflow[]): Workflow[] {
  // Group by name to identify duplicates
  const workflowsByName = new Map<string, Workflow[]>();
  
  for (const workflow of workflows) {
    const key = workflow.name;
    if (!workflowsByName.has(key)) {
      workflowsByName.set(key, []);
    }
    workflowsByName.get(key)!.push(workflow);
  }

  // For each name, keep only the most recent one (by createdAt)
  const filtered: Workflow[] = [];
  for (const [, duplicates] of workflowsByName) {
    // Sort by timestamp (newer first) - spread to avoid mutating original
    const sorted = [...duplicates].sort((a: Workflow, b: Workflow) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
    
    // Keep the most recent workflow (even if it's a draft or has no nodes)
    const recent = sorted[0];
    if (recent) {
      filtered.push(recent);
    }
  }

  return filtered;
}

// Pagination settings interface
interface PaginationSettings {
  currentPage: number;
  itemsPerPage: number;
}

// Load pagination settings from localStorage
function loadPaginationSettings(): PaginationSettings {
  try {
    const saved = localStorage.getItem('workflowPaginationSettings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Failed to load pagination settings:', err);
  }
  return { currentPage: 1, itemsPerPage: 10 };
}

// Save pagination settings to localStorage
function savePaginationSettings(settings: PaginationSettings) {
  try {
    localStorage.setItem('workflowPaginationSettings', JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save pagination settings:', err);
  }
}

export function Workflows() {
  const navigate = useNavigate();
  const { workflows: allWorkflows, deleteWorkflow, executeWorkflow, addWorkflow, persistWorkflows } = useWorkflowStore();
  const { getAllWorkflows, markAsPublished, markAsSyncing, syncToFileStore, setServerWorkflows: setCachedServerWorkflows, getServerWorkflows } = useWorkflowCacheStore();
  const { toast } = useToast();
  const { syncWorkflows, loading: syncLoading, fetchWorkflowByVersion, saveWorkflow, deleteWorkflow: deleteWorkflowFromServer } = useConductorApi();
  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [workflowIdModalOpen, setWorkflowIdModalOpen] = useState(false);
  const [workflowNameInput, setWorkflowNameInput] = useState('');
  const [workflowVersionInput, setWorkflowVersionInput] = useState('1');
  const [isLoadingExecution, setIsLoadingExecution] = useState(false);
  const [publishingWorkflowId, setPublishingWorkflowId] = useState<string | null>(null);

  // Filter and pagination state
  const [nameFilter, setNameFilter] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'UNPUBLISHED' | 'PUBLISHED'>('all');
  const [paginationSettings, setPaginationSettings] = useState<PaginationSettings>(loadPaginationSettings());

  // Filter and deduplicate workflows for display
  const allDeduplicatedWorkflows = filterAndDeduplicate(allWorkflows);

  // Apply filters
  const filteredWorkflows = allDeduplicatedWorkflows.filter((workflow) => {
    // Name filter
    if (nameFilter && !workflow.name.toLowerCase().includes(nameFilter.toLowerCase())) {
      return false;
    }

    // Description filter
    if (descriptionFilter && !(workflow.description || '').toLowerCase().includes(descriptionFilter.toLowerCase())) {
      return false;
    }

    // Status filter - map workflow publicationStatus to display status
    if (statusFilter !== 'all') {
      const workflowStatus = workflow.publicationStatus === 'PUBLISHED' ? 'PUBLISHED' : 'UNPUBLISHED';
      if (workflowStatus !== statusFilter) {
        return false;
      }
    }

    return true;
  });

  // Pagination
  const itemsPerPage = paginationSettings.itemsPerPage;
  const totalPages = Math.ceil(filteredWorkflows.length / itemsPerPage);
  const currentPage = Math.min(paginationSettings.currentPage, totalPages || 1);

  const paginatedWorkflows = filteredWorkflows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Update pagination state and save to localStorage
  const updatePagination = (page: number, items: number) => {
    const newSettings = { currentPage: page, itemsPerPage: items };
    setPaginationSettings(newSettings);
    savePaginationSettings(newSettings);
  };

  // Reset pagination when filters change
  useEffect(() => {
    updatePagination(1, paginationSettings.itemsPerPage);
  }, [nameFilter, descriptionFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load cached server workflows on component mount
  useEffect(() => {
    const cachedWorkflows = getServerWorkflows();
    if (cachedWorkflows && cachedWorkflows.length > 0) {
      console.log('Restoring server workflows from cache:', cachedWorkflows);
    }
  }, [getServerWorkflows]);

  const handleCreateWorkflow = () => {
    // Create a new workflow immediately with an ID and unique name
    const uniqueName = generateUniqueWorkflowName();
    
    const newWorkflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: uniqueName,
      description: 'A new workflow definition',
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      status: 'draft', // Business status
      syncStatus: 'local-only', // Conductor sync status
      publicationStatus: 'LOCAL', // Internal publication status
    };
    
    // Add to store
    addWorkflow(newWorkflow);
    
    // Persist immediately
    persistWorkflows().catch(err => {
      console.warn('Failed to persist new workflow:', err);
    });
    
    // Save as last active workflow
    sessionStorage.setItem('lastActiveWorkflow', newWorkflow.id);
    
    // Navigate to the designer with the ID
    navigate(`/workflows/${newWorkflow.id}`);
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
        const localWorkflow = conductorWorkflowToLocal(conductorWorkflow as ConductorWorkflow);
        // addWorkflow will replace existing workflows with same name or add if new
        addWorkflow(localWorkflow);
        addedCount += 1;
      }

      // Persist after syncing workflows
      await persistWorkflows();

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

      // Clear old cache completely to ensure old incomplete data is overwritten
      // This ensures we use the freshly retrieved complete workflow data
      console.log('[Workflows] Clearing old cache before storing new complete workflows');
      
      // Cache the workflows for persistence across page navigation
      // This replaces any old incomplete workflows with new complete data
      setCachedServerWorkflows(conductorWorkflows as Parameters<typeof setCachedServerWorkflows>[0]);

      // Import all workflows directly into the page
      // addWorkflow will replace existing workflows with same name or add if new
      let importedCount = 0;
      for (const conductorWorkflow of conductorWorkflows) {
        const localWorkflow = conductorWorkflowToLocal(conductorWorkflow as ConductorWorkflow);
        addWorkflow(localWorkflow);
        importedCount += 1;
      }

      // Persist after importing workflows
      await persistWorkflows();

      toast({
        title: 'Workflows loaded successfully',
        description: `${importedCount} workflow(s) have been loaded from the Conductor server and added to this page.`,
      });
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
    if (!workflowNameInput.trim()) {
      toast({
        title: 'Invalid input',
        description: 'Please enter a workflow name',
        variant: 'destructive',
      });
      return;
    }

    if (!workflowVersionInput.trim()) {
      toast({
        title: 'Invalid input',
        description: 'Please enter a workflow version',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingExecution(true);
    try {
      const version = Number.parseInt(workflowVersionInput.trim(), 10);
      if (Number.isNaN(version)) {
        toast({
          title: 'Invalid version',
          description: 'Version must be a valid number',
          variant: 'destructive',
        });
        setIsLoadingExecution(false);
        return;
      }

      console.log(`Fetching workflow: ${workflowNameInput.trim()} version ${version}`);
      
      // Use the GraphQL proxy-aware hook
      const workflowDef = await fetchWorkflowByVersion(workflowNameInput.trim(), version);
      
      if (!workflowDef?.name) {
        console.error('Invalid workflow definition:', workflowDef);
        toast({
          title: 'Workflow not found',
          description: `No workflow found with name "${workflowNameInput}" and version ${version}`,
          variant: 'destructive',
        });
        setIsLoadingExecution(false);
        return;
      }

      console.log('Workflow definition loaded:', workflowDef);

      // Convert to local workflow format
      const localWorkflow = conductorWorkflowToLocal(workflowDef);
      console.log('Converted to local workflow:', localWorkflow);

      // Add to store
      addWorkflow(localWorkflow);
      
      // Persist to storage
      await persistWorkflows();
      
      toast({
        title: 'Workflow loaded',
        description: `Workflow "${workflowDef.name}" (v${workflowDef.version}) has been loaded successfully.`,
      });

      // Navigate to workflow designer
      setTimeout(() => {
        navigate(`/workflow-designer/${localWorkflow.id}`);
      }, 500);

      // Reset modal
      setWorkflowIdModalOpen(false);
      setWorkflowNameInput('');
      setWorkflowVersionInput('1');
    } catch (error) {
      console.error('Load workflow error:', error);
      toast({
        title: 'Failed to load workflow',
        description: error instanceof Error ? error.message : 'Failed to load workflow from Conductor server',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingExecution(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const workflow = allWorkflows.find(w => w.id === id);
    
    // If workflow is published, delete from Conductor server first
    if (workflow?.publicationStatus === 'PUBLISHED') {
      const deleted = await deleteWorkflowFromServer(name, workflow.version || 1);
      if (!deleted) {
        toast({
          title: 'Server deletion failed',
          description: `Failed to delete "${name}" from Conductor server. The workflow may still exist on the server.`,
          variant: 'destructive',
        });
        return;
      }
    }
    
    // Remove from cache
    deleteWorkflow(id);
    await persistWorkflows();
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

  const handleValidateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/validation');
  };

  const getStatusBadgeClass = (publicationStatus?: string): string => {
    if (publicationStatus === 'PUBLISHED') {
      return 'bg-green-500/20 text-green-400 border border-green-500/50 font-medium';
    }
    return 'bg-gray-500/20 text-gray-400 border border-gray-500/50 font-medium';
  };

  const getDisplayStatus = (publicationStatus?: string): string => {
    return publicationStatus === 'PUBLISHED' ? 'PUBLISHED' : 'UNPUBLISHED';
  };

  const handleExecuteWorkflow = (workflowId: string, input: unknown) => {
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

  const handlePublishWorkflow = async (workflowId: string) => {
    try {
      const workflow = allDeduplicatedWorkflows.find(w => w.id === workflowId);
      if (!workflow) {
        toast({
          title: 'Workflow not found',
          description: 'The workflow could not be found in local cache',
          variant: 'destructive',
        });
        return;
      }

      setPublishingWorkflowId(workflowId);
      markAsSyncing(workflowId);

      // Convert to Conductor format and publish
      const { localWorkflowToConductor } = await import('@/utils/workflowConverter');
      const conductorWorkflow = localWorkflowToConductor(workflow);

      // Attempt to publish to Conductor
      const success = await saveWorkflow(conductorWorkflow);

      if (success) {
        markAsPublished(workflowId);
        await syncToFileStore();
        toast({
          title: 'Workflow published',
          description: `Workflow "${workflow.name}" has been successfully published to Conductor`,
        });
      } else {
        // Revert to draft if publish fails
        const cacheStatus = getAllWorkflows().find(w => w.id === workflowId);
        if (cacheStatus?.isLocalOnly) {
          toast({
            title: 'Publish failed',
            description: 'Failed to publish workflow to Conductor. It remains cached locally.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Publish error',
        description: error instanceof Error ? error.message : 'Failed to publish workflow',
        variant: 'destructive',
      });
    } finally {
      setPublishingWorkflowId(null);
    }
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
            <h1 className="text-4xl font-bold text-white mb-2">Workflows</h1>
            <p className="text-base text-gray-400">Manage and orchestrate your workflows</p>
          </div>
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

      {allDeduplicatedWorkflows.length === 0 ? (
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
        <>
          {/* Filter Section */}
          <Card className="bg-[#1a1f2e] border-[#2a3142] shadow-sm">
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Name Filter */}
                <div>
                  <label htmlFor="nameFilterInput" className="block text-xs font-medium text-gray-400 mb-2">Workflow Name</label>
                  <input
                    id="nameFilterInput"
                    type="text"
                    placeholder="Search by name..."
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f1419] border border-[#2a3142] rounded text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                {/* Description Filter */}
                <div>
                  <label htmlFor="descriptionFilterInput" className="block text-xs font-medium text-gray-400 mb-2">Description</label>
                  <input
                    id="descriptionFilterInput"
                    type="text"
                    placeholder="Search by description..."
                    value={descriptionFilter}
                    onChange={(e) => setDescriptionFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f1419] border border-[#2a3142] rounded text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label htmlFor="statusFilterSelect" className="block text-xs font-medium text-gray-400 mb-2">Publication Status</label>
                  <select
                    id="statusFilterSelect"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'UNPUBLISHED' | 'PUBLISHED')}
                    className="w-full px-3 py-2 bg-[#0f1419] border border-[#2a3142] rounded text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="UNPUBLISHED">Unpublished</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
              </div>

              {/* Filter Summary */}
              <div className="flex items-center justify-between pt-2 border-t border-[#2a3142]">
                <p className="text-xs text-gray-400">
                  Showing {paginatedWorkflows.length} of {filteredWorkflows.length} workflows
                </p>
                {(nameFilter || descriptionFilter || statusFilter !== 'all') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-400 hover:bg-[#2a3142] text-xs"
                    onClick={() => {
                      setNameFilter('');
                      setDescriptionFilter('');
                      setStatusFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Workflows Table */}
          <Card className="bg-[#1a1f2e] border-[#2a3142] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0f1419]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Version</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a3142]">
                  {paginatedWorkflows.length > 0 ? (
                    paginatedWorkflows.map((workflow) => (
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
                          <div className="flex items-center gap-2">
                            <Badge
                              className={getStatusBadgeClass(workflow.publicationStatus)}
                            >
                              {getDisplayStatus(workflow.publicationStatus)}
                            </Badge>
                            {workflow.publicationStatus !== 'PUBLISHED' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePublishWorkflow(workflow.id);
                                }}
                                disabled={publishingWorkflowId === workflow.id}
                                className="text-orange-500 hover:bg-orange-500/10 hover:text-orange-400 disabled:opacity-50 px-2 py-1 h-auto"
                                title="Publish Workflow to Conductor"
                              >
                                <CloudUploadIcon className="w-3 h-3 mr-1" />
                                <span className="text-xs">Publish</span>
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-400">v{workflow.version || 1}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2" role="toolbar" aria-label="Workflow actions">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/workflows/${workflow.id}`);
                              }}
                              className="text-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-400"
                              title="Edit Workflow"
                            >
                              <EditIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/workflows/${workflow.id}/diagram?mode=preview`);
                              }}
                              className="text-purple-500 hover:bg-purple-500/10 hover:text-purple-400"
                              title="View Diagram"
                            >
                              <NetworkIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleValidateClick}
                              className="text-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
                              title="Validate Workflow"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExecuteClick(workflow, e);
                              }}
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <p className="text-gray-400">No workflows match the current filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="bg-[#1a1f2e] border-[#2a3142] shadow-sm">
              <div className="p-6 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages} ({filteredWorkflows.length} total)
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-400 hover:bg-[#2a3142] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => updatePagination(currentPage - 1, itemsPerPage)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        size="sm"
                        variant={currentPage === page ? 'default' : 'outline'}
                        className={currentPage === page
                          ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                          : 'border-gray-600 text-gray-400 hover:bg-[#2a3142]'
                        }
                        onClick={() => updatePagination(page, itemsPerPage)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-400 hover:bg-[#2a3142] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => updatePagination(currentPage + 1, itemsPerPage)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="itemsPerPageSelect" className="text-sm text-gray-400">Items per page:</label>
                  <select
                    id="itemsPerPageSelect"
                    value={itemsPerPage}
                    onChange={(e) => updatePagination(1, Number.parseInt(e.target.value, 10))}
                    className="px-2 py-1 bg-[#0f1419] border border-[#2a3142] rounded text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      <ExecuteWorkflowModal
        open={executeModalOpen}
        onOpenChange={setExecuteModalOpen}
        workflow={selectedWorkflow}
        onExecute={handleExecuteWorkflow}
      />

      {workflowIdModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-[#1a1f2e] border-[#2a3142] shadow-lg">
            <div className="flex items-center justify-between p-6 border-b border-[#2a3142]">
              <h2 className="text-2xl font-bold text-white">Load Workflow</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setWorkflowIdModalOpen(false);
                  setWorkflowNameInput('');
                  setWorkflowVersionInput('1');
                }}
                className="text-gray-400 hover:text-white hover:bg-[#2a3142]"
              >
                <XIcon className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="workflowNameInput" className="block text-sm font-medium text-gray-300">
                  Workflow Name
                </label>
                <input
                  id="workflowNameInput"
                  type="text"
                  value={workflowNameInput}
                  onChange={(e) => setWorkflowNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleLoadWorkflowById();
                    }
                  }}
                  placeholder="e.g., sample_http_workflow"
                  className="w-full px-4 py-2 bg-[#0f1419] border border-[#2a3142] rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="workflowVersionInput" className="block text-sm font-medium text-gray-300">
                  Version
                </label>
                <input
                  id="workflowVersionInput"
                  type="text"
                  value={workflowVersionInput}
                  onChange={(e) => setWorkflowVersionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleLoadWorkflowById();
                    }
                  }}
                  placeholder="1"
                  className="w-full px-4 py-2 bg-[#0f1419] border border-[#2a3142] rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                <p className="text-xs text-gray-500">
                  Load workflow definition from Conductor server (GET /api/metadata/workflow/{'<name>'}?version={'<version>'})
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[#2a3142]">
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-400 hover:bg-[#2a3142]"
                  onClick={() => {
                    setWorkflowIdModalOpen(false);
                    setWorkflowNameInput('');
                    setWorkflowVersionInput('1');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-orange-500 text-white hover:bg-orange-600"
                  disabled={isLoadingExecution || !workflowNameInput.trim() || !workflowVersionInput.trim()}
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
