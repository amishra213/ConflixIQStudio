import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';

// Import all task modals
import {
  HttpTaskModal,
  KafkaPublishTaskModal,
  JsonJqTransformTaskModal,
  InlineSystemTaskModal,
  EventSystemTaskModal,
  WaitSystemTaskModal,
  NoopSystemTaskModal,
  TerminateSystemTaskModal,
} from '../system-tasks';
import { SimpleTaskModal } from '../SimpleTaskModal';
import { SwitchModal } from './SwitchModal';
import { DynamicForkModal } from './DynamicForkModal';
import { DoWhileModal } from './DoWhileModal';
import { JoinModal } from './JoinModal';
import { DynamicModal } from './DynamicModal';

export interface ForkJoinConfig extends BaseTaskConfig {
  type: 'FORK_JOIN';
  inputParameters?: Record<string, unknown>;
  forkTasks: Array<Array<Record<string, unknown>>>;
}

interface ForkJoinModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: ForkJoinConfig) => void;
  readonly initialConfig?: ForkJoinConfig;
}

const AVAILABLE_TASK_TYPES = [
  'SIMPLE',
  'HTTP',
  'KAFKA_PUBLISH',
  'JSON_JQ_TRANSFORM',
  'NOOP',
  'EVENT',
  'WAIT',
  'INLINE',
  'HUMAN',
  'SET_VARIABLE',
  'SUB_WORKFLOW',
  'START_WORKFLOW',
  'TERMINATE',
  'FORK_JOIN',
  'FORK_JOIN_DYNAMIC',
  'SWITCH',
  'DO_WHILE',
  'DYNAMIC',
  'JOIN',
];

interface TaskModalState {
  isOpen: boolean;
  taskType: string | null;
  branchIndex: number;
  taskIndex: number;
  initialConfig: unknown;
}

