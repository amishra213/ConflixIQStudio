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

export interface InlineSystemTaskConfig extends BaseTaskConfig {
  type: 'INLINE';
  name: string;
  taskReferenceName: string;
  evaluatorType: 'javascript' | 'graaljs';
  expression: string;
}

interface InlineSystemTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: InlineSystemTaskConfig) => void;
  readonly initialConfig?: InlineSystemTaskConfig | null;
}

export function InlineSystemTaskModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: InlineSystemTaskModalProps) {
  const [config, setConfig] = useState<InlineSystemTaskConfig>({
    type: 'INLINE',
    name: '',
    taskReferenceName: '',
    evaluatorType: 'javascript',
    expression: 'function() { return { result: true }; }',
  });

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      if (initialConfig) {
        setConfig({
          ...initialConfig,
          name: initialConfig.name || `inline_${timestamp}`,
          taskReferenceName: initialConfig.taskReferenceName || `inline_ref_${timestamp}`,
        });
      } else {
        setConfig({
          type: 'INLINE',
          name: `inline_${timestamp}`,
          taskReferenceName: `inline_ref_${timestamp}`,
          evaluatorType: 'javascript',
          expression: 'function() { return { result: true }; }',
        });
      }
    }
  }, [open, initialConfig]);

  const customBasicFields = (
    <div style={{ '--line-height': '1.5rem' } as React.CSSProperties}>
      <div>
        <Label className="text-foreground">Evaluator Type *</Label>
        <Select
          value={config.evaluatorType}
          onValueChange={(val) =>
            setConfig({
              ...config,
              evaluatorType: val as 'javascript' | 'graaljs',
            })
          }
        >
          <SelectTrigger className="bg-card text-foreground border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card text-foreground border-border">
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="graaljs">GraalJS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-foreground">Expression *</Label>
        <JsonTextarea
          value={config.expression}
          onChange={(value) => setConfig({ ...config, expression: value })}
          placeholder="function() { return { result: $.input + 1 }; }"
          className="mt-1 bg-card text-foreground font-mono text-sm min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground mt-1">JavaScript expression to evaluate inline</p>
      </div>
    </div>
  );

  const validateConfig = (cfg: InlineSystemTaskConfig): string | null => {
    if (!cfg.expression || cfg.expression.trim() === '') {
      return 'Expression is required';
    }
    return null;
  };

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Create INLINE System Task"
      description="Execute inline JavaScript code"
      buttonLabel="Save Configuration"
      customBasicFields={customBasicFields}
      validateConfig={validateConfig}
    />
  );
}

