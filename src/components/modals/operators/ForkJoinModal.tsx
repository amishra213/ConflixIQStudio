import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlusIcon, Trash2Icon } from 'lucide-react';

export interface ForkJoinConfig extends BaseTaskConfig {
  taskRefId: string;
  taskType: 'FORK_JOIN';
  numWorkers?: number;
  forkTasks: Array<{
    taskRefId: string;
    taskId: string;
    taskType: string;
  }>;
  joinOn?: string[];
}

interface ForkJoinModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: ForkJoinConfig) => void;
  readonly initialConfig?: ForkJoinConfig;
}

interface ForkTask {
  id: string;
  taskRefId: string;
  taskId: string;
  taskType: string;
}

export function ForkJoinModal({ open, onOpenChange, onSave, initialConfig }: ForkJoinModalProps) {
  const [config, setConfig] = useState<ForkJoinConfig>({
    taskRefId: 'fork-join-1',
    name: 'Fork Join',
    taskType: 'FORK_JOIN',
    numWorkers: 0,
    forkTasks: [],
  });

  const [forkTasks, setForkTasks] = useState<ForkTask[]>([]);

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        // Load existing configuration including ALL properties and forkTasks
        setConfig({ ...initialConfig });
        // Convert existing forkTasks to the format with IDs for editing
        const loadedTasks = (initialConfig.forkTasks || []).map((task, index) => ({
          id: `existing-${index}-${Date.now()}`,
          taskRefId: task.taskRefId || '',
          taskId: task.taskId || '',
          taskType: task.taskType || 'SIMPLE',
        }));
        setForkTasks(loadedTasks);
      } else {
        const timestamp = Date.now();
        setConfig({
          taskRefId: `fork-join-${timestamp}`,
          name: 'Fork Join',
          taskType: 'FORK_JOIN',
          numWorkers: 0,
          forkTasks: [],
        });
        setForkTasks([]);
      }
    }
  }, [open, initialConfig]);

  const handleAddTask = () => {
    setForkTasks([
      ...forkTasks,
      { id: `${Date.now()}`, taskRefId: '', taskId: '', taskType: 'SIMPLE' }
    ]);
  };

  const handleRemoveTask = (id: string) => {
    setForkTasks(forkTasks.filter(t => t.id !== id));
  };

  const handleTaskChange = (id: string, field: string, value: string) => {
    setForkTasks(forkTasks.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ));
    // Update config with the new forkTasks
    const validTasks = forkTasks.filter(t => t.taskRefId && t.taskId && t.taskType);
    if (validTasks.length > 0) {
      setConfig(prev => ({
        ...prev,
        forkTasks: validTasks.map(({ id: _, ...rest }) => ({ ...rest }))
      }));
    }
  };

  const handleSaveModal = (finalConfig: ForkJoinConfig) => {
    const validTasks = forkTasks.filter(t => t.taskRefId && t.taskId && t.taskType);
    onSave({
      ...finalConfig,
      forkTasks: validTasks.map(({ id, ...rest }) => ({ ...rest })),
    });
    onOpenChange(false);
  };

  const customBasicFields = (
    <div className="space-y-3">
      <div>
        <Label className="text-white">Number of Workers</Label>
        <Input
          type="number"
          value={config.numWorkers || 0}
          onChange={(e) => setConfig({ ...config, numWorkers: Number.parseInt(e.target.value) || 0 })}
          placeholder="0"
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
          min="0"
        />
        <p className="text-xs text-gray-400 mt-1">Number of workers for parallel execution</p>
      </div>
      
      <div className="border-t border-[#2a3142] pt-3">
        <div className="flex justify-between items-center mb-3">
          <Label className="text-white font-semibold">Fork Tasks</Label>
          <Button
            onClick={handleAddTask}
            size="sm"
            className="bg-cyan-500 text-white hover:bg-cyan-600 text-xs"
          >
            <PlusIcon className="w-3 h-3 mr-2" />
            Add Task
          </Button>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {forkTasks.map((task) => (
            <Card key={task.id} className="p-3 bg-[#0f1419] border-[#2a3142]">
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-gray-400">Task Ref ID</Label>
                    <Input
                      value={task.taskRefId}
                      onChange={(e) => handleTaskChange(task.id, 'taskRefId', e.target.value)}
                      placeholder="e.g., task-ref-1"
                      className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Task ID</Label>
                    <Input
                      value={task.taskId}
                      onChange={(e) => handleTaskChange(task.id, 'taskId', e.target.value)}
                      placeholder="e.g., task-1"
                      className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Task Type</Label>
                    <Input
                      value={task.taskType}
                      onChange={(e) => handleTaskChange(task.id, 'taskType', e.target.value)}
                      placeholder="e.g., SIMPLE"
                      className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] text-sm"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => handleRemoveTask(task.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-red-500/10 w-full"
                >
                  <Trash2Icon className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSaveModal}
      initialConfig={config}
      title="Fork Join Operator"
      description="Execute multiple tasks in parallel and wait for all to complete"
      buttonLabel="Save Operator"
      customBasicFields={customBasicFields}
    />
  );
}