export function ForkJoinModal({ open, onOpenChange, onSave, initialConfig }: ForkJoinModalProps) {
  const [config, setConfig] = useState<ForkJoinConfig>({
    name: 'Fork Join',
    taskReferenceName: 'fork_join_ref',
    type: 'FORK_JOIN',
    inputParameters: {},
    forkTasks: [],
  });

  const [expandedBranches, setExpandedBranches] = useState<Set<number>>(new Set());
  const [taskModalState, setTaskModalState] = useState<TaskModalState>({
    isOpen: false,
    taskType: null,
    branchIndex: -1,
    taskIndex: -1,
    initialConfig: null,
  });
  const [branchTaskSelectValue, setBranchTaskSelectValue] = useState<Record<number, string>>({});

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        // Normalize forkTasks to ensure it's an array of arrays
        const normalizedForkTasks = Array.isArray(initialConfig.forkTasks)
          ? initialConfig.forkTasks.map((branch) => (Array.isArray(branch) ? branch : []))
          : [];

        const normalizedConfig: ForkJoinConfig = {
          ...initialConfig,
          forkTasks: normalizedForkTasks,
        };

        setConfig(normalizedConfig);
        const branchIndices = new Set<number>();
        for (let i = 0; i < normalizedForkTasks.length; i++) {
          branchIndices.add(i);
        }
        setExpandedBranches(branchIndices);
        console.log('ForkJoinModal loaded with config:', normalizedConfig);
      } else {
        const timestamp = Date.now();
        setConfig({
          name: 'Fork Join',
          taskReferenceName: `fork_join_${timestamp}`,
          type: 'FORK_JOIN',
          inputParameters: {},
          forkTasks: [],
        });
        setExpandedBranches(new Set());
        console.log('ForkJoinModal created with new config');
      }
      setTaskModalState({
        isOpen: false,
        taskType: null,
        branchIndex: -1,
        taskIndex: -1,
        initialConfig: null,
      });
      setBranchTaskSelectValue({});
    }
  }, [open, initialConfig]);

  const handleAddBranch = () => {
    setConfig({
      ...config,
      forkTasks: [...config.forkTasks, []],
    });
  };

  const handleRemoveBranch = (branchIndex: number) => {
    const newBranches = config.forkTasks.filter((_, idx) => idx !== branchIndex);
    setConfig({
      ...config,
      forkTasks: newBranches,
    });
    const newExpanded = new Set(expandedBranches);
    newExpanded.delete(branchIndex);
    setExpandedBranches(newExpanded);
  };

  const handleAddTaskToBranch = (branchIndex: number, taskType: string) => {
    if (!taskType) return;

    const newBranches = [...config.forkTasks];
    const newTask: Record<string, unknown> = {
      type: taskType,
      name: taskType.toLowerCase(),
      taskReferenceName: `${taskType.toLowerCase()}_${Date.now()}`,
    };
    newBranches[branchIndex] = [...(newBranches[branchIndex] || []), newTask];

    setConfig({
      ...config,
      forkTasks: newBranches,
    });

    const newSelectValues = { ...branchTaskSelectValue };
    delete newSelectValues[branchIndex];
    setBranchTaskSelectValue(newSelectValues);
  };

  const handleRemoveTaskFromBranch = (branchIndex: number, taskIndex: number) => {
    const newBranches = [...config.forkTasks];
    newBranches[branchIndex] = newBranches[branchIndex].filter((_, idx) => idx !== taskIndex);
    setConfig({
      ...config,
      forkTasks: newBranches,
    });
  };

  const handleOpenTaskModal = (
    taskType: string,
    branchIndex: number,
    taskIndex: number = -1,
    initialTaskConfig: unknown = null
  ) => {
    setTaskModalState({
      isOpen: true,
      taskType,
      branchIndex,
      taskIndex,
      initialConfig: initialTaskConfig,
    });
  };

  const handleCloseTaskModal = () => {
    setTaskModalState({
      isOpen: false,
      taskType: null,
      branchIndex: -1,
      taskIndex: -1,
      initialConfig: null,
    });
  };

  const handleSaveTaskConfig = (taskConfig: unknown) => {
    const { taskType, branchIndex, taskIndex } = taskModalState;
    if (taskType === null || branchIndex === -1) return;

    const newBranches = [...config.forkTasks];

    if (taskIndex === -1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newBranches[branchIndex] = [...newBranches[branchIndex], taskConfig as any];
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newBranches[branchIndex][taskIndex] = taskConfig as any;
    }

    setConfig({
      ...config,
      forkTasks: newBranches,
    });

    handleCloseTaskModal();
  };

  const handleSaveModal = (finalConfig: ForkJoinConfig) => {
    const timestamp = Date.now();
    const cleanConfig: ForkJoinConfig = {
      name: finalConfig.name || `Fork Join_${timestamp}`,
      taskReferenceName: finalConfig.taskReferenceName || `fork_join_ref_${timestamp}`,
      type: 'FORK_JOIN',
      description: finalConfig.description,
      inputParameters: finalConfig.inputParameters || {},
      forkTasks: config.forkTasks,
    };

    onSave(cleanConfig);
    onOpenChange(false);
  };

  const renderTaskCard = (
    task: Record<string, unknown>,
    branchIndex: number,
    taskIndex: number
  ) => {
    return (
      <Card key={taskIndex} className="p-3 bg-card border-border">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <p className="text-xs text-cyan-400 font-semibold">{String(task.type) || 'Unknown'}</p>
            <p className="text-sm text-foreground">
              {(task.name as string) || (task.taskReferenceName as string) || 'Unnamed'}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              onClick={() =>
                handleOpenTaskModal((task.type as string) || 'SIMPLE', branchIndex, taskIndex, task)
              }
              size="sm"
              variant="outline"
              className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/10 h-7 w-7 p-0"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => handleRemoveTaskFromBranch(branchIndex, taskIndex)}
              size="sm"
              variant="destructive"
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 h-7 w-7 p-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const renderTaskModal = () => {
    if (!taskModalState.isOpen || !taskModalState.taskType) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commonProps: any = {
      open: taskModalState.isOpen,
      onOpenChange: (isOpen: boolean) => {
        if (!isOpen) handleCloseTaskModal();
      },
      onSave: handleSaveTaskConfig,
      initialConfig: taskModalState.initialConfig,
    };

    switch (taskModalState.taskType) {
      case 'SIMPLE':
        return <SimpleTaskModal {...commonProps} />;
      case 'HTTP':
        return <HttpTaskModal {...commonProps} />;
      case 'KAFKA_PUBLISH':
        return <KafkaPublishTaskModal {...commonProps} />;
      case 'JSON_JQ_TRANSFORM':
        return <JsonJqTransformTaskModal {...commonProps} />;
      case 'NOOP':
        return <NoopSystemTaskModal {...commonProps} />;
      case 'EVENT':
        return <EventSystemTaskModal {...commonProps} />;
      case 'WAIT':
        return <WaitSystemTaskModal {...commonProps} />;
      case 'TERMINATE':
        return <TerminateSystemTaskModal {...commonProps} />;
      case 'INLINE':
        return <InlineSystemTaskModal {...commonProps} />;
      case 'FORK_JOIN':
        return <ForkJoinModal {...commonProps} />;
      case 'FORK_JOIN_DYNAMIC':
        return <DynamicForkModal {...commonProps} />;
      case 'SWITCH':
        return <SwitchModal {...commonProps} />;
      case 'DO_WHILE':
        return <DoWhileModal {...commonProps} />;
      case 'DYNAMIC':
        return <DynamicModal {...commonProps} />;
      case 'JOIN':
        return <JoinModal {...commonProps} />;
      default:
        return null;
    }
  };

  const customBasicFields = (
    <div className="space-y-3">
      <div className="border-t border-border pt-3">
        <div className="flex justify-between items-center mb-3">
          <Label className="text-foreground font-semibold">Fork Branches</Label>
          <Button
            onClick={handleAddBranch}
            size="sm"
            className="bg-cyan-500 text-foreground hover:bg-cyan-600 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Branch
          </Button>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {config.forkTasks.map((branch, branchIndex) => {
            // Ensure branch is an array
            const branchArray = Array.isArray(branch) ? branch : [];
            // Use timestamp + index as unique identifier for branch
            const branchKey = `branch-${config.forkTasks.length}-${branchIndex}`;
            return (
              <Card key={branchKey} className="bg-background border-border">
                <button
                  type="button"
                  className="w-full text-left p-3 cursor-pointer hover:bg-card flex justify-between items-center"
                  onClick={() => {
                    const newExpanded = new Set(expandedBranches);
                    if (newExpanded.has(branchIndex)) {
                      newExpanded.delete(branchIndex);
                    } else {
                      newExpanded.add(branchIndex);
                    }
                    setExpandedBranches(newExpanded);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {expandedBranches.has(branchIndex) ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Label className="text-foreground font-semibold cursor-pointer">
                      Branch {branchIndex + 1} ({branchArray.length} tasks)
                    </Label>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBranch(branchIndex);
                    }}
                    size="sm"
                    variant="destructive"
                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30 h-8"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </button>

                {expandedBranches.has(branchIndex) && (
                  <div className="border-t border-border p-3 space-y-2">
                    {branchArray.map((task, taskIndex) =>
                      renderTaskCard(task, branchIndex, taskIndex)
                    )}

                    <div className="pt-2">
                      <Select
                        value={branchTaskSelectValue[branchIndex] || ''}
                        onValueChange={(taskType) => {
                          handleAddTaskToBranch(branchIndex, taskType);
                          setBranchTaskSelectValue({
                            ...branchTaskSelectValue,
                            [branchIndex]: '',
                          });
                        }}
                      >
                        <SelectTrigger className="bg-background border-border text-muted-foreground">
                          <SelectValue placeholder="Add task to this branch" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {AVAILABLE_TASK_TYPES.map((taskType) => (
                            <SelectItem key={taskType} value={taskType} className="text-foreground">
                              {taskType}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <BaseTaskModal
        open={open}
        onOpenChange={onOpenChange}
        onSave={handleSaveModal}
        initialConfig={config}
        title="Fork Join Operator"
        description="Execute multiple task branches in parallel and wait for all to complete"
        buttonLabel="Save Operator"
        customBasicFields={customBasicFields}
      />

      {renderTaskModal()}
    </>
  );
}

