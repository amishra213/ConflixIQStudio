import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface LambdaConfig extends BaseTaskConfig {
  taskRefId: string;
  taskType: 'LAMBDA';
  scriptExpression?: string;
}

interface LambdaModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: LambdaConfig) => void;
}

export function LambdaModal({ open, onOpenChange, onSave }: LambdaModalProps) {
  const [config, setConfig] = useState<LambdaConfig>({
    taskRefId: 'lambda-1',
    name: 'Lambda',
    taskType: 'LAMBDA',
  });

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        taskRefId: `lambda-${timestamp}`,
        name: 'Lambda',
        taskType: 'LAMBDA',
      });
    }
  }, [open]);

  const customBasicFields = (
    <div>
      <Label className="text-white">Script Expression</Label>
      <Textarea
        value={config.scriptExpression || ''}
        onChange={(e) => setConfig({ ...config, scriptExpression: e.target.value })}
        placeholder="Lambda script expression"
        className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] font-mono text-sm min-h-[120px]"
      />
      <p className="text-xs text-gray-400 mt-1">JavaScript expression for lambda execution</p>
    </div>
  );

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Create Lambda Operator"
      description="Execute Lambda functions in your workflow"
      buttonLabel="Create Operator"
      customBasicFields={customBasicFields}
    />
  );
}
