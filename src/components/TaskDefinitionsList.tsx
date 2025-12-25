import { useState, useEffect, useCallback } from 'react';
import { useConductorApi } from '@/hooks/useConductorApi';
import { TaskDefinitionsTable } from '@/components/TaskDefinitionsTable';
import { Card } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TaskDefinition } from '@/types/taskDefinition';

export function TaskDefinitionsList() {
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { fetchAllTaskDefinitions } = useConductorApi({ enableFallback: false });

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllTaskDefinitions();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load task definitions'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchAllTaskDefinitions]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  if (error && tasks.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="p-6 bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-red-400 font-semibold mb-1">Failed to Load Task Definitions</h3>
              <p className="text-red-300 text-sm">{error.message}</p>
              <p className="text-red-300/70 text-xs mt-2">
                Make sure you have configured the Conductor API endpoint in Settings.
              </p>
            </div>
          </div>
        </Card>
        <div className="flex justify-center">
          <Button onClick={loadTasks} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">All Task Definitions</h2>
          <p className="text-sm text-gray-400 mt-1">
            Browse all registered task definitions from the Conductor server ({tasks.length} total)
          </p>
        </div>
        <Button onClick={loadTasks} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <TaskDefinitionsTable tasks={tasks} error={error} />
    </div>
  );
}
