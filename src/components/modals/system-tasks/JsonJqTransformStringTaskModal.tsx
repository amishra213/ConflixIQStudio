import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface JsonJqTransformStringTaskConfig extends BaseTaskConfig {
  type: 'JSON_JQ_TRANSFORM_STRING';
  queryExpression: string;
}

interface JsonJqTransformStringTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: JsonJqTransformStringTaskConfig) => void;
}

export function JsonJqTransformStringTaskModal({
  open,
  onOpenChange,
  onSave,
}: JsonJqTransformStringTaskModalProps) {
  const [config, setConfig] = useState<JsonJqTransformStringTaskConfig>({
    type: 'JSON_JQ_TRANSFORM_STRING',
    name: '',
    taskReferenceName: '',
    queryExpression: '',
  });

  useEffect(() => {
    if (open) {
      setConfig({
        type: 'JSON_JQ_TRANSFORM_STRING',
        name: '',
        taskReferenceName: '',
        queryExpression: '',
      });
    }
  }, [open]);

  const customBasicFields = (
    <div>
      <Label className="text-white">Query Expression *</Label>
      <Textarea
        value={config.queryExpression}
        onChange={(e) => setConfig({ ...config, queryExpression: e.target.value })}
        placeholder=".field | @json"
        className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] font-mono text-sm min-h-[120px]"
      />
      <p className="text-xs text-gray-400 mt-1">
        Enter a valid jq query expression that returns a string
      </p>
    </div>
  );

  const validateConfig = (cfg: JsonJqTransformStringTaskConfig): string | null => {
    if (!cfg.queryExpression || cfg.queryExpression.trim() === '') {
      return 'Query Expression is required';
    }
    return null;
  };

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Create JSON JQ Transform String System Task"
      buttonLabel="Save Configuration"
      customBasicFields={customBasicFields}
      validateConfig={validateConfig}
    />
  );
}
