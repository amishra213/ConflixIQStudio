import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
}

export function SetVariableSystemTaskModal({
  open,
  onOpenChange,
  onSave,
}: SetVariableSystemTaskModalProps) {
  const [config, setConfig] = useState<SetVariableSystemTaskConfig>({
    type: 'SET_VARIABLE',
    name: '',
    taskReferenceName: '',
    variableName: '',
    value: {},
  });

  const [valueText, setValueText] = useState('');

  useEffect(() => {
    if (open) {
      setConfig({
        type: 'SET_VARIABLE',
        name: '',
        taskReferenceName: '',
        variableName: '',
        value: {},
      });
      setValueText('');
    }
  }, [open]);

  const customBasicFields = (
    <>
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
        <Textarea
          value={valueText}
          onChange={(e) => setValueText(e.target.value)}
          placeholder='{"key": "value"} or simple text'
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] font-mono text-sm min-h-[100px]"
        />
      </div>
    </>
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
