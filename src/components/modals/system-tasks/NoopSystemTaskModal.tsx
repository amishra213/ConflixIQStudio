import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';

export interface NoopSystemTaskConfig extends BaseTaskConfig {
  type: 'NOOP';
  name: string;
  taskReferenceName: string;
}

interface NoopSystemTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: NoopSystemTaskConfig) => void;
  readonly initialConfig?: NoopSystemTaskConfig;
}

export function NoopSystemTaskModal({ open, onOpenChange, onSave, initialConfig }: NoopSystemTaskModalProps) {
  const [config, setConfig] = useState<NoopSystemTaskConfig>({
    type: 'NOOP',
    name: '',
    taskReferenceName: '',
  });

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setConfig({ ...initialConfig });
      } else {
        setConfig({
          type: 'NOOP',
          name: '',
          taskReferenceName: '',
        });
      }
    }
  }, [open, initialConfig]);

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Create No-Op Task"
      description="Configure a no-op (no operation) task as a placeholder in your workflow. Passes through without performing any action."
      buttonLabel="Save Configuration"
    />
  );
}
