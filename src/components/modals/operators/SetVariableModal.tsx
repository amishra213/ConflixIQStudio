import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

export interface SetVariableConfig extends BaseTaskConfig {
  taskRefId: string;
  name?: string;
  taskType: 'SET_VARIABLE';
  variablesToSet?: Record<string, unknown>;
  description?: string;
}

interface SetVariableModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: SetVariableConfig) => void;
}

export function SetVariableModal({ open, onOpenChange, onSave }: SetVariableModalProps) {
  const [config, setConfig] = useState<SetVariableConfig>({
    taskRefId: 'setVariable-1',
    name: 'Set Variable',
    taskType: 'SET_VARIABLE',
    variablesToSet: {},
  });

  const [variables, setVariables] = useState<Array<{ id: string; key: string; value: string }>>([]);

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        taskRefId: `setVariable-${timestamp}`,
        name: 'Set Variable',
        taskType: 'SET_VARIABLE',
        variablesToSet: {},
      });
      setVariables([]);
    }
  }, [open]);

  const handleAddVariable = () => {
    const newId = `var-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setVariables([...variables, { id: newId, key: '', value: '' }]);
  };

  const handleRemoveVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id));
  };

  const handleVariableChange = (id: string, field: 'key' | 'value', val: string) => {
    setVariables(variables.map((v) => (v.id === id ? { ...v, [field]: val } : v)));
  };

  const customBasicFields = (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label className="text-foreground">Variables</Label>
        <Button
          size="sm"
          onClick={handleAddVariable}
          className="bg-cyan-500 text-foreground hover:bg-cyan-600 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Variable
        </Button>
      </div>
      <div className="space-y-2">
        {variables.map((variable) => (
          <div key={variable.id} className="flex gap-2">
            <Input
              value={variable.key}
              onChange={(e) => handleVariableChange(variable.id, 'key', e.target.value)}
              placeholder="Variable name"
              className="flex-1 bg-card text-foreground border-border"
            />
            <Input
              value={variable.value}
              onChange={(e) => handleVariableChange(variable.id, 'value', e.target.value)}
              placeholder="Value (JSON or string)"
              className="flex-1 bg-card text-foreground border-border"
            />
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleRemoveVariable(variable.id)}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  const handleSaveWithVariables = (finalConfig: SetVariableConfig) => {
    const variablesToSet: Record<string, unknown> = {};
    for (const v of variables) {
      if (v.key && v.value) {
        try {
          variablesToSet[v.key] = JSON.parse(v.value);
        } catch {
          variablesToSet[v.key] = v.value;
        }
      }
    }
    onSave({ ...finalConfig, variablesToSet });
  };

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSaveWithVariables}
      initialConfig={config}
      title="Set Variable Operator"
      buttonLabel="Save Operator"
      customBasicFields={customBasicFields}
    />
  );
}

