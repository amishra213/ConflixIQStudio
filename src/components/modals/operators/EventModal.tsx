import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface EventConfig extends BaseTaskConfig {
  taskRefId: string;
  name?: string;
  taskType: 'EVENT';
  event?: string;
  action?: string;
  description?: string;
}

interface EventModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: EventConfig) => void;
  readonly initialConfig?: EventConfig | null;
}

export function EventModal({ open, onOpenChange, onSave, initialConfig }: EventModalProps) {
  const [config, setConfig] = useState<EventConfig>({
    taskRefId: 'event-1',
    name: 'Event',
    taskType: 'EVENT',
    event: 'my_event',
    action: 'COMPLETE',
  });

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setConfig({ ...initialConfig });
      } else {
        const timestamp = Date.now();
        setConfig({
          taskRefId: `event-${timestamp}`,
          name: 'Event',
          taskType: 'EVENT',
          event: 'my_event',
          action: 'COMPLETE',
        });
      }
    }
  }, [open, initialConfig]);

  const customBasicFields = (
    <>
      <div>
        <Label className="text-white">Event</Label>
        <Input
          value={config.event || ''}
          onChange={(e) => setConfig({ ...config, event: e.target.value })}
          placeholder="Event name or identifier"
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
        />
      </div>
      <div>
        <Label className="text-white">Action</Label>
        <Input
          value={config.action || ''}
          onChange={(e) => setConfig({ ...config, action: e.target.value })}
          placeholder="e.g., COMPLETE, FAIL, RETRY"
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
      title="Event Operator"
      buttonLabel="Save Operator"
      customBasicFields={customBasicFields}
    />
  );
}
