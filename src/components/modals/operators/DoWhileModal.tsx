import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface DoWhileConfig extends BaseTaskConfig {
  taskRefId: string;
  name?: string;
  taskType: 'DO_WHILE';
  loopCondition?: string;
  loopOver?: string;
  description?: string;
}

interface DoWhileModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: DoWhileConfig) => void;
}

export function DoWhileModal({ open, onOpenChange, onSave }: DoWhileModalProps) {
  const [config, setConfig] = useState<DoWhileConfig>({
    taskRefId: 'do-while-1',
    name: 'Do While',
    taskType: 'DO_WHILE',
  });

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        taskRefId: `do-while-${timestamp}`,
        name: 'Do While',
        taskType: 'DO_WHILE',
      });
    }
  }, [open]);

  const customBasicFields = (
    <>
      <div>
        <Label className="text-white">Loop Condition</Label>
        <Input
          value={config.loopCondition || ''}
          onChange={(e) => setConfig({ ...config, loopCondition: e.target.value })}
          placeholder="e.g., ${task.loopback}"
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
        />
      </div>
      <div>
        <Label className="text-white">Loop Over</Label>
        <Input
          value={config.loopOver || ''}
          onChange={(e) => setConfig({ ...config, loopOver: e.target.value })}
          placeholder="Task ref ID to loop"
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
        />
      </div>
    </>
  );

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Create Do While Operator"
      buttonLabel="Create Operator"
      customBasicFields={customBasicFields}
    />
  );
}
