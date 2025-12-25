import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { JsonTextarea } from '@/components/ui/json-textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface TerminateSystemTaskConfig extends BaseTaskConfig {
  type: 'TERMINATE';
  name: string;
  taskReferenceName: string;
  terminationStatus: 'COMPLETED' | 'FAILED';
  workflowOutput?: Record<string, unknown>;
}

interface TerminateSystemTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: TerminateSystemTaskConfig) => void;
  readonly initialConfig?: TerminateSystemTaskConfig;
}

export function TerminateSystemTaskModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: TerminateSystemTaskModalProps) {
  const [config, setConfig] = useState<TerminateSystemTaskConfig>({
    type: 'TERMINATE',
    name: '',
    taskReferenceName: '',
    terminationStatus: 'COMPLETED',
  });

  const [outputText, setOutputText] = useState('');

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      if (initialConfig) {
        setConfig({
          ...initialConfig,
          name: initialConfig.name || `terminate_${timestamp}`,
          taskReferenceName: initialConfig.taskReferenceName || `terminate_ref_${timestamp}`,
        });
        setOutputText(
          initialConfig.workflowOutput ? JSON.stringify(initialConfig.workflowOutput, null, 2) : ''
        );
      } else {
        setConfig({
          type: 'TERMINATE',
          name: `terminate_${timestamp}`,
          taskReferenceName: `terminate_ref_${timestamp}`,
          terminationStatus: 'COMPLETED',
        });
        setOutputText('');
      }
    }
  }, [open, initialConfig]);

  const customBasicFields = (
    <div style={{ '--line-height': '1.5rem' } as React.CSSProperties}>
      <div>
        <Label className="text-foreground">Termination Status *</Label>
        <Select
          value={config.terminationStatus}
          onValueChange={(val) =>
            setConfig({
              ...config,
              terminationStatus: val as 'COMPLETED' | 'FAILED',
            })
          }
        >
          <SelectTrigger className="bg-card text-foreground border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card text-foreground border-border">
            <SelectItem value="COMPLETED">COMPLETED</SelectItem>
            <SelectItem value="FAILED">FAILED</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-foreground">Workflow Output (JSON)</Label>
        <JsonTextarea
          value={outputText}
          onChange={(value) => setOutputText(value)}
          placeholder='{"result": "success"}'
          className="mt-1 bg-card text-foreground font-mono text-sm min-h-[100px]"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Optional: Output to return when workflow terminates
        </p>
      </div>
    </div>
  );

  const handleSaveWithOutput = (finalConfig: TerminateSystemTaskConfig) => {
    let workflowOutput: Record<string, unknown> | undefined = undefined;
    if (outputText.trim()) {
      try {
        workflowOutput = JSON.parse(outputText);
      } catch {
        // If JSON parse fails, ignore the output
        workflowOutput = undefined;
      }
    }
    onSave({ ...finalConfig, workflowOutput, terminationStatus: config.terminationStatus });
  };

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSaveWithOutput}
      initialConfig={config}
      title="Create Terminate Task"
      description="Configure a terminate task to end the workflow execution."
      buttonLabel="Save Configuration"
      customBasicFields={customBasicFields}
    />
  );
}

