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
}

export function SubWorkflowModal({ open, onOpenChange, onSave }: SubWorkflowModalProps) {
  const [config, setConfig] = useState<SubWorkflowConfig>({
    taskRefId: 'subWorkflow-1',
    name: 'Sub Workflow',
    taskType: 'SUB_WORKFLOW',
    subWorkflowVersion: 1,
  });

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        taskRefId: `subWorkflow-${timestamp}`,
        name: 'Sub Workflow',
        taskType: 'SUB_WORKFLOW',
        subWorkflowVersion: 1,
      });
    }
  }, [open]);

  const customBasicFields = (
    <div className="space-y-3">
      <div>
        <Label className="text-white">Sub Workflow Name *</Label>
        <Input
          value={config.subWorkflowName || ''}
          onChange={(e) => setConfig({ ...config, subWorkflowName: e.target.value })}
          placeholder="Name of the sub-workflow to execute"
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
        />
        <p className="text-xs text-gray-400 mt-1">Name of the sub workflow to execute</p>
      </div>
      <div>
        <Label className="text-white">Sub Workflow Version</Label>
        <Input
          type="number"
          value={config.subWorkflowVersion || ''}
          onChange={(e) => setConfig({ ...config, subWorkflowVersion: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Version number"
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
        />
        <p className="text-xs text-gray-400 mt-1">Version of the sub workflow to execute</p>
      </div>
    </div>
  );

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Create Sub Workflow Operator"
      description="Execute a sub-workflow as part of your workflow"
      buttonLabel="Create Operator"
      customBasicFields={customBasicFields}
    />
  );
}
