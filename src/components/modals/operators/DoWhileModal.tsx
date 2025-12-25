import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Edit2 } from 'lucide-react';

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
  HumanSystemTaskModal,
} from '../system-tasks';
import { SimpleTaskModal } from '../SimpleTaskModal';
import { StartWorkflowModal } from './StartWorkflowModal';
import { SubWorkflowModal } from './SubWorkflowModal';
import { SetVariableModal } from './SetVariableModal';
import { ForkJoinModal } from './ForkJoinModal';
import { DynamicForkModal } from './DynamicForkModal';
import { SwitchModal } from './SwitchModal';
import { JoinModal } from './JoinModal';
import { DynamicModal } from './DynamicModal';

export interface DoWhileConfig extends BaseTaskConfig {
  taskRefId: string;
  name?: string;
  taskType: 'DO_WHILE';
  loopCondition?: string;
  loopOver?: BaseTaskConfig[];
  description?: string;
}

interface DoWhileModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: DoWhileConfig) => void;
  readonly initialConfig?: DoWhileConfig | null;
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
  taskIndex: number;
  initialConfig: BaseTaskConfig | null | undefined;
}

export function DoWhileModal({ open, onOpenChange, onSave, initialConfig }: DoWhileModalProps) {
  const [config, setConfig] = useState<DoWhileConfig>({
    taskRefId: 'do-while-1',
    name: 'Do While',
    taskType: 'DO_WHILE',
    loopOver: [],
  });

  const [taskModalState, setTaskModalState] = useState<TaskModalState>({
    isOpen: false,
    taskType: null,
    taskIndex: -1,
    initialConfig: null,
  });

  const [loopTaskSelectValue, setLoopTaskSelectValue] = useState<string>('');

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        // Load existing configuration preserving ALL properties including loopOver tasks
        setConfig({ ...initialConfig });
      } else {
        const timestamp = Date.now();
        setConfig({
          taskRefId: `do-while-${timestamp}`,
          name: 'Do While',
          taskType: 'DO_WHILE',
          loopOver: [],
        });
      }
      setTaskModalState({
        isOpen: false,
        taskType: null,
        taskIndex: -1,
        initialConfig: null,
      });
      setLoopTaskSelectValue('');
    }
  }, [open, initialConfig]);

  const handleOpenTaskModal = (
    taskType: string,
    taskIndex: number = -1,
    initialTaskConfig: BaseTaskConfig | null | undefined = undefined
  ) => {
    setTaskModalState({
      isOpen: true,
      taskType,
      taskIndex,
      initialConfig: initialTaskConfig || undefined,
    });
  };

  const handleCloseTaskModal = () => {
    setTaskModalState({
      isOpen: false,
      taskType: null,
      taskIndex: -1,
      initialConfig: null,
    });
  };

  const handleSaveTaskConfig = async (taskConfig: BaseTaskConfig) => {
    const { taskIndex } = taskModalState;

    if (taskIndex === -1) {
      // Adding new task
      setConfig({
        ...config,
        loopOver: [...(config.loopOver || []), taskConfig],
      });
    } else {
      // Editing existing task
      const updatedTasks = [...(config.loopOver || [])];
      updatedTasks[taskIndex] = taskConfig;
      setConfig({
        ...config,
        loopOver: updatedTasks,
      });
    }

    handleCloseTaskModal();
  };

  const handleRemoveTask = (taskIndex: number) => {
    const updatedTasks = (config.loopOver || []).filter((_, i) => i !== taskIndex);
    setConfig({
      ...config,
      loopOver: updatedTasks,
    });
  };

  const renderTaskCard = (task: BaseTaskConfig, index: number) => {
    return (
      <Card key={index} className="p-4 bg-background border-border mb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-cyan-400">
                {task.type || task.taskType}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-sm text-foreground">{task.name || task.taskReferenceName}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ref:{' '}
              {
                (task.taskReferenceName ??
                  (task as Record<string, unknown>).taskRefId ??
                  'N/A') as string
              }
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                handleOpenTaskModal(task.type || task.taskType || 'SIMPLE', index, task)
              }
              className="text-cyan-400 hover:text-cyan-300"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveTask(index)}
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const renderTaskModal = () => {
    if (!taskModalState.isOpen || !taskModalState.taskType) return null;

    const commonProps = {
      open: taskModalState.isOpen,
      onOpenChange: (open: boolean) => {
        if (!open) handleCloseTaskModal();
      },
      onSave: handleSaveTaskConfig,
      initialConfig: taskModalState.initialConfig,
    };

    switch (taskModalState.taskType) {
      case 'SIMPLE':
        return (
          <SimpleTaskModal
            {...(commonProps as unknown as React.ComponentProps<typeof SimpleTaskModal>)}
          />
        );
      case 'HTTP':
        return (
          <HttpTaskModal
            {...(commonProps as unknown as React.ComponentProps<typeof HttpTaskModal>)}
          />
        );
      case 'KAFKA_PUBLISH':
        return (
          <KafkaPublishTaskModal
            {...(commonProps as unknown as React.ComponentProps<typeof KafkaPublishTaskModal>)}
          />
        );
      case 'JSON_JQ_TRANSFORM':
        return (
          <JsonJqTransformTaskModal
            {...(commonProps as unknown as React.ComponentProps<typeof JsonJqTransformTaskModal>)}
          />
        );
      case 'NOOP':
        return (
          <NoopSystemTaskModal
            {...(commonProps as unknown as React.ComponentProps<typeof NoopSystemTaskModal>)}
          />
        );
      case 'EVENT':
        return (
          <EventSystemTaskModal
            {...(commonProps as unknown as React.ComponentProps<typeof EventSystemTaskModal>)}
          />
        );
      case 'WAIT':
        return (
          <WaitSystemTaskModal
            {...(commonProps as unknown as React.ComponentProps<typeof WaitSystemTaskModal>)}
          />
        );
      case 'TERMINATE':
        return (
          <TerminateSystemTaskModal
            {...(commonProps as unknown as React.ComponentProps<typeof TerminateSystemTaskModal>)}
          />
        );
      case 'INLINE':
        return (
          <InlineSystemTaskModal
            {...(commonProps as unknown as React.ComponentProps<typeof InlineSystemTaskModal>)}
          />
        );
      case 'HUMAN':
        return (
          <HumanSystemTaskModal
            {...(commonProps as unknown as React.ComponentProps<typeof HumanSystemTaskModal>)}
          />
        );
      case 'SET_VARIABLE':
        return (
          <SetVariableModal
            {...(commonProps as unknown as React.ComponentProps<typeof SetVariableModal>)}
          />
        );
      case 'SUB_WORKFLOW':
        return (
          <SubWorkflowModal
            {...(commonProps as unknown as React.ComponentProps<typeof SubWorkflowModal>)}
          />
        );
      case 'START_WORKFLOW':
        return (
          <StartWorkflowModal
            {...(commonProps as unknown as React.ComponentProps<typeof StartWorkflowModal>)}
          />
        );
      case 'FORK_JOIN':
        return (
          <ForkJoinModal
            {...(commonProps as unknown as React.ComponentProps<typeof ForkJoinModal>)}
          />
        );
      case 'FORK_JOIN_DYNAMIC':
        return (
          <DynamicForkModal
            {...(commonProps as unknown as React.ComponentProps<typeof DynamicForkModal>)}
          />
        );
      case 'SWITCH':
        return (
          <SwitchModal {...(commonProps as unknown as React.ComponentProps<typeof SwitchModal>)} />
        );
      case 'DO_WHILE':
        return (
          <DoWhileModal
            {...(commonProps as unknown as React.ComponentProps<typeof DoWhileModal>)}
          />
        );
      case 'DYNAMIC':
        return (
          <DynamicModal
            {...(commonProps as unknown as React.ComponentProps<typeof DynamicModal>)}
          />
        );
      case 'JOIN':
        return (
          <JoinModal {...(commonProps as unknown as React.ComponentProps<typeof JoinModal>)} />
        );
      default:
        return null;
    }
  };

  const customBasicFields = (
    <div>
      <Label className="text-foreground">Loop Condition</Label>
      <Input
        value={config.loopCondition || ''}
        onChange={(e) => setConfig({ ...config, loopCondition: e.target.value })}
        placeholder="e.g., ${task.loopback}"
        className="mt-1 bg-card text-foreground border-border"
      />
      <p className="text-xs text-muted-foreground mt-1">Condition to evaluate for continuing the loop</p>
    </div>
  );

  const customTabsContent = (
    <div className="space-y-4">
      <Card className="p-6 bg-background border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Loop Tasks ({(config.loopOver || []).length} tasks)
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure the tasks to be executed in each loop iteration
        </p>

        <div className="space-y-3 mb-4">
          {(config.loopOver || []).map((task, idx) => renderTaskCard(task, idx))}
        </div>

        <div>
          <Label className="text-gray-300 text-sm">Add Task</Label>
          <Select
            value={loopTaskSelectValue}
            onValueChange={(taskType) => {
              handleOpenTaskModal(taskType, -1, null);
              setLoopTaskSelectValue('');
            }}
          >
            <SelectTrigger className="mt-2 bg-card text-foreground border-border">
              <SelectValue placeholder="Select task type..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {AVAILABLE_TASK_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  );

  return (
    <>
      <BaseTaskModal
        open={open}
        onOpenChange={onOpenChange}
        onSave={onSave}
        initialConfig={config}
        title="Do While Operator"
        description="Configure a loop that executes tasks while a condition is true"
        buttonLabel="Save Operator"
        customBasicFields={customBasicFields}
        customTabs={[
          {
            id: 'loop-tasks',
            label: 'Loop Tasks',
            content: customTabsContent,
          },
        ]}
      />
      {renderTaskModal()}
    </>
  );
}

