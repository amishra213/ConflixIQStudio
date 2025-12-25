import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface DynamicConfig extends BaseTaskConfig {
  taskRefId: string;
  name?: string;
  taskType: 'DYNAMIC';
  dynamicTaskNameParam: string;
  inputParameters: {
    [key: string]: unknown;
  };
  description?: string;
}

interface DynamicModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: DynamicConfig) => void;
  readonly initialConfig?: DynamicConfig | null;
}

export function DynamicModal({ open, onOpenChange, onSave, initialConfig }: DynamicModalProps) {
  const [config, setConfig] = useState<DynamicConfig>({
    taskRefId: 'dynamic-1',
    name: 'Dynamic',
    taskType: 'DYNAMIC',
    dynamicTaskNameParam: 'taskToExecute',
    inputParameters: {},
  });

  const [inputParametersText, setInputParametersText] = useState('');

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setConfig({ ...initialConfig });
        setInputParametersText(JSON.stringify(initialConfig.inputParameters || {}, null, 2));
      } else {
        const timestamp = Date.now();
        const defaultConfig: DynamicConfig = {
          taskRefId: `dynamic-${timestamp}`,
          name: 'Dynamic',
          taskType: 'DYNAMIC',
          dynamicTaskNameParam: 'taskToExecute',
          inputParameters: {
            taskToExecute: '${workflow.input.dynamicTaskName}',
          },
        };
        setConfig(defaultConfig);
        setInputParametersText(JSON.stringify(defaultConfig.inputParameters, null, 2));
      }
    }
  }, [open, initialConfig]);

  const customBasicFields = (
    <>
      <div>
        <Label className="text-foreground">Dynamic Task Name Parameter *</Label>
        <Input
          value={config.dynamicTaskNameParam}
          onChange={(e) => setConfig({ ...config, dynamicTaskNameParam: e.target.value })}
          placeholder="e.g., taskToExecute"
          className="mt-1 bg-card text-foreground border-border"
        />
        <p className="text-xs text-muted-foreground mt-1">
          The parameter name in inputParameters whose value is used to determine which task to
          execute
        </p>
      </div>
      <div>
        <Label className="text-foreground">Input Parameters *</Label>
        <Textarea
          value={inputParametersText}
          onChange={(e) => setInputParametersText(e.target.value)}
          placeholder={'{\n  "taskToExecute": "${workflow.input.dynamicTaskName}"\n}'}
          className="mt-1 bg-card text-foreground border-border font-mono text-sm min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground mt-1">
          JSON object with input parameters. Must include a parameter matching dynamicTaskNameParam
          with the task name to execute
        </p>
      </div>
    </>
  );

  const handleSaveWithInputParameters = (finalConfig: DynamicConfig) => {
    let inputParameters: Record<string, unknown> = {};
    if (inputParametersText.trim()) {
      try {
        inputParameters = JSON.parse(inputParametersText);
      } catch {
        throw new Error('Invalid JSON in Input Parameters');
      }
    }
    onSave({
      ...finalConfig,
      inputParameters,
      dynamicTaskNameParam: config.dynamicTaskNameParam,
    });
  };

  const validateConfig = (cfg: DynamicConfig): string | null => {
    if (!cfg.dynamicTaskNameParam || cfg.dynamicTaskNameParam.trim() === '') {
      return 'Dynamic Task Name Parameter is required';
    }

    // Parse input parameters
    let inputParams: Record<string, unknown> = {};
    if (inputParametersText.trim()) {
      try {
        inputParams = JSON.parse(inputParametersText);
      } catch {
        return 'Input Parameters must be valid JSON';
      }
    }

    // Validate that the dynamicTaskNameParam exists in inputParameters
    if (!inputParams[cfg.dynamicTaskNameParam]) {
      return `Input Parameters must include a "${cfg.dynamicTaskNameParam}" parameter`;
    }

    return null;
  };

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSaveWithInputParameters}
      initialConfig={config}
      title="Create Dynamic Operator"
      description="Configure a dynamic operator that executes another task determined at runtime"
      buttonLabel="Save Operator"
      customBasicFields={customBasicFields}
      validateConfig={validateConfig}
    />
  );
}

