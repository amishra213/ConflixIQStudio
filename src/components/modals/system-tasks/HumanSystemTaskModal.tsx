import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface HumanTaskConfig extends BaseTaskConfig {
  type: 'HUMAN';
  inputParameters: Record<string, unknown>;
}

interface HumanTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: HumanTaskConfig) => void;
  readonly initialConfig?: HumanTaskConfig | null;
}

export function HumanSystemTaskModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: HumanTaskModalProps) {
  const [config, setConfig] = useState<HumanTaskConfig>({
    type: 'HUMAN',
    name: 'human',
    taskReferenceName: 'human_ref',
    inputParameters: {},
  });

  const [inputParams, setInputParams] = useState<Array<{ id: string; key: string; value: string }>>(
    []
  );

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      if (initialConfig) {
        setConfig({
          type: 'HUMAN',
          name: initialConfig.name || `human_${timestamp}`,
          taskReferenceName: initialConfig.taskReferenceName || `human_ref_${timestamp}`,
          description: initialConfig.description,
          inputParameters: initialConfig.inputParameters || {},
        });

        // Extract input parameters into array format for UI
        const paramEntries = Object.entries(initialConfig.inputParameters || {});
        const paramList = paramEntries.map(([key, value], index) => ({
          id: `param-${Date.now()}-${index}`,
          key,
          value: String(value),
        }));
        setInputParams(paramList);
      } else {
        const defaultConfig: HumanTaskConfig = {
          type: 'HUMAN',
          name: `human_${timestamp}`,
          taskReferenceName: `human_ref_${timestamp}`,
          inputParameters: {},
        };
        setConfig(defaultConfig);
        setInputParams([]);
      }
    }
  }, [open, initialConfig]);

  const validateConfig = (cfg: HumanTaskConfig): string | null => {
    if (!cfg.name || cfg.name.trim() === '') {
      return 'Task name is required';
    }
    if (!cfg.taskReferenceName || cfg.taskReferenceName.trim() === '') {
      return 'Task Reference Name is required';
    }
    return null;
  };

  const handleAddParam = () => {
    const newId = `param-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setInputParams([...inputParams, { id: newId, key: '', value: '' }]);
  };

  const handleRemoveParam = (id: string) => {
    const updated = inputParams.filter((p) => p.id !== id);
    setInputParams(updated);
    // Sync to config
    const paramsObj: Record<string, unknown> = {};
    for (const p of updated) {
      if (p.key && p.value) {
        paramsObj[p.key] = p.value;
      }
    }
    setConfig({
      ...config,
      inputParameters: paramsObj,
    });
  };

  const handleParamChange = (id: string, field: 'key' | 'value', val: string) => {
    const updated = inputParams.map((p) => (p.id === id ? { ...p, [field]: val } : p));
    setInputParams(updated);
    // Sync to config
    const paramsObj: Record<string, unknown> = {};
    for (const p of updated) {
      if (p.key && p.value) {
        paramsObj[p.key] = p.value;
      }
    }
    setConfig({
      ...config,
      inputParameters: paramsObj,
    });
  };

  const handleSaveWithParams = (cfg: HumanTaskConfig) => {
    // Build input parameters from the array
    const paramsObj: Record<string, unknown> = {};
    for (const p of inputParams) {
      if (p.key && p.value) {
        // Try to parse value as JSON, otherwise keep as string
        try {
          paramsObj[p.key] = JSON.parse(p.value);
        } catch {
          paramsObj[p.key] = p.value;
        }
      }
    }

    const finalConfig: HumanTaskConfig = {
      ...cfg,
      inputParameters: paramsObj,
    };

    onSave(finalConfig);
  };

  const inputParametersTab = {
    id: 'input-params',
    label: 'Input Parameters',
    content: (
      <Card className="p-6 bg-background border-border">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Input Parameters</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Define key-value pairs that will be passed to this human task
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleAddParam}
            className="bg-cyan-500 text-foreground hover:bg-cyan-600 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Parameter
          </Button>
        </div>
        <div className="space-y-2">
          {inputParams.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No input parameters defined. Click &quot;Add Parameter&quot; to create one.
            </p>
          ) : (
            inputParams.map((param) => (
              <div key={param.id} className="flex gap-2">
                <Input
                  value={param.key}
                  onChange={(e) => handleParamChange(param.id, 'key', e.target.value)}
                  placeholder="Parameter name"
                  className="flex-1 bg-card text-foreground border-border"
                />
                <Input
                  value={param.value}
                  onChange={(e) => handleParamChange(param.id, 'value', e.target.value)}
                  placeholder='Value (JSON or string, e.g., "John" or {"name": "John"})'
                  className="flex-1 bg-card text-foreground border-border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemoveParam(param.id)}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    ),
  };

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSaveWithParams}
      initialConfig={config}
      title="Create Human Task"
      description="Configure a human task that pauses the workflow and waits for an external signal. The task remains IN_PROGRESS until marked as COMPLETED or FAILED by an external trigger."
      buttonLabel="Save Configuration"
      customTabs={[inputParametersTab]}
      validateConfig={validateConfig}
    />
  );
}

