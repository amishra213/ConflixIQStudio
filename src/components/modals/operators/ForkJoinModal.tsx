import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusIcon, Trash2Icon } from 'lucide-react';

export interface ForkJoinConfig {
  taskRefId: string;
  name?: string;
  taskType: 'FORK_JOIN';
  numWorkers?: number;
  description?: string;
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
}

interface ForkTask {
  id: string;
  taskRefId: string;
  taskId: string;
  taskType: string;
}

export function ForkJoinModal({ open, onOpenChange, onSave }: ForkJoinModalProps) {
  const [config, setConfig] = useState<ForkJoinConfig>({
    taskRefId: 'fork-join-1',
    name: 'Fork Join',
    taskType: 'FORK_JOIN',
    numWorkers: 0,
    forkTasks: [],
  });

  const [forkTasks, setForkTasks] = useState<ForkTask[]>([]);
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        taskRefId: `fork-join-${timestamp}`,
        name: 'Fork Join',
        taskType: 'FORK_JOIN',
        numWorkers: 0,
        forkTasks: [],
      });
      setForkTasks([]);
      setJsonError('');
    }
  }, [open]);

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
  };

  const handleSave = () => {
    if (!config.taskRefId || config.taskRefId.trim() === '') {
      setJsonError('Task Reference ID is required');
      return;
    }

    if (forkTasks.length === 0) {
      setJsonError('At least one fork task is required');
      return;
    }

    const validTasks = forkTasks.filter(t => t.taskRefId && t.taskId && t.taskType);
    if (validTasks.length !== forkTasks.length) {
      setJsonError('All fork tasks must have taskRefId, taskId, and taskType');
      return;
    }

    const finalConfig: ForkJoinConfig = {
      ...config,
      forkTasks: validTasks.map(({ id, ...rest }) => ({ ...rest })),
    };

    onSave(finalConfig);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col p-0 max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-white">
            Create Fork Join Operator
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="bg-[#0f1419]">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="tasks">Fork Tasks</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
                <div className="space-y-3">
                  <div>
                    <Label className="text-white">Task Ref ID *</Label>
                    <Input
                      value={config.taskRefId}
                      onChange={(e) => setConfig({ ...config, taskRefId: e.target.value })}
                      placeholder="e.g., fork-join-1"
                      className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Name</Label>
                    <Input
                      value={config.name || ''}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      placeholder="e.g., Fork Join"
                      className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
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
                  </div>
                  <div>
                    <Label className="text-white">Description</Label>
                    <Textarea
                      value={config.description || ''}
                      onChange={(e) => setConfig({ ...config, description: e.target.value })}
                      placeholder="Describe this fork join operator"
                      className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] min-h-[80px]"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-3">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-white font-semibold">Fork Tasks</Label>
                <Button
                  onClick={handleAddTask}
                  size="sm"
                  className="bg-cyan-500 text-white hover:bg-cyan-600"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {forkTasks.map((task) => (
                  <Card key={task.id} className="p-4 bg-[#0f1419] border-[#2a3142]">
                    <div className="space-y-3">
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
                        className="text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2Icon className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-3">
              <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
                <pre className="text-xs text-gray-300 font-mono overflow-x-auto max-h-[400px] overflow-y-auto">
                  {JSON.stringify({
                    ...config,
                    forkTasks: forkTasks.map(({ id, ...rest }) => ({ ...rest })),
                  }, null, 2)}
                </pre>
              </Card>
            </TabsContent>
          </Tabs>

          {jsonError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{jsonError}</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-[#2a3142] px-6 py-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!!jsonError}
            className="bg-cyan-500 text-white hover:bg-cyan-600"
          >
            Create Operator
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
