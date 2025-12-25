import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface TerminateConfig extends BaseTaskConfig {
  taskRefId: string;
  name?: string;
  taskType: 'TERMINATE';
  terminationStatus?: 'COMPLETED' | 'FAILED' | 'TIMED_OUT';
  terminationReason?: string;
  description?: string;
}

interface TerminateModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: TerminateConfig) => void;
}

export function TerminateModal({ open, onOpenChange, onSave }: TerminateModalProps) {
  const [config, setConfig] = useState<TerminateConfig>({
    taskRefId: 'terminate-1',
    name: 'Terminate',
    taskType: 'TERMINATE',
    terminationStatus: 'COMPLETED',
  });

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        taskRefId: `terminate-${timestamp}`,
        name: 'Terminate',
        taskType: 'TERMINATE',
        terminationStatus: 'COMPLETED',
      });
    }
  }, [open]);

  const customBasicFields = (
    <>
      <div>
        <Label className="text-foreground">Termination Status</Label>
        <Select
          value={config.terminationStatus}
          onValueChange={(value) =>
            setConfig({
              ...config,
              terminationStatus: value as 'COMPLETED' | 'FAILED' | 'TIMED_OUT',
            })
          }
        >
          <SelectTrigger className="bg-card text-foreground border-border">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="bg-card text-foreground border-border">
            <SelectItem value="COMPLETED">COMPLETED</SelectItem>
            <SelectItem value="FAILED">FAILED</SelectItem>
            <SelectItem value="TIMED_OUT">TIMED_OUT</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-foreground">Termination Reason</Label>
        <Textarea
          value={config.terminationReason || ''}
          onChange={(e) => setConfig({ ...config, terminationReason: e.target.value })}
          placeholder="Reason for termination"
          className="mt-1 bg-card text-foreground border-border min-h-[80px]"
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
      title="Terminate Operator"
      buttonLabel="Save Operator"
      customBasicFields={customBasicFields}
    />
  );
}

