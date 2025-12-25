import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useWorkflowStore } from '@/stores/workflowStore';
import {
  PlusIcon,
  Trash2Icon,
  RefreshCw,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useConductorApi } from '@/hooks/useConductorApi';
import { useTaskStore } from '@/stores/taskStore';
import { SimpleTaskCreateModal } from '@/components/modals/SimpleTaskDefinitionModal';
import type { TaskDefinition } from '@/types/taskDefinition';
import type { SimpleTaskDefinitionConfig } from '@/components/modals/SimpleTaskDefinitionModal';

const ITEMS_PER_PAGE = 10;

function convertRetryLogic(
  retryLogic?: 'FIXED' | 'EXPONENTIAL_BACKOFF' | 'LINEAR_BACKOFF'
): 'FIXED' | 'LINEAR' | 'EXPONENTIAL' {
  if (retryLogic === 'EXPONENTIAL_BACKOFF') {
    return 'EXPONENTIAL';
  }
  if (retryLogic === 'LINEAR_BACKOFF') {
    return 'LINEAR';
  }
  return 'FIXED';
}

export function Tasks() {
  const { tasks, addTask, deleteTask } = useWorkflowStore();
  const {
    markAsPublished,
    markAllAsPublished,
    syncToFileStore,
    loadFromFileStore,
    setTaskDefinitions,
    getTaskDefinitions,
  } = useTaskStore();
  const { toast } = useToast();
  const {
    fetchAllTaskDefinitions,
    createTaskDefinition,
    updateTaskDefinition,
    deleteTaskDefinition,
  } = useConductorApi({ enableFallback: false });

  // Simple Task Definition Modal state
  const [isSimpleTaskModalOpen, setIsSimpleTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDefinition | null>(null);

  // All Task Definitions state
  const [allTasks, setAllTasks] = useState<TaskDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [timeoutPolicyFilter, setTimeoutPolicyFilter] = useState<string>('all');
  const [retryLogicFilter, setRetryLogicFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Load cache from filestore on component mount
  useEffect(() => {
    loadFromFileStore();
  }, [loadFromFileStore]);

  // Load cached task definitions on component mount
  useEffect(() => {
    const cachedDefs = getTaskDefinitions();
    if (cachedDefs && cachedDefs.length > 0) {
      console.log('Restoring task definitions from cache:', cachedDefs);
      setAllTasks(cachedDefs as TaskDefinition[]);
    }
  }, [getTaskDefinitions]);

  // Load all task definitions
  const loadAllTasks = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllTaskDefinitions();
      console.log('Fetched task definitions:', data);

      // Handle both array and object with data property
      let tasksArray: TaskDefinition[] = [];
      if (Array.isArray(data)) {
        tasksArray = data;
      } else if (
        typeof data === 'object' &&
        data !== null &&
        'taskDefs' in data &&
        Array.isArray((data as { taskDefs?: unknown }).taskDefs)
      ) {
        tasksArray = (data as { taskDefs: TaskDefinition[] }).taskDefs;
      } else if (
        typeof data === 'object' &&
        data !== null &&
        'data' in data &&
        Array.isArray((data as { data?: unknown }).data)
      ) {
        tasksArray = (data as { data: TaskDefinition[] }).data;
      }

      if (!tasksArray || tasksArray.length === 0) {
        // No mock data - show empty state
        setAllTasks([]);
        setTaskDefinitions([]);
      } else {
        setAllTasks(tasksArray);
        // Cache the full task definitions (cast to compatible type)
        const definitionsToCache = tasksArray.map((t) => ({
          ...t,
          createTime: typeof t.createTime === 'number' ? t.createTime.toString() : t.createTime,
          updateTime: typeof t.updateTime === 'number' ? t.updateTime.toString() : t.updateTime,
        }));
        setTaskDefinitions(definitionsToCache);
        // Mark API tasks as published
        markAllAsPublished(tasksArray.map((t: TaskDefinition) => t.name));
      }

      // Sync cache to filestore after successful load
      await syncToFileStore();
      toast({ title: 'Success', description: 'Task list loaded and cache synced to filestore.' });
    } catch (err) {
      console.error('Error loading tasks:', err);
      setAllTasks([]); // Clear on error
      toast({ title: 'Error', description: 'Failed to load task list.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSimpleTask = async (config: SimpleTaskDefinitionConfig) => {
    try {
      const isEditing = !!editingTask;

      // Call the appropriate function based on edit/create mode
      const success = isEditing
        ? await updateTaskDefinition(config).catch((err: Error) => {
            console.error('Update task error:', err);
            throw err;
          })
        : await createTaskDefinition(config).catch((err: Error) => {
            console.error('Create task error:', err);
            throw err;
          });

      if (success) {
        const taskName = config.name;

        if (isEditing) {
          // Update existing task - reload from server
          console.log('Task updated successfully, reloading task list');
          toast({
            title: 'Success',
            description: `Task definition "${taskName}" updated successfully.`,
          });
          // Mark as published
          markAsPublished(taskName);
          // Reload the full task list to get updated data
          try {
            await loadAllTasks();
          } catch (loadError) {
            console.error('Failed to reload task list after update:', loadError);
            // Still consider it a success even if reload fails
          }
        } else {
          // Create new task
          addTask({
            id: `task-${Date.now()}`,
            name: taskName,
            type: 'SIMPLE',
            description: config.description || 'Simple task definition',
          });
          // Mark as published
          markAsPublished(taskName);
          toast({
            title: 'Success',
            description: `Task definition "${taskName}" created and published successfully.`,
          });
        }

        setEditingTask(null);
      }
    } catch (error) {
      console.error('Error saving task definition:', error);
      const isEditing = !!editingTask;
      const actionType = isEditing ? 'update' : 'create';
      const errorMessage =
        error instanceof Error ? error.message : `Failed to ${actionType} task definition.`;
      console.error(`${actionType} failed - Error message:`, errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleEditTask = (task: TaskDefinition) => {
    setEditingTask(task);
    setIsSimpleTaskModalOpen(true);
  };

  const handleDelete = async (id: string, name: string, isPublished: boolean = false) => {
    try {
      if (isPublished) {
        // Delete from server first
        const success = await deleteTaskDefinition(name);
        if (success) {
          // Remove from local state
          deleteTask(id);
          // Remove from cache
          const cachedDefs = getTaskDefinitions();
          const updatedDefs = cachedDefs.filter((t) => t.name !== name);
          setTaskDefinitions(updatedDefs);
          // Update allTasks state
          setAllTasks((prev) => prev.filter((t) => t.name !== name));
          // Sync to filestore
          await syncToFileStore();
          toast({ title: 'Success', description: `Task "${name}" deleted from server and cache.` });
        } else {
          toast({ title: 'Error', description: `Failed to delete task "${name}" from server.` });
        }
      } else {
        // Unpublished task - remove from cache only
        deleteTask(id);
        toast({ title: 'Task deleted', description: `${name} removed from cache.` });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to delete task "${name}".`,
        variant: 'destructive',
      });
    }
  };

  // Filter and search logic (using only API tasks which have filtering fields)
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      // Search filter
      if (
        searchQuery &&
        !task.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Timeout policy filter
      if (timeoutPolicyFilter !== 'all' && task.timeoutPolicy !== timeoutPolicyFilter) {
        return false;
      }

      // Retry logic filter
      if (retryLogicFilter !== 'all' && task.retryLogic !== retryLogicFilter) {
        return false;
      }

      return true;
    });
  }, [allTasks, searchQuery, timeoutPolicyFilter, retryLogicFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // Get unique values for filters
  const uniqueTimeoutPolicies = [
    ...new Set(
      allTasks.map((t) => t.timeoutPolicy).filter(Boolean) as ('RETRY' | 'ALERT' | 'SKIP')[]
    ),
  ].sort((a, b) => a.localeCompare(b));
  const uniqueRetryLogics = [
    ...new Set(
      allTasks.map((t) => t.retryLogic).filter(Boolean) as (
        | 'FIXED'
        | 'EXPONENTIAL_BACKOFF'
        | 'LINEAR_BACKOFF'
      )[]
    ),
  ].sort((a, b) => a.localeCompare(b));

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, timeoutPolicyFilter, retryLogicFilter]);

  return (
    <div className="p-8 space-y-8 bg-background">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Tasks</h1>
        <p className="text-base text-muted-foreground">Manage reusable task definitions</p>
      </div>

      <div className="space-y-6">
        {/* Header with buttons */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Task Definitions</h2>
          <div className="flex gap-3">
            <Button
              onClick={loadAllTasks}
              variant="outline"
              disabled={isLoading}
              className="border-[#2a3142] text-cyan-400 hover:bg-cyan-500/10"
              title="Load tasks from Conductor and sync to filestore"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Get Task List'}
            </Button>
            <Button
              onClick={syncToFileStore}
              variant="outline"
              className="border-[#2a3142] text-purple-400 hover:bg-purple-500/10"
              title="Manually sync current cache to filestore"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync to FileStore
            </Button>
            <Button
              onClick={() => setIsSimpleTaskModalOpen(true)}
              className="bg-cyan-500 text-white hover:bg-cyan-600 shadow-sm font-medium"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Task
            </Button>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            {/* Search Input */}
            <div className="flex-1">
              <label
                htmlFor="search-tasks"
                className="text-sm font-medium text-foreground block mb-2"
              >
                Search by name or description
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search-tasks"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground placeholder-muted-foreground"
                />
              </div>
            </div>

            {/* Timeout Policy Filter */}
            <div className="min-w-40">
              <label
                htmlFor="timeout-policy-filter"
                className="text-sm font-medium text-foreground block mb-2"
              >
                Timeout Policy
              </label>
              <select
                id="timeout-policy-filter"
                value={timeoutPolicyFilter}
                onChange={(e) => setTimeoutPolicyFilter(e.target.value)}
                className="w-full bg-background border border-border rounded text-foreground p-2 text-sm"
              >
                <option value="all">All Policies</option>
                {uniqueTimeoutPolicies.map((policy) => (
                  <option key={policy} value={policy}>
                    {policy}
                  </option>
                ))}
              </select>
            </div>

            {/* Retry Logic Filter */}
            <div className="min-w-40">
              <label
                htmlFor="retry-logic-filter"
                className="text-sm font-medium text-foreground block mb-2"
              >
                Retry Logic
              </label>
              <select
                id="retry-logic-filter"
                value={retryLogicFilter}
                onChange={(e) => setRetryLogicFilter(e.target.value)}
                className="w-full bg-background border border-border rounded text-foreground p-2 text-sm"
              >
                <option value="all">All Logics</option>
                {uniqueRetryLogics.map((logic) => (
                  <option key={logic} value={logic}>
                    {logic}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <Button
              onClick={() => {
                setSearchQuery('');
                setTimeoutPolicyFilter('all');
                setRetryLogicFilter('all');
              }}
              variant="outline"
              className="border-border text-muted-foreground hover:bg-secondary"
            >
              Clear Filters
            </Button>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Showing {paginatedTasks.length} of {filteredTasks.length} tasks
            {filteredTasks.length < allTasks.length &&
              ` (${allTasks.length - filteredTasks.length} filtered)`}
          </div>
        </div>

        {/* Unified Task List Table */}
        {tasks.length === 0 && allTasks.length === 0 ? (
          <Card className="p-16 bg-card border-border text-center shadow-sm">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-cyan-500 rounded-2xl mx-auto flex items-center justify-center">
                <PlusIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground">No tasks yet</h3>
              <p className="text-base text-muted-foreground">
                Create a task definition or click &quot;Get Task List&quot; to load task definitions
                from your Conductor instance.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="bg-card border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Execution Namespace
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                      Timeout (s)
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                      Timeout Policy
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                      Retry Logic
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* Paginated Filtered Tasks */}
                  {paginatedTasks.map((task) => (
                    <tr
                      key={task.name}
                      className="hover:bg-secondary/30 transition-colors duration-150 cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-cyan-500/10 rounded flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-4 h-4 text-cyan-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-white">{task.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {task.description || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">
                          {task.executionNameSpace || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-muted-foreground">{task.timeoutSeconds ?? '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {task.timeoutPolicy ? (
                          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/50 text-xs font-medium">
                            {task.timeoutPolicy}
                          </Badge>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {task.retryLogic ? (
                          <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/50 text-xs font-medium">
                            {task.retryLogic}
                          </Badge>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center" title="Published">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTask(task)}
                            className="text-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
                            title="Edit Task"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(`api-${task.name}`, task.name, true)}
                            className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                            title="Delete Task"
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

            {/* Pagination Controls */}
            {filteredTasks.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between p-4 border-t border-border bg-background">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="border-border text-muted-foreground hover:bg-secondary disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="border-border text-muted-foreground hover:bg-secondary disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      <SimpleTaskCreateModal
        open={isSimpleTaskModalOpen}
        onOpenChange={(open) => {
          setIsSimpleTaskModalOpen(open);
          if (!open) {
            setEditingTask(null);
          }
        }}
        onSave={handleSaveSimpleTask}
        initialConfig={
          editingTask
            ? ({
                name: editingTask.name,
                description: editingTask.description,
                retryCount: editingTask.retryCount,
                retryLogic: convertRetryLogic(editingTask.retryLogic),
                retryDelaySeconds: editingTask.retryDelaySeconds,
                timeoutSeconds: editingTask.timeoutSeconds,
                timeoutPolicy: editingTask.timeoutPolicy,
                responseTimeoutSeconds: editingTask.responseTimeoutSeconds,
              } as SimpleTaskDefinitionConfig)
            : undefined
        }
      />
    </div>
  );
}
