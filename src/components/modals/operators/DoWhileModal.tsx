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
  GrpcTaskModal,
  JsonJqTransformTaskModal,
  JsonJqTransformStringTaskModal,
  InlineSystemTaskModal,
  EventSystemTaskModal,
  WaitSystemTaskModal,
  NoopSystemTaskModal,
  SetVariableSystemTaskModal,
  SubWorkflowSystemTaskModal,
  TerminateSystemTaskModal,
} from '../system-tasks';
import { SimpleTaskModal } from '../SimpleTaskModal';
import { ForkJoinModal } from './ForkJoinModal';
import { ForkJoinDynamicModal } from './ForkJoinDynamicModal';
import { SwitchModal } from './SwitchModal';
import { LambdaModal } from './LambdaModal';
import { JoinModal } from './JoinModal';
import { ExclusiveJoinModal } from './ExclusiveJoinModal';

export interface DoWhileConfig extends BaseTaskConfig {
  taskRefId: string;
  name?: string;
  taskType: 'DO_WHILE';
  loopCondition?: string;
  loopOver?: any[];
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
  'GRPC',
  'JSON_JQ_TRANSFORM',
  'JSON_JQ_TRANSFORM_STRING',
  'NOOP',
  'EVENT',
  'WAIT',
  'SET_VARIABLE',
  'SUB_WORKFLOW',
  'TERMINATE',
  'INLINE',
  'FORK_JOIN',
  'FORK_JOIN_DYNAMIC',
  'SWITCH',
  'DO_WHILE',
  'LAMBDA',
  'JOIN',
  'EXCLUSIVE_JOIN',
];

interface TaskModalState {
  isOpen: boolean;
  taskType: string | null;
  taskIndex: number;
  initialConfig: any;
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
        setConfig(initialConfig);
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
    initialTaskConfig: any = null
  ) => {
    setTaskModalState({
      isOpen: true,
      taskType,
      taskIndex,
      initialConfig: initialTaskConfig,
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

  const handleSaveTaskConfig = async (taskConfig: any) => {
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

  const renderTaskCard = (task: any, index: number) => {
    return (
      <Card key={index} className="p-4 bg-[#0f1419] border-[#2a3142] mb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-cyan-400">{task.type || task.taskType}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-sm text-white">{task.name || task.taskReferenceName}</span>
            </div>
            <p className="text-xs text-gray-400">
              Ref: {task.taskReferenceName || task.taskRefId || 'N/A'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                handleOpenTaskModal(
                  task.type || task.taskType,
                  index,
                  task
                )
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
        return <SimpleTaskModal {...commonProps} />;
      case 'HTTP':
        return <HttpTaskModal {...commonProps} />;
      case 'KAFKA_PUBLISH':
        return <KafkaPublishTaskModal {...commonProps} />;
      case 'GRPC':
        return <GrpcTaskModal {...commonProps} />;
      case 'JSON_JQ_TRANSFORM':
        return <JsonJqTransformTaskModal {...commonProps} />;
      case 'JSON_JQ_TRANSFORM_STRING':
        return <JsonJqTransformStringTaskModal {...commonProps} />;
      case 'NOOP':
        return <NoopSystemTaskModal {...commonProps} />;
      case 'EVENT':
        return <EventSystemTaskModal {...commonProps} />;
      case 'WAIT':
        return <WaitSystemTaskModal {...commonProps} />;
      case 'SET_VARIABLE':
        return <SetVariableSystemTaskModal {...commonProps} />;
      case 'SUB_WORKFLOW':
        return <SubWorkflowSystemTaskModal {...commonProps} />;
      case 'TERMINATE':
        return <TerminateSystemTaskModal {...commonProps} />;
      case 'INLINE':
        return <InlineSystemTaskModal {...commonProps} />;
      case 'FORK_JOIN':
        return <ForkJoinModal {...commonProps} />;
      case 'FORK_JOIN_DYNAMIC':
        return <ForkJoinDynamicModal {...commonProps} />;
      case 'SWITCH':
        return <SwitchModal {...commonProps} />;
      case 'DO_WHILE':
        return <DoWhileModal {...commonProps} />;
      case 'LAMBDA':
        return <LambdaModal {...commonProps} />;
      case 'JOIN':
        return <JoinModal {...commonProps} />;
      case 'EXCLUSIVE_JOIN':
        return <ExclusiveJoinModal {...commonProps} />;
      default:
        return null;
    }
  };

  const customBasicFields = (
    <div>
      <Label className="text-white">Loop Condition</Label>
      <Input
        value={config.loopCondition || ''}
        onChange={(e) => setConfig({ ...config, loopCondition: e.target.value })}
        placeholder="e.g., ${task.loopback}"
        className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
      />
      <p className="text-xs text-gray-400 mt-1">
        Condition to evaluate for continuing the loop
      </p>
    </div>
  );

  const customTabsContent = (
    <div className="space-y-4">
      <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
        <h3 className="text-lg font-semibold text-white mb-4">
          Loop Tasks ({(config.loopOver || []).length} tasks)
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Configure the tasks to be executed in each loop iteration
        </p>

        <div className="space-y-3 mb-4">
          {(config.loopOver || []).map((task, idx) =>
            renderTaskCard(task, idx)
          )}
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
            <SelectTrigger className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]">
              <SelectValue placeholder="Select task type..." />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
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
        title="Create Do While Operator"
        description="Configure a loop that executes tasks while a condition is true"
        buttonLabel="Create Operator"
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
