import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface InlineConfig extends BaseTaskConfig {
  taskRefId: string;
  taskType: 'INLINE';
  evaluatorType?: string;
  expression?: string;
}

interface InlineModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: InlineConfig) => void;
  readonly initialConfig?: InlineConfig;
}

export function InlineModal({ open, onOpenChange, onSave, initialConfig }: InlineModalProps) {
  const [config, setConfig] = useState<InlineConfig>({
    taskRefId: 'inline-1',
    name: 'Inline',
    taskType: 'INLINE',
    evaluatorType: 'javascript',
  });

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setConfig({ ...initialConfig });
      } else {
        const timestamp = Date.now();
        setConfig({
          taskRefId: `inline-${timestamp}`,
          name: 'Inline',
          taskType: 'INLINE',
          evaluatorType: 'javascript',
        });
      }
    }
  }, [open, initialConfig]);

  const customBasicFields = (
    <div className="space-y-3">
      <div>
        <Label className="text-foreground">Evaluator Type</Label>
        <Input
          value={config.evaluatorType || ''}
          onChange={(e) => setConfig({ ...config, evaluatorType: e.target.value })}
          placeholder="e.g., javascript, groovy"
          className="mt-1 bg-card text-foreground border-border"
        />
        <p className="text-xs text-muted-foreground mt-1">Type of evaluator (e.g., javascript, jq)</p>
      </div>
      <div>
        <Label className="text-foreground">Expression</Label>
        <Textarea
          value={config.expression || ''}
          onChange={(e) => setConfig({ ...config, expression: e.target.value })}
          placeholder="Inline expression to evaluate"
          className="mt-1 bg-card text-foreground border-border font-mono text-sm min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground mt-1">The expression to be evaluated inline</p>
      </div>
    </div>
  );

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Create Inline Operator"
      description="Execute inline code or expressions in your workflow"
      buttonLabel="Save Operator"
      customBasicFields={customBasicFields}
    />
  );
}

