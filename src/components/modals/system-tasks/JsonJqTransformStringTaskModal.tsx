import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { JsonTextarea } from '@/components/ui/json-textarea';

export interface JsonJqTransformStringTaskConfig extends BaseTaskConfig {
  type: 'JSON_JQ_TRANSFORM_STRING';
  queryExpression: string;
}

interface JsonJqTransformStringTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: JsonJqTransformStringTaskConfig) => void;
  readonly initialConfig?: JsonJqTransformStringTaskConfig | null;
}

export function JsonJqTransformStringTaskModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: JsonJqTransformStringTaskModalProps) {
  const [config, setConfig] = useState<JsonJqTransformStringTaskConfig>({
    type: 'JSON_JQ_TRANSFORM_STRING',
    name: '',
    taskReferenceName: '',
    queryExpression: '. | @json',
  });

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setConfig(initialConfig);
      } else {
        setConfig({
          type: 'JSON_JQ_TRANSFORM_STRING',
          name: '',
          taskReferenceName: '',
          queryExpression: '. | @json',
        });
      }
    }
  }, [open, initialConfig]);

  const customBasicFields = (
    <div style={{ '--line-height': '1.5rem' } as React.CSSProperties}>
      <Label className="text-white">Query Expression *</Label>
      <JsonTextarea
        value={config.queryExpression}
        onChange={(value) => setConfig({ ...config, queryExpression: value })}
        placeholder=".field | @json"
        className="mt-1 bg-[#1a1f2e] text-white font-mono text-sm min-h-[120px]"
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
