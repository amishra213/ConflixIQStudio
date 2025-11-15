import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { XIcon, PlusIcon, CheckIcon } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';

interface ConvergeTaskConfig {
  taskRefId: string;
  taskId: string;
  taskListDomain: string;
  taskType: string;
  sequenceNo: number;
  taskinputParameters: Record<string, any>;
  caseValues: null;
  forkTasks: null;
  convergeTasks: string[];
  actions: null;
  output: null;
  loopCondition: null;
  loopOver: null;
  loopIterationDelay: null;
}

interface ConvergeTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: ConvergeTaskConfig) => void;
  initialConfig?: ConvergeTaskConfig | null;
}

export function ConvergeTaskModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: ConvergeTaskModalProps) {
  const { tasks } = useWorkflowStore();
  const [config, setConfig] = useState<ConvergeTaskConfig>({
    taskRefId: '',
    taskId: '',
    taskListDomain: '',
    taskType: 'CONVERGE',
    sequenceNo: 1,
    taskinputParameters: {},
    caseValues: null,
    forkTasks: null,
    convergeTasks: [],
    actions: null,
    output: null,
    loopCondition: null,
    loopOver: null,
    loopIterationDelay: null,
  });

  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [availableTasks, setAvailableTasks] = useState<string[]>([]);

  useEffect(() => {
    if (open && initialConfig) {
      setConfig(initialConfig);
      setSelectedTasks(initialConfig.convergeTasks || []);
    } else if (open) {
      setConfig({
        taskRefId: '',
        taskId: '',
        taskListDomain: '',
        taskType: 'CONVERGE',
        sequenceNo: 1,
        taskinputParameters: {},
        caseValues: null,
        forkTasks: null,
        convergeTasks: [],
        actions: null,
        output: null,
        loopCondition: null,
        loopOver: null,
        loopIterationDelay: null,
      });
      setSelectedTasks([]);
    }
  }, [initialConfig, open]);

  useEffect(() => {
    const taskIds = tasks.map((task) => task.id);
    setAvailableTasks(taskIds);
  }, [tasks]);

  const handleAddTask = (taskId: string) => {
    if (!selectedTasks.includes(taskId)) {
      const newSelectedTasks = [...selectedTasks, taskId];
      setSelectedTasks(newSelectedTasks);
      setConfig({
        ...config,
        convergeTasks: newSelectedTasks,
      });
    }
  };

  const handleRemoveTask = (taskId: string) => {
    const newSelectedTasks = selectedTasks.filter((id) => id !== taskId);
    setSelectedTasks(newSelectedTasks);
    setConfig({
      ...config,
      convergeTasks: newSelectedTasks,
    });
  };

  const handleSave = () => {
    if (!config.taskRefId || !config.taskId || !config.taskListDomain) {
      alert('Please fill in all required fields');
      return;
    }

    if (selectedTasks.length === 0) {
      alert('Please select at least one task to converge');
      return;
    }

    onSave({
      ...config,
      convergeTasks: selectedTasks,
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-white">
            Configure Converge Task
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6 py-4">
            {/* Basic Configuration */}
            <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
              <h3 className="text-lg font-semibold text-white mb-4">Basic Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taskRefId" className="text-white font-medium">
                    Task Reference ID *
                  </Label>
                  <Input
                    id="taskRefId"
                    value={config.taskRefId}
                    onChange={(e) => setConfig({ ...config, taskRefId: e.target.value })}
                    placeholder="e.g., converge_on_allocation_api_response"
                    className="mt-2 h-10 bg-[#1a1f2e] text-white border-[#2a3142] focus-visible:ring-cyan-500"
                  />
                </div>

                <div>
                  <Label htmlFor="taskId" className="text-white font-medium">
                    Task ID *
                  </Label>
                  <Input
                    id="taskId"
                    value={config.taskId}
                    onChange={(e) => setConfig({ ...config, taskId: e.target.value })}
                    placeholder="e.g., converge_task"
                    className="mt-2 h-10 bg-[#1a1f2e] text-white border-[#2a3142] focus-visible:ring-cyan-500"
                  />
                </div>

                <div>
                  <Label htmlFor="taskListDomain" className="text-white font-medium">
                    Task List Domain *
                  </Label>
                  <Input
                    id="taskListDomain"
                    value={config.taskListDomain}
                    onChange={(e) => setConfig({ ...config, taskListDomain: e.target.value })}
                    placeholder="e.g., DECISIONING_TASKLIST"
                    className="mt-2 h-10 bg-[#1a1f2e] text-white border-[#2a3142] focus-visible:ring-cyan-500"
                  />
                </div>

                <div>
                  <Label htmlFor="sequenceNo" className="text-white font-medium">
                    Sequence Number
                  </Label>
                  <Input
                    id="sequenceNo"
                    type="number"
                    value={config.sequenceNo}
                    onChange={(e) =>
                      setConfig({ ...config, sequenceNo: parseInt(e.target.value) || 1 })
                    }
                    className="mt-2 h-10 bg-[#1a1f2e] text-white border-[#2a3142] focus-visible:ring-cyan-500"
                  />
                </div>
              </div>
            </Card>

            {/* Converge Tasks Selection */}
            <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
              <h3 className="text-lg font-semibold text-white mb-4">
                Converge Tasks *
                <span className="text-sm font-normal text-gray-400 ml-2">
                  (Select tasks that will converge at this point)
                </span>
              </h3>

              {/* Selected Tasks */}
              {selectedTasks.length > 0 && (
                <div className="mb-6">
                  <Label className="text-white font-medium mb-3 block">Selected Tasks</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTasks.map((taskId) => (
                      <Badge
                        key={taskId}
                        className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 px-3 py-2 text-sm font-medium flex items-center gap-2"
                      >
                        {taskId}
                        <button
                          onClick={() => handleRemoveTask(taskId)}
                          className="hover:bg-cyan-500/30 rounded-full p-0.5"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Tasks */}
              <div>
                <Label className="text-white font-medium mb-3 block">Available Tasks</Label>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {availableTasks.length > 0 ? (
                    availableTasks.map((taskId) => {
                      const isSelected = selectedTasks.includes(taskId);
                      return (
                        <Card
                          key={taskId}
                          className={`p-4 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'bg-cyan-500/10 border-cyan-500'
                              : 'bg-[#1a1f2e] border-[#2a3142] hover:border-cyan-500/50'
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              handleRemoveTask(taskId);
                            } else {
                              handleAddTask(taskId);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white truncate">
                              {taskId}
                            </span>
                            {isSelected && (
                              <CheckIcon className="w-4 h-4 text-cyan-500 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center py-8 text-gray-400">
                      <p>No tasks available</p>
                      <p className="text-sm mt-2">Create tasks first to add them to converge</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Task ID Input */}
              <div className="mt-6">
                <Label className="text-white font-medium mb-2 block">
                  Or Add Task ID Manually
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="manualTaskId"
                    placeholder="Enter task ID"
                    className="flex-1 h-10 bg-[#1a1f2e] text-white border-[#2a3142] focus-visible:ring-cyan-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        const taskId = input.value.trim();
                        if (taskId) {
                          handleAddTask(taskId);
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('manualTaskId') as HTMLInputElement;
                      const taskId = input.value.trim();
                      if (taskId) {
                        handleAddTask(taskId);
                        input.value = '';
                      }
                    }}
                    className="bg-cyan-500 text-white hover:bg-cyan-600"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* JSON Preview */}
            <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
              <h3 className="text-lg font-semibold text-white mb-4">JSON Preview</h3>
              <pre className="text-xs text-gray-300 font-mono bg-[#1a1f2e] p-4 rounded-lg border border-[#2a3142] overflow-x-auto max-h-64">
                {JSON.stringify(
                  {
                    ...config,
                    convergeTasks: selectedTasks,
                  },
                  null,
                  2
                )}
              </pre>
            </Card>
          </div>
        </div>

        <DialogFooter className="border-t border-[#2a3142] px-6 py-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-cyan-500 text-white hover:bg-cyan-600 font-medium"
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
