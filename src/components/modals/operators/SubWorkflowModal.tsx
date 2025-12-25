import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface SubWorkflowConfig extends BaseTaskConfig {
  taskRefId: string;
  taskType: 'SUB_WORKFLOW';
  subWorkflowName?: string;
  subWorkflowVersion?: number;
}

interface SubWorkflowModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: SubWorkflowConfig) => void;
  readonly initialConfig?: SubWorkflowConfig | null;
}

export function SubWorkflowModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: SubWorkflowModalProps) {
  const [config, setConfig] = useState<SubWorkflowConfig>({
    taskRefId: 'subWorkflow-1',
    name: 'Sub Workflow',
    taskType: 'SUB_WORKFLOW',
    subWorkflowName: 'my_subworkflow',
    subWorkflowVersion: 1,
  });

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setConfig({ ...initialConfig });
      } else {
        const timestamp = Date.now();
        setConfig({
          taskRefId: `subWorkflow-${timestamp}`,
          name: 'Sub Workflow',
          taskType: 'SUB_WORKFLOW',
          subWorkflowName: 'my_subworkflow',
          subWorkflowVersion: 1,
        });
      }
    }
  }, [open, initialConfig]);

  const customBasicFields = (
    <div className="space-y-3">
      <div>
        <Label className="text-foreground">Sub Workflow Name *</Label>
        <Input
          value={config.subWorkflowName || ''}
          onChange={(e) => setConfig({ ...config, subWorkflowName: e.target.value })}
          placeholder="Name of the sub-workflow to execute"
          className="mt-1 bg-card text-foreground border-border"
        />
        <p className="text-xs text-muted-foreground mt-1">Name of the sub workflow to execute</p>
      </div>
      <div>
        <Label className="text-foreground">Sub Workflow Version</Label>
        <Input
          type="number"
          value={config.subWorkflowVersion || ''}
          onChange={(e) =>
            setConfig({
              ...config,
              subWorkflowVersion: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder="Version number"
          className="mt-1 bg-card text-foreground border-border"
        />
        <p className="text-xs text-muted-foreground mt-1">Version of the sub workflow to execute</p>
      </div>
    </div>
  );

  const validateConfig = (cfg: SubWorkflowConfig): string | null => {
    if (!cfg.subWorkflowName || cfg.subWorkflowName.trim() === '') {
      return 'Sub Workflow Name is required';
    }
    return null;
  };

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Create Sub Workflow Operator"
      description="Execute a sub-workflow as part of your workflow"
      buttonLabel="Save Operator"
      customBasicFields={customBasicFields}
      validateConfig={validateConfig}
    />
  );
}

