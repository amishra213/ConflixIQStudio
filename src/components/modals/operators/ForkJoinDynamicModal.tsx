import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface ForkJoinDynamicConfig extends BaseTaskConfig {
  taskRefId: string;
  taskType: 'FORK_JOIN_DYNAMIC';
  dynamicForkTasksParam: string;
  dynamicForkTasksInputParamName?: string;
  forkTaskType?: string;
}

interface ForkJoinDynamicModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: ForkJoinDynamicConfig) => void;
}

export function ForkJoinDynamicModal({ open, onOpenChange, onSave }: ForkJoinDynamicModalProps) {
  const [config, setConfig] = useState<ForkJoinDynamicConfig>({
    taskRefId: 'fork-join-dynamic-1',
    name: 'Fork Join Dynamic',
    taskType: 'FORK_JOIN_DYNAMIC',
    dynamicForkTasksParam: 'forkedTasks',
  });

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        taskRefId: `fork-join-dynamic-${timestamp}`,
        name: 'Fork Join Dynamic',
        taskType: 'FORK_JOIN_DYNAMIC',
        dynamicForkTasksParam: 'forkedTasks',
      });
    }
  }, [open]);

  const customBasicFields = (
    <div className="space-y-3">
      <div>
        <Label className="text-white">Dynamic Fork Tasks Parameter *</Label>
        <Input
          value={config.dynamicForkTasksParam}
          onChange={(e) => setConfig({ ...config, dynamicForkTasksParam: e.target.value })}
          placeholder="e.g., forkedTasks"
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
        />
        <p className="text-xs text-gray-400 mt-1">Workflow input parameter name containing the fork tasks</p>
      </div>
      <div>
        <Label className="text-white">Dynamic Fork Tasks Input Param Name</Label>
        <Input
          value={config.dynamicForkTasksInputParamName || ''}
          onChange={(e) => setConfig({ ...config, dynamicForkTasksInputParamName: e.target.value })}
          placeholder="e.g., taskList"
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
        />
        <p className="text-xs text-gray-400 mt-1">Parameter name passed to each fork task</p>
      </div>
      <div>
        <Label className="text-white">Fork Task Type</Label>
        <Input
          value={config.forkTaskType || ''}
          onChange={(e) => setConfig({ ...config, forkTaskType: e.target.value })}
          placeholder="e.g., SIMPLE"
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
        />
        <p className="text-xs text-gray-400 mt-1">Task type for dynamically created fork tasks</p>
      </div>
    </div>
  );

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Create Fork Join Dynamic Operator"
      description="Execute multiple tasks dynamically based on workflow input"
      buttonLabel="Create Operator"
      customBasicFields={customBasicFields}
    />
  );
}
