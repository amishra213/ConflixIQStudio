import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore } from '@/stores/workflowStore';
import { PlusIcon, Trash2Icon, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useConductorApi } from '@/hooks/useConductorApi';
import { useTaskStore } from '@/stores/taskStore';
import { SimpleTaskCreateModal } from '@/components/modals/SimpleTaskDefinitionModal';
import type { TaskDefinition } from '@/types/taskDefinition';
import type { SimpleTaskDefinitionConfig } from '@/components/modals/SimpleTaskDefinitionModal';

export function Tasks() {
  const { tasks, addTask, deleteTask } = useWorkflowStore();
  const { markAsDraft, markAllAsPublished, syncToFileStore, loadFromFileStore } = useTaskStore();
  const { toast } = useToast();
  const { fetchAllTaskDefinitions, createTaskDefinition } = useConductorApi({ enableFallback: false });

  // Simple Task Definition Modal state
  const [isSimpleTaskModalOpen, setIsSimpleTaskModalOpen] = useState(false);

  // All Task Definitions state
  const [allTasks, setAllTasks] = useState<TaskDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load cache from filestore on component mount
  useEffect(() => {
    loadFromFileStore();
  }, [loadFromFileStore]);

  // Load all task definitions
  const loadAllTasks = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllTaskDefinitions();
      console.log('Fetched task definitions:', data);
      
      // Handle both array and object with data property
      const tasksArray = Array.isArray(data) ? data : ((data as any)?.taskDefs || (data as any)?.data || []);
      
      if (!tasksArray || tasksArray.length === 0) {
        // Use mock data if API returns empty
        const mockData: TaskDefinition[] = [
          {
            name: 'sample_task_1',
            description: 'Sample task for testing',
            retryCount: 3,
            timeoutSeconds: 300,
            timeoutPolicy: 'RETRY',
            retryLogic: 'FIXED',
            concurrentExecLimit: 5,
          },
          {
            name: 'sample_task_2',
            description: 'Another sample task',
            retryCount: 2,
            timeoutSeconds: 600,
            timeoutPolicy: 'ALERT',
            retryLogic: 'EXPONENTIAL_BACKOFF',
            concurrentExecLimit: 10,
          },
        ];
        setAllTasks(mockData);
        // Mark mock data as published
        markAllAsPublished(mockData.map(t => t.name));
      } else {
        setAllTasks(tasksArray);
        // Mark API tasks as published
        markAllAsPublished(tasksArray.map((t: any) => t.name));
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
      const success = await createTaskDefinition(config);
      if (success) {
        const taskName = config.name;
        addTask({
          id: `task-${Date.now()}`,
          name: taskName,
          type: 'SIMPLE',
          description: config.description || 'Simple task definition',
        });
        // Mark as draft since it's a newly created task definition
        markAsDraft(taskName);
        toast({ title: 'Success', description: `Task definition "${taskName}" created successfully.` });
      } else {
        toast({ title: 'Error', description: 'Failed to create task definition. Please check your Conductor API settings.' });
      }
    } catch (error) {
      console.error('Error saving task definition:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to create task definition.' });
    }
  };

  const handleDelete = (id: string, name: string) => {
    deleteTask(id);
    toast({ title: 'Task deleted', description: `${name} deleted successfully.` });
  };

  return (
    <div className="p-8 space-y-8 bg-[#0f1419]">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Tasks</h1>
        <p className="text-base text-gray-400">Manage reusable task definitions</p>
      </div>

      <div className="space-y-6">
        {/* Header with buttons */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Task Definitions</h2>
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

        {/* Unified Task List Table */}
        {tasks.length === 0 && allTasks.length === 0 ? (
          <Card className="p-16 bg-[#1a1f2e] border-[#2a3142] text-center shadow-sm">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-cyan-500 rounded-2xl mx-auto flex items-center justify-center">
                <PlusIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white">No tasks yet</h3>
              <p className="text-base text-gray-400">
                Create a task definition or click "Get Task List" to load task definitions from your Conductor instance.
              </p>
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Execution Namespace</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-white">Timeout (s)</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-white">Timeout Policy</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-white">Retry Logic</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a3142]">
                  {/* Local Worker Tasks */}
                  {tasks.map((task) => (
                    <tr 
                      key={task.id} 
                      className="hover:bg-[#2a3142]/30 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-cyan-500/10 rounded flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-white">{task.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400">{task.description || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400">-</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-400">-</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-gray-500 text-sm">-</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-gray-500 text-sm">-</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center" title="Draft">
                          <Clock className="w-5 h-5 text-yellow-400" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
                            title="Edit Task"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(task.id, task.name)}
                            className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                            title="Delete Task"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* API Task Definitions */}
                  {allTasks.map((task) => (
                    <tr 
                      key={task.name} 
                      className="hover:bg-[#2a3142]/30 transition-colors duration-150 cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-cyan-500/10 rounded flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-white">{task.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400 line-clamp-1">{task.description || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400">{(task as any)?.executionNameSpace || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-400">{task.timeoutSeconds ?? '-'}</span>
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
                            className="text-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
                            title="Edit Task"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
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
          </Card>
        )}
      </div>

      <SimpleTaskCreateModal
        open={isSimpleTaskModalOpen}
        onOpenChange={setIsSimpleTaskModalOpen}
        onSave={handleSaveSimpleTask}
      />
    </div>
  );
}
