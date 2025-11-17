import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface WaitSystemTaskConfig extends BaseTaskConfig {
  type: 'WAIT';
  name: string;
  taskReferenceName: string;
  duration?: string;
}

interface WaitSystemTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: WaitSystemTaskConfig) => void;
  readonly initialConfig?: WaitSystemTaskConfig;
}

export function WaitSystemTaskModal({ open, onOpenChange, onSave, initialConfig }: WaitSystemTaskModalProps) {
  const [config, setConfig] = useState<WaitSystemTaskConfig>({
    type: 'WAIT',
    name: '',
    taskReferenceName: '',
    duration: '',
  });

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setConfig({ ...initialConfig });
      } else {
        setConfig({
          type: 'WAIT',
          name: '',
          taskReferenceName: '',
          duration: '',
        });
      }
    }
  }, [open, initialConfig]);

  const customBasicFields = (
    <div>
      <Label className="text-white">Duration</Label>
      <Input
        value={config.duration || ''}
        onChange={(e) => setConfig({ ...config, duration: e.target.value })}
        placeholder="e.g., PT30S (ISO 8601 format)"
        className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
      />
      <p className="text-xs text-gray-400 mt-1">Optional: ISO 8601 duration format (e.g., PT30S, PT5M)</p>
    </div>
  );

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Create Wait Task"
      description="Configure a wait task to pause workflow execution for a specified duration."
      buttonLabel="Save Configuration"
      customBasicFields={customBasicFields}
    />
  );
}
