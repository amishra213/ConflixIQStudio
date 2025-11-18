import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';

export interface HumanTaskConfig extends BaseTaskConfig {
  type: 'HUMAN';
  inputParameters: Record<string, any>;
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

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setConfig({
          type: 'HUMAN',
          name: initialConfig.name || 'human',
          taskReferenceName: initialConfig.taskReferenceName || 'human_ref',
          description: initialConfig.description,
          taskRefId: initialConfig.taskRefId,
          taskType: initialConfig.taskType,
          inputParameters: initialConfig.inputParameters || {},
        });
      } else {
        setConfig({
          type: 'HUMAN',
          name: 'human',
          taskReferenceName: 'human_ref',
          inputParameters: {},
        });
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

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Create Human Task"
      buttonLabel="Save Configuration"
      validateConfig={validateConfig}
      description="Human tasks pause the workflow and wait for external signals (COMPLETED or FAILED)"
    />
  );
}
