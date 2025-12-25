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

export function WaitSystemTaskModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: WaitSystemTaskModalProps) {
  const [config, setConfig] = useState<WaitSystemTaskConfig>({
    type: 'WAIT',
    name: '',
    taskReferenceName: '',
    duration: '',
  });

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      if (initialConfig) {
        setConfig({
          ...initialConfig,
          name: initialConfig.name || `wait_${timestamp}`,
          taskReferenceName: initialConfig.taskReferenceName || `wait_ref_${timestamp}`,
        });
      } else {
        setConfig({
          type: 'WAIT',
          name: `wait_${timestamp}`,
          taskReferenceName: `wait_ref_${timestamp}`,
          duration: '',
        });
      }
    }
  }, [open, initialConfig]);

  const customBasicFields = (
    <div>
      <Label className="text-foreground">Duration</Label>
      <Input
        value={config.duration || ''}
        onChange={(e) => setConfig({ ...config, duration: e.target.value })}
        placeholder="e.g., PT30S (ISO 8601 format)"
        className="mt-1 bg-card text-foreground border-border"
      />
      <p className="text-xs text-muted-foreground mt-1">
        Optional: ISO 8601 duration format (e.g., PT30S, PT5M)
      </p>
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

