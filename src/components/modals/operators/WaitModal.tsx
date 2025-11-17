import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface WaitConfig extends BaseTaskConfig {
  taskRefId: string;
  name?: string;
  taskType: 'WAIT';
  duration?: number;
  timeUnit?: string;
  description?: string;
}

interface WaitModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: WaitConfig) => void;
}

export function WaitModal({ open, onOpenChange, onSave }: WaitModalProps) {
  const [config, setConfig] = useState<WaitConfig>({
    taskRefId: 'wait-1',
    name: 'Wait',
    taskType: 'WAIT',
    timeUnit: 'SECONDS',
  });

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        taskRefId: `wait-${timestamp}`,
        name: 'Wait',
        taskType: 'WAIT',
        timeUnit: 'SECONDS',
      });
    }
  }, [open]);

  const customBasicFields = (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-white">Duration</Label>
        <Input
          type="number"
          value={config.duration || ''}
          onChange={(e) => setConfig({ ...config, duration: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Duration value"
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
        />
      </div>
      <div>
        <Label className="text-white">Time Unit</Label>
        <Input
          value={config.timeUnit || ''}
          onChange={(e) => setConfig({ ...config, timeUnit: e.target.value })}
          placeholder="e.g., SECONDS, MINUTES, HOURS"
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
        />
      </div>
    </div>
  );

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Wait Operator"
      buttonLabel="Save Operator"
      customBasicFields={customBasicFields}
    />
  );
}
