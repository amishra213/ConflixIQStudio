import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useWorkflowCacheStore } from '@/stores/workflowCacheStore';
import { useTaskStore } from '@/stores/taskStore';
import { ActivityIcon, CheckCircle2Icon, XCircleIcon, ClockIcon, TrendingUpIcon, TrashIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { fileStoreClient } from '@/utils/fileStore';

export function Dashboard() {
  const { workflows, executions, clearWorkflows } = useWorkflowStore();
  const { clearCache, getServerWorkflows, clearServerWorkflows, clearFileStore: clearWorkflowFileStore } = useWorkflowCacheStore();
  const { getTaskDefinitions, clearTaskDefinitions, clearFileStore: clearTaskFileStore } = useTaskStore();
  
  // State for tracking cached files
  const [workflowFileCount, setWorkflowFileCount] = useState(0);
  const [taskFileCount, setTaskFileCount] = useState(0);

  // Load file counts on component mount
  useEffect(() => {
    const loadFileCounts = async () => {
      try {
        // Load workflows to count them
        const workflows = await fileStoreClient.loadAllWorkflows();
        setWorkflowFileCount(workflows.length);
        
        // Load tasks to count them
        const cacheInfo = await fileStoreClient.getCacheInfo();
        if (cacheInfo) {
          // Approximate task file count based on cache info
          // For now, we'll show task definitions count as proxy
          setTaskFileCount(getTaskDefinitions().length);
        }
      } catch (err) {
        console.warn('Failed to load file counts:', err);
      }
    };
    
    loadFileCounts();
  }, [getTaskDefinitions]);

  // Get cached data
  const cachedWorkflows = getServerWorkflows();
  const cachedTasks = getTaskDefinitions();

  // Handler to clear all caches
  const handleClearAllCaches = async () => {
    try {
      // Clear workflow filestore (deletes workflow files and clears local cache + localStorage)
      await clearWorkflowFileStore();
      
      // Clear task filestore (deletes task cache files and clears local cache + localStorage)
      await clearTaskFileStore();
      
      // Clear in-memory caches (also clears their localStorage)
      clearCache();
      clearServerWorkflows();
      clearTaskDefinitions();
      clearWorkflows(); // Clear the workflow store data
      
      // Reset file counts
      setWorkflowFileCount(0);
      setTaskFileCount(0);
      
      console.log('[Dashboard] All caches cleared successfully (filestore + localStorage + memory)');
      
      // Reload page to ensure no stale data
      globalThis.location.reload();
    } catch (error) {
      console.error('[Dashboard] Error clearing caches:', error);
    }
  };

  const activeWorkflows = workflows.filter((w) => w.status === 'active').length;
  const completedExecutions = executions.filter((e) => e.status === 'completed').length;
  const failedExecutions = executions.filter((e) => e.status === 'failed').length;

  const avgDuration = executions
    .filter((e) => e.duration)
    .reduce((acc, e) => acc + (e.duration || 0), 0) / (executions.filter((e) => e.duration).length || 1);

  const chartData = [
    { name: 'Mon', executions: 12 },
    { name: 'Tue', executions: 19 },
    { name: 'Wed', executions: 15 },
    { name: 'Thu', executions: 22 },
    { name: 'Fri', executions: 18 },
    { name: 'Sat', executions: 8 },
    { name: 'Sun', executions: 5 },
  ];

  return (
    <div className="p-8 space-y-8 bg-[#0f1419]">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-base text-muted-foreground">Overview of your workflow orchestration</p>
      </div>

      {/* Main Metrics */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-[#1a1f2e] border-[#2a3142] shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">Active Workflows</p>
              <p className="text-3xl font-bold text-white">{activeWorkflows}</p>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <ActivityIcon className="w-6 h-6 text-cyan-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-[#1a1f2e] border-[#2a3142] shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">Completed</p>
              <p className="text-3xl font-bold text-white">{completedExecutions}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl">
              <CheckCircle2Icon className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-[#1a1f2e] border-[#2a3142] shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">Failed</p>
              <p className="text-3xl font-bold text-white">{failedExecutions}</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl">
              <XCircleIcon className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-[#1a1f2e] border-[#2a3142] shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">Avg Duration</p>
              <p className="text-3xl font-bold text-white">{Math.round(avgDuration)}s</p>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <ClockIcon className="w-6 h-6 text-cyan-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Cached Data Dashboard */}
      <div className="mt-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Cached Data</h2>
          <p className="text-sm text-gray-400">Monitor and manage cached workflows and task definitions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Cached Workflows in Memory Card */}
          <Card className="p-6 bg-[#1a1f2e] border-[#2a3142] shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-2">Cached Workflows</p>
                <p className="text-3xl font-bold text-white">{cachedWorkflows.length}</p>
                <p className="text-xs text-gray-500 mt-2">In memory cache</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <ActivityIcon className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </Card>

          {/* Workflow Files in FileStore Card */}
          <Card className="p-6 bg-[#1a1f2e] border-[#2a3142] shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-2">Workflow Files</p>
                <p className="text-3xl font-bold text-white">{workflowFileCount}</p>
                <p className="text-xs text-gray-500 mt-2">Persisted to disk</p>
              </div>
              <div className="p-3 bg-cyan-500/10 rounded-xl">
                <ActivityIcon className="w-6 h-6 text-cyan-500" />
              </div>
            </div>
          </Card>

          {/* Cached Tasks in Memory Card */}
          <Card className="p-6 bg-[#1a1f2e] border-[#2a3142] shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-2">Cached Tasks</p>
                <p className="text-3xl font-bold text-white">{cachedTasks.length}</p>
                <p className="text-xs text-gray-500 mt-2">In memory cache</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <ActivityIcon className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </Card>

          {/* Total Cache Status Card */}
          <Card className="p-6 bg-[#1a1f2e] border-[#2a3142] shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-2">Total Files</p>
                <p className="text-3xl font-bold text-white">{workflowFileCount + taskFileCount}</p>
                <p className="text-xs text-gray-500 mt-2">On disk cache</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <CheckCircle2Icon className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Cached Workflows Table */}
        {cachedWorkflows.length > 0 && (
          <Card className="p-6 bg-[#1a1f2e] border-[#2a3142] shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Cached Workflows</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a3142]">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Version</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Owner</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {cachedWorkflows.slice(0, 5).map((workflow) => (
                    <tr key={workflow.name} className="border-b border-[#2a3142] hover:bg-[#252d3d] transition-colors">
                      <td className="py-3 px-4 text-white">{workflow.name}</td>
                      <td className="py-3 px-4 text-gray-400">{workflow.version || '-'}</td>
                      <td className="py-3 px-4 text-gray-400">{workflow.ownerApp || '-'}</td>
                      <td className="py-3 px-4 text-gray-400">{workflow.createdBy || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cachedWorkflows.length > 5 && (
                <div className="text-center py-3 text-gray-400 text-xs">
                  +{cachedWorkflows.length - 5} more workflows
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Cached Tasks Table */}
        {cachedTasks.length > 0 && (
          <Card className="p-6 bg-[#1a1f2e] border-[#2a3142] shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Cached Task Definitions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a3142]">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Owner App</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Created By</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Retry Count</th>
                  </tr>
                </thead>
                <tbody>
                  {cachedTasks.slice(0, 5).map((task) => (
                    <tr key={task.name} className="border-b border-[#2a3142] hover:bg-[#252d3d] transition-colors">
                      <td className="py-3 px-4 text-white">{task.name}</td>
                      <td className="py-3 px-4 text-gray-400">{task.ownerApp || '-'}</td>
                      <td className="py-3 px-4 text-gray-400">{task.createdBy || '-'}</td>
                      <td className="py-3 px-4 text-gray-400">{task.retryCount ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cachedTasks.length > 5 && (
                <div className="text-center py-3 text-gray-400 text-xs">
                  +{cachedTasks.length - 5} more tasks
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Clear Cache Button */}
        <div className="flex justify-end mb-6">
          <button
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
            onClick={handleClearAllCaches}
          >
            <TrashIcon className="w-4 h-4" />
            Clear All Cache
          </button>
        </div>
      </div>

      {/* Execution Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 bg-[#1a1f2e] border-[#2a3142] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Execution Trends</h3>
            <TrendingUpIcon className="w-5 h-5 text-cyan-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Bar dataKey="executions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-[#1a1f2e] border-[#2a3142] shadow-sm">
          <h3 className="text-xl font-semibold text-white mb-6">Recent Executions</h3>
          <div className="space-y-4">
            {executions.slice(0, 5).map((execution) => {
              let badgeClassName = 'bg-primary text-primary-foreground font-medium';
              if (execution.status === 'completed') {
                badgeClassName = 'bg-success text-white font-medium';
              } else if (execution.status === 'failed') {
                badgeClassName = 'bg-destructive text-white font-medium';
              }

              return (
                <div key={execution.id} className="flex items-start gap-3">
                  <div className="mt-1">
                    {execution.status === 'completed' && <CheckCircle2Icon className="w-5 h-5 text-success" />}
                    {execution.status === 'failed' && <XCircleIcon className="w-5 h-5 text-destructive" />}
                    {execution.status === 'running' && (
                      <ActivityIcon className="w-5 h-5 text-primary animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{execution.workflowName}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(execution.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge className={badgeClassName}>
                    {execution.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
