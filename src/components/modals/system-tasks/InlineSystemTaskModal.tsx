import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
}

export function InlineSystemTaskModal({ open, onOpenChange, onSave }: InlineSystemTaskModalProps) {
  const [config, setConfig] = useState<InlineSystemTaskConfig>({
    type: 'INLINE',
    name: '',
    taskReferenceName: '',
    evaluatorType: 'javascript',
    expression: '',
  });

  useEffect(() => {
    if (open) {
      setConfig({
        type: 'INLINE',
        name: '',
        taskReferenceName: '',
        evaluatorType: 'javascript',
        expression: '',
      });
    }
  }, [open]);

  const customBasicFields = (
    <>
      <div>
        <Label className="text-white">Evaluator Type *</Label>
        <Select
          value={config.evaluatorType}
          onValueChange={(val) =>
            setConfig({
              ...config,
              evaluatorType: val as 'javascript' | 'graaljs',
            })
          }
        >
          <SelectTrigger className="bg-[#1a1f2e] text-white border-[#2a3142]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="graaljs">GraalJS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-white">Expression *</Label>
        <Textarea
          value={config.expression}
          onChange={(e) => setConfig({ ...config, expression: e.target.value })}
          placeholder='function() { return { result: $.input + 1 }; }'
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] font-mono text-sm min-h-[120px]"
        />
        <p className="text-xs text-gray-400 mt-1">JavaScript expression to evaluate inline</p>
      </div>
    </>
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
