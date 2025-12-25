import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export interface EventSystemTaskConfig extends BaseTaskConfig {
  type: 'EVENT';
  name: string;
  taskReferenceName: string;
  sink: string;
  asyncComplete?: boolean;
}

interface EventSystemTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: EventSystemTaskConfig) => void;
  readonly initialConfig?: EventSystemTaskConfig | null;
}

export function EventSystemTaskModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: EventSystemTaskModalProps) {
  const [config, setConfig] = useState<EventSystemTaskConfig>({
    type: 'EVENT',
    name: '',
    taskReferenceName: '',
    sink: 'conductor',
    asyncComplete: false,
  });

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      if (initialConfig) {
        setConfig({
          ...initialConfig,
          name: initialConfig.name || `event_${timestamp}`,
          taskReferenceName: initialConfig.taskReferenceName || `event_ref_${timestamp}`,
        });
      } else {
        setConfig({
          type: 'EVENT',
          name: `event_${timestamp}`,
          taskReferenceName: `event_ref_${timestamp}`,
          sink: 'conductor',
          asyncComplete: false,
        });
      }
    }
  }, [open, initialConfig]);

  const customBasicFields = (
    <>
      <div>
        <Label className="text-foreground">Sink *</Label>
        <Input
          value={config.sink}
          onChange={(e) => setConfig({ ...config, sink: e.target.value })}
          placeholder="e.g., conductor, sqs:queue_name"
          className="mt-1 bg-card text-foreground border-border"
        />
        <p className="text-xs text-muted-foreground mt-1">Event sink (e.g., conductor, sqs, sns, kafka)</p>
      </div>
      <div className="flex items-center justify-between p-4 bg-card rounded-lg">
        <div>
          <Label className="text-foreground">Async Complete</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Mark task complete asynchronously via external event
          </p>
        </div>
        <Switch
          checked={config.asyncComplete ?? false}
          onCheckedChange={(checked) => setConfig({ ...config, asyncComplete: checked })}
        />
      </div>
    </>
  );

  const validateConfig = (cfg: EventSystemTaskConfig): string | null => {
    if (!cfg.sink || cfg.sink.trim() === '') {
      return 'Sink is required';
    }
    return null;
  };

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Create EVENT System Task"
      description="Publish event messages to external systems"
      buttonLabel="Save Configuration"
      customBasicFields={customBasicFields}
      validateConfig={validateConfig}
    />
  );
}

