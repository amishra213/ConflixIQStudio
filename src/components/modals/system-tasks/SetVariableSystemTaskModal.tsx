import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { JsonTextarea } from '@/components/ui/json-textarea';

export interface SetVariableSystemTaskConfig extends BaseTaskConfig {
  type: 'SET_VARIABLE';
  name: string;
  taskReferenceName: string;
  variableName: string;
  value: any;
}

interface SetVariableSystemTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: SetVariableSystemTaskConfig) => void;
  readonly initialConfig?: SetVariableSystemTaskConfig | null;
}

export function SetVariableSystemTaskModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: SetVariableSystemTaskModalProps) {
  const [config, setConfig] = useState<SetVariableSystemTaskConfig>({
    type: 'SET_VARIABLE',
    name: '',
    taskReferenceName: '',
    variableName: 'myVariable',
    value: {},
  });

  const [valueText, setValueText] = useState('');

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setConfig({ ...initialConfig });
        setValueText(typeof initialConfig.value === 'object'
          ? JSON.stringify(initialConfig.value, null, 2)
          : String(initialConfig.value));
      } else {
        setConfig({
          type: 'SET_VARIABLE',
          name: '',
          taskReferenceName: '',
          variableName: 'myVariable',
          value: {},
        });
        setValueText('');
      }
    }
  }, [open, initialConfig]);

  const customBasicFields = (
    <div style={{ '--line-height': '1.5rem' } as React.CSSProperties}>
      <div>
        <Label className="text-white">Variable Name *</Label>
        <Input
          value={config.variableName}
          onChange={(e) => setConfig({ ...config, variableName: e.target.value })}
          placeholder="e.g., myVariable"
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
        />
      </div>
      <div>
        <Label className="text-white">Value (JSON or text)</Label>
        <JsonTextarea
          value={valueText}
          onChange={(value) => setValueText(value)}
          placeholder='{"key": "value"} or simple text'
          className="mt-1 bg-[#1a1f2e] text-white font-mono text-sm min-h-[100px]"
        />
      </div>
    </div>
  );

  const handleSaveWithValue = (finalConfig: SetVariableSystemTaskConfig) => {
    let value: any = {};
    if (valueText.trim()) {
      try {
        value = JSON.parse(valueText);
      } catch {
        value = valueText;
      }
    }
    onSave({ ...finalConfig, value, variableName: config.variableName });
  };

  const validateConfig = (cfg: SetVariableSystemTaskConfig): string | null => {
    if (!cfg.variableName || cfg.variableName.trim() === '') {
      return 'Variable Name is required';
    }
    return null;
  };

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSaveWithValue}
      initialConfig={config}
      title="Create Set Variable Task"
      description="Configure a set variable task to define workflow variables."
      buttonLabel="Save Configuration"
      customBasicFields={customBasicFields}
      validateConfig={validateConfig}
    />
  );
}
