import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { JsonTextarea } from '@/components/ui/json-textarea';

export interface JsonJqTransformTaskConfig extends BaseTaskConfig {
  type: 'JSON_JQ_TRANSFORM';
  queryExpression: string;
}

interface JsonJqTransformTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: JsonJqTransformTaskConfig) => void;
  readonly initialConfig?: JsonJqTransformTaskConfig | null;
}

export function JsonJqTransformTaskModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: JsonJqTransformTaskModalProps) {
  const [config, setConfig] = useState<JsonJqTransformTaskConfig>({
    type: 'JSON_JQ_TRANSFORM',
    name: '',
    taskReferenceName: '',
    queryExpression: '.',
  });

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      if (initialConfig) {
        setConfig({
          ...initialConfig,
          name: initialConfig.name || `json_jq_transform_${timestamp}`,
          taskReferenceName:
            initialConfig.taskReferenceName || `json_jq_transform_ref_${timestamp}`,
        });
      } else {
        setConfig({
          type: 'JSON_JQ_TRANSFORM',
          name: `json_jq_transform_${timestamp}`,
          taskReferenceName: `json_jq_transform_ref_${timestamp}`,
          queryExpression: '.',
        });
      }
    }
  }, [open, initialConfig]);

  const customBasicFields = (
    <div style={{ '--line-height': '1.5rem' } as React.CSSProperties}>
      <Label className="text-foreground">Query Expression *</Label>
      <JsonTextarea
        value={config.queryExpression}
        onChange={(value) => setConfig({ ...config, queryExpression: value })}
        placeholder=".field | select(.value > 10)"
        className="mt-1 bg-card text-foreground font-mono text-sm min-h-[120px]"
      />
      <p className="text-xs text-muted-foreground mt-1">Enter a valid jq query expression</p>
    </div>
  );

  const validateConfig = (cfg: JsonJqTransformTaskConfig): string | null => {
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
      title="Create JSON JQ Transform Task"
      description="Configure a JSON JQ transform task to manipulate JSON data using JQ expressions."
      buttonLabel="Save Configuration"
      customBasicFields={customBasicFields}
      validateConfig={validateConfig}
    />
  );
}

