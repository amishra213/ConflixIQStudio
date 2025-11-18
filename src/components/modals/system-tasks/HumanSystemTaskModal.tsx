import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

  const humanTab = {
    id: 'human',
    label: 'Human Task Info',
    content: (
      <div className="space-y-3" style={{ '--line-height': '1.5rem' } as React.CSSProperties}>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 mb-4">
          <p className="text-sm text-blue-300">
            <strong>Human Task:</strong> This task pauses the workflow and waits for an external
            signal. It remains IN_PROGRESS until marked as COMPLETED or FAILED by an external
            trigger.
          </p>
        </div>

        <div>
          <Label className="text-white">Task Name *</Label>
          <input
            type="text"
            value={config.name || ''}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            placeholder="human"
            className="w-full mt-1 px-3 py-2 bg-[#1a1f2e] text-white border border-[#2a3142] rounded text-sm"
          />
        </div>

        <div>
          <Label className="text-white">Task Reference Name *</Label>
          <input
            type="text"
            value={config.taskReferenceName || ''}
            onChange={(e) => setConfig({ ...config, taskReferenceName: e.target.value })}
            placeholder="human_ref"
            className="w-full mt-1 px-3 py-2 bg-[#1a1f2e] text-white border border-[#2a3142] rounded text-sm"
          />
        </div>

        <div>
          <Label className="text-white">Description</Label>
          <Textarea
            value={config.description || ''}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            placeholder="Describe what this human task does..."
            className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] min-h-[80px]"
          />
        </div>
      </div>
    ),
  };

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Create Human Task"
      buttonLabel="Save Configuration"
      customTabs={[humanTab]}
      validateConfig={validateConfig}
    />
  );
}
