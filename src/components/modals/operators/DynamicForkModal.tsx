import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

export interface ForkJoinDynamicConfig extends BaseTaskConfig {
  taskRefId: string;
  name?: string;
  taskType: 'FORK_JOIN_DYNAMIC';
  description?: string;
  // Mode A: Different task per fork
  dynamicForkTasksParam?: string;
  dynamicForkTasksInputParamName?: string;
  // Mode B & C: Same task type or workflow
  forkTaskType?: string;
  forkTaskName?: string;
  forkTaskWorkflow?: string;
  forkTaskWorkflowVersion?: number;
  inputParameters?: {
    [key: string]: unknown;
  };
}

interface DynamicForkModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: ForkJoinDynamicConfig) => void;
  readonly initialConfig?: ForkJoinDynamicConfig | null;
}

type ConfigMode = 'different-tasks' | 'same-task' | 'subworkflow';

export function DynamicForkModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: DynamicForkModalProps) {
  const [configMode, setConfigMode] = useState<ConfigMode>('different-tasks');
  const [config, setConfig] = useState<ForkJoinDynamicConfig>({
    taskRefId: 'fork-join-dynamic-1',
    name: 'Fork Join Dynamic',
    taskType: 'FORK_JOIN_DYNAMIC',
    inputParameters: {},
  });

  const [inputParametersText, setInputParametersText] = useState('');

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setConfig({ ...initialConfig });
        setInputParametersText(JSON.stringify(initialConfig.inputParameters || {}, null, 2));

        // Detect mode from config
        if (initialConfig.forkTaskWorkflow) {
          setConfigMode('subworkflow');
        } else if (initialConfig.inputParameters?.forkTaskType) {
          setConfigMode('same-task');
        } else {
          setConfigMode('different-tasks');
        }
      } else {
        const timestamp = Date.now();
        const defaultConfig: ForkJoinDynamicConfig = {
          taskRefId: `fork-join-dynamic-${timestamp}`,
          name: 'Fork Join Dynamic',
          taskType: 'FORK_JOIN_DYNAMIC',
          dynamicForkTasksParam: 'dynamicTasks',
          dynamicForkTasksInputParamName: 'dynamicTasksInput',
          inputParameters: {
            dynamicTasks: [],
            dynamicTasksInput: {},
          },
        };
        setConfig(defaultConfig);
        setInputParametersText(JSON.stringify(defaultConfig.inputParameters, null, 2));
        setConfigMode('different-tasks');
      }
    }
  }, [open, initialConfig]);

  const handleModeChange = (mode: ConfigMode) => {
    setConfigMode(mode);
    const timestamp = Date.now();

    switch (mode) {
      case 'different-tasks':
        setConfig({
          taskRefId: `fork-join-dynamic-${timestamp}`,
          name: 'Fork Join Dynamic',
          taskType: 'FORK_JOIN_DYNAMIC',
          dynamicForkTasksParam: 'dynamicTasks',
          dynamicForkTasksInputParamName: 'dynamicTasksInput',
          inputParameters: {
            dynamicTasks: [],
            dynamicTasksInput: {},
          },
        });
        setInputParametersText(
          JSON.stringify(
            {
              dynamicTasks: [],
              dynamicTasksInput: {},
            },
            null,
            2
          )
        );
        break;

      case 'same-task':
        setConfig({
          taskRefId: `fork-join-dynamic-${timestamp}`,
          name: 'Fork Join Dynamic',
          taskType: 'FORK_JOIN_DYNAMIC',
          inputParameters: {
            forkTaskType: 'HTTP',
            forkTaskInputs: [],
          },
        });
        setInputParametersText(
          JSON.stringify(
            {
              forkTaskType: 'HTTP',
              forkTaskInputs: [],
            },
            null,
            2
          )
        );
        break;

      case 'subworkflow':
        setConfig({
          taskRefId: `fork-join-dynamic-${timestamp}`,
          name: 'Fork Join Dynamic',
          taskType: 'FORK_JOIN_DYNAMIC',
          inputParameters: {
            forkTaskWorkflow: '',
            forkTaskInputs: [],
          },
        });
        setInputParametersText(
          JSON.stringify(
            {
              forkTaskWorkflow: '',
              forkTaskInputs: [],
            },
            null,
            2
          )
        );
        break;
    }
  };

  const renderModeAFields = () => (
    <>
      <div>
        <Label className="text-foreground">Dynamic Fork Tasks Parameter *</Label>
        <Input
          value={config.dynamicForkTasksParam || ''}
          onChange={(e) => setConfig({ ...config, dynamicForkTasksParam: e.target.value })}
          placeholder="e.g., dynamicTasks"
          className="mt-1 bg-card text-foreground border-border"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Key in inputParameters that lists tasks to run (one per fork)
        </p>
      </div>
      <div>
        <Label className="text-foreground">Dynamic Fork Tasks Input Param Name *</Label>
        <Input
          value={config.dynamicForkTasksInputParamName || ''}
          onChange={(e) => setConfig({ ...config, dynamicForkTasksInputParamName: e.target.value })}
          placeholder="e.g., dynamicTasksInput"
          className="mt-1 bg-card text-foreground border-border"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Key holding inputs for each task (map of taskRefName to inputs)
        </p>
      </div>
    </>
  );

  const renderModeBFields = () => (
    <div>
      <Label className="text-foreground">Fork Task Name</Label>
      <Input
        value={config.forkTaskName || ''}
        onChange={(e) => setConfig({ ...config, forkTaskName: e.target.value })}
        placeholder="e.g., myWorkerTask"
        className="mt-1 bg-card text-foreground border-border"
      />
      <p className="text-xs text-muted-foreground mt-1">
        Required only if forkTaskType is SIMPLE (worker task name)
      </p>
    </div>
  );

  const renderModeCFields = () => (
    <div>
      <Label className="text-foreground">Fork Task Workflow Version</Label>
      <Input
        type="number"
        value={config.forkTaskWorkflowVersion || ''}
        onChange={(e) =>
          setConfig({
            ...config,
            forkTaskWorkflowVersion: e.target.value ? Number.parseInt(e.target.value) : undefined,
          })
        }
        placeholder="e.g., 1"
        className="mt-1 bg-card text-foreground border-border"
      />
      <p className="text-xs text-muted-foreground mt-1">Optional workflow version</p>
    </div>
  );

  const getPlaceholderForMode = (mode: ConfigMode): string => {
    switch (mode) {
      case 'different-tasks':
        return JSON.stringify(
          {
            dynamicTasks: [
              { name: 'http', taskReferenceName: 'http_ref', type: 'HTTP' },
              { name: 'simple', taskReferenceName: 'simple_ref', type: 'SIMPLE' },
            ],
            dynamicTasksInput: {
              http_ref: { url: 'https://api.example.com' },
              simple_ref: { key: 'value' },
            },
          },
          null,
          2
        );
      case 'same-task':
        return JSON.stringify(
          {
            forkTaskType: 'HTTP',
            forkTaskInputs: [
              { url: 'https://api1.example.com' },
              { url: 'https://api2.example.com' },
            ],
          },
          null,
          2
        );
      case 'subworkflow':
        return JSON.stringify(
          {
            forkTaskWorkflow: 'mySubWorkflow',
            forkTaskWorkflowVersion: 1,
            forkTaskInputs: [{ param1: 'value1' }, { param1: 'value2' }],
          },
          null,
          2
        );
      default:
        return '{}';
    }
  };

  const customBasicFields = (
    <div className="space-y-4">
      {/* Mode Selection */}
      <Card className="p-4 bg-background border-border">
        <Label className="text-foreground mb-2 block">Configuration Mode *</Label>
        <Select value={configMode} onValueChange={(value) => handleModeChange(value as ConfigMode)}>
          <SelectTrigger className="bg-card text-foreground border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="different-tasks">A: Different Task Per Fork</SelectItem>
            <SelectItem value="same-task">B: Same Task Type for All Forks</SelectItem>
            <SelectItem value="subworkflow">C: Same Subworkflow for All Forks</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">
          {configMode === 'different-tasks' && 'Each fork runs a different task configuration'}
          {configMode === 'same-task' && 'All forks run the same task type with different inputs'}
          {configMode === 'subworkflow' &&
            'All forks run the same subworkflow with different inputs'}
        </p>
      </Card>

      {/* Mode-specific fields */}
      {configMode === 'different-tasks' && renderModeAFields()}
      {configMode === 'same-task' && renderModeBFields()}
      {configMode === 'subworkflow' && renderModeCFields()}

      {/* Input Parameters */}
      <div>
        <Label className="text-foreground">Input Parameters *</Label>
        <Textarea
          value={inputParametersText}
          onChange={(e) => setInputParametersText(e.target.value)}
          placeholder={getPlaceholderForMode(configMode)}
          className="mt-1 bg-card text-foreground border-border font-mono text-sm min-h-[200px]"
        />
        <p className="text-xs text-muted-foreground mt-1">
          JSON object with input parameters for the selected mode
        </p>
      </div>
    </div>
  );

  const handleSaveWithInputParameters = (finalConfig: ForkJoinDynamicConfig) => {
    let inputParameters: Record<string, unknown> = {};
    if (inputParametersText.trim()) {
      try {
        inputParameters = JSON.parse(inputParametersText);
      } catch {
        throw new Error('Invalid JSON in Input Parameters');
      }
    }

    // Build final config based on mode
    const savedConfig: ForkJoinDynamicConfig = {
      ...finalConfig,
      inputParameters,
    };

    if (configMode === 'different-tasks') {
      savedConfig.dynamicForkTasksParam = config.dynamicForkTasksParam;
      savedConfig.dynamicForkTasksInputParamName = config.dynamicForkTasksInputParamName;
    } else if (configMode === 'same-task') {
      if (config.forkTaskName) {
        savedConfig.forkTaskName = config.forkTaskName;
      }
    } else if (configMode === 'subworkflow') {
      if (config.forkTaskWorkflowVersion) {
        savedConfig.forkTaskWorkflowVersion = config.forkTaskWorkflowVersion;
      }
    }

    onSave(savedConfig);
  };

  // Helper functions for validation
  const validateDifferentTasks = (
    cfg: ForkJoinDynamicConfig,
    inputParams: Record<string, unknown>
  ): string | null => {
    if (!cfg.dynamicForkTasksParam || cfg.dynamicForkTasksParam.trim() === '') {
      return 'Dynamic Fork Tasks Parameter is required';
    }
    if (!cfg.dynamicForkTasksInputParamName || cfg.dynamicForkTasksInputParamName.trim() === '') {
      return 'Dynamic Fork Tasks Input Param Name is required';
    }
    if (!inputParams.dynamicTasks) {
      return 'Input Parameters must include "dynamicTasks" array';
    }
    if (!inputParams.dynamicTasksInput) {
      return 'Input Parameters must include "dynamicTasksInput" object';
    }
    return null;
  };

  const validateSameTask = (
    cfg: ForkJoinDynamicConfig,
    inputParams: Record<string, unknown>
  ): string | null => {
    if (!inputParams.forkTaskType) {
      return 'Input Parameters must include "forkTaskType"';
    }
    if (!inputParams.forkTaskInputs || !Array.isArray(inputParams.forkTaskInputs)) {
      return 'Input Parameters must include "forkTaskInputs" array';
    }
    if (
      inputParams.forkTaskType === 'SIMPLE' &&
      (!cfg.forkTaskName || cfg.forkTaskName.trim() === '')
    ) {
      return 'Fork Task Name is required when forkTaskType is SIMPLE';
    }
    return null;
  };

  const validateSubworkflow = (_inputParams: Record<string, unknown>): string | null => {
    if (!_inputParams.forkTaskWorkflow) {
      return 'Input Parameters must include "forkTaskWorkflow"';
    }
    if (!_inputParams.forkTaskInputs || !Array.isArray(_inputParams.forkTaskInputs)) {
      return 'Input Parameters must include "forkTaskInputs" array';
    }
    return null;
  };

  const validateConfig = (cfg: ForkJoinDynamicConfig): string | null => {
    // Parse input parameters
    let inputParams: Record<string, unknown> = {};
    if (inputParametersText.trim()) {
      try {
        inputParams = JSON.parse(inputParametersText);
      } catch {
        return 'Input Parameters must be valid JSON';
      }
    }

    switch (configMode) {
      case 'different-tasks':
        return validateDifferentTasks(cfg, inputParams);
      case 'same-task':
        return validateSameTask(cfg, inputParams);
      case 'subworkflow':
        return validateSubworkflow(inputParams);
      default:
        return null;
    }
  };

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSaveWithInputParameters}
      initialConfig={config}
      title="Create Dynamic Fork Operator"
      description="Execute multiple tasks dynamically in parallel - must be followed by a JOIN"
      buttonLabel="Save Operator"
      customBasicFields={customBasicFields}
      validateConfig={validateConfig}
    />
  );
}

