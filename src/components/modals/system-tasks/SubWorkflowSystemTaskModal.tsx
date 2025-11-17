import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { JsonTextarea } from '@/components/ui/json-textarea';
import { Card } from '@/components/ui/card';

export interface SubWorkflowParam {
  name: string;
  version?: number;
  workflowDefinition?: Record<string, any>;
}

export interface SubWorkflowSystemTaskConfig extends BaseTaskConfig {
  type: 'SUB_WORKFLOW';
  name: string;
  taskReferenceName: string;
  subWorkflowParam: SubWorkflowParam;
}

interface SubWorkflowSystemTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: SubWorkflowSystemTaskConfig) => void;
  readonly initialConfig?: SubWorkflowSystemTaskConfig | null;
}

export function SubWorkflowSystemTaskModal({ open, onOpenChange, onSave, initialConfig }: SubWorkflowSystemTaskModalProps) {
  const [config, setConfig] = useState<SubWorkflowSystemTaskConfig>({
    type: 'SUB_WORKFLOW',
    name: '',
    taskReferenceName: '',
    subWorkflowParam: {
      name: 'my_subworkflow',
      version: 1,
    },
  });

  const [workflowDefText, setWorkflowDefText] = useState('');

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setConfig({ ...initialConfig });
        setWorkflowDefText(initialConfig.subWorkflowParam.workflowDefinition
          ? JSON.stringify(initialConfig.subWorkflowParam.workflowDefinition, null, 2)
          : '');
      } else {
        setConfig({
          type: 'SUB_WORKFLOW',
          name: '',
          taskReferenceName: '',
          subWorkflowParam: {
            name: 'my_subworkflow',
            version: 1,
          },
        });
        setWorkflowDefText('');
      }
    }
  }, [open, initialConfig]);

  const customBasicFields = (
    <>
      <div>
        <Label className="text-white">Sub Workflow Name *</Label>
        <Input
          value={config.subWorkflowParam.name}
          onChange={(e) =>
            setConfig({
              ...config,
              subWorkflowParam: { ...config.subWorkflowParam, name: e.target.value },
            })
          }
          placeholder="Name of the sub-workflow to execute"
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
        />
      </div>
      <div>
        <Label className="text-white">Version</Label>
        <Input
          type="number"
          value={config.subWorkflowParam.version || 1}
          onChange={(e) =>
            setConfig({
              ...config,
              subWorkflowParam: {
                ...config.subWorkflowParam,
                version: Number(e.target.value),
              },
            })
          }
          placeholder="1"
          className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
        />
        <p className="text-xs text-gray-400 mt-1">Sub-workflow version number</p>
      </div>
    </>
  );

  const workflowConfigTab = {
    id: 'workflow',
    label: 'Workflow Definition',
    content: (
      <Card className="p-6 bg-[#0f1419] border-[#2a3142]" style={{ '--line-height': '1.5rem' } as React.CSSProperties}>
        <div className="space-y-3">
          <div>
            <Label className="text-white">Workflow Definition (JSON)</Label>
            <JsonTextarea
              value={workflowDefText}
              onChange={(value) => setWorkflowDefText(value)}
              placeholder='{"name": "subwf", "tasks": [...]}'
              className="mt-1 bg-[#1a1f2e] text-white font-mono text-sm min-h-[300px]"
            />
            <p className="text-xs text-gray-400 mt-1">
              Optional: Inline workflow definition (alternative to referencing by name/version)
            </p>
          </div>
        </div>
      </Card>
    ),
  };

  const handleSaveWithWorkflow = (finalConfig: SubWorkflowSystemTaskConfig) => {
    let workflowDefinition: Record<string, any> | undefined = undefined;
    if (workflowDefText.trim()) {
      try {
        workflowDefinition = JSON.parse(workflowDefText);
      } catch {
        // Invalid JSON - ignore workflow definition
        workflowDefinition = undefined;
      }
    }

    const updatedConfig: SubWorkflowSystemTaskConfig = {
      ...finalConfig,
      subWorkflowParam: {
        ...finalConfig.subWorkflowParam,
        name: config.subWorkflowParam.name,
        version: config.subWorkflowParam.version,
        workflowDefinition,
      },
    };

    onSave(updatedConfig);
  };

  const validateConfig = (): string | null => {
    if (!config.subWorkflowParam.name || config.subWorkflowParam.name.trim() === '') {
      return 'Sub Workflow Name is required';
    }
    return null;
  };

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSaveWithWorkflow}
      initialConfig={config}
      title="Create Sub-Workflow Task"
      description="Execute a nested workflow as part of the parent workflow"
      buttonLabel="Save Configuration"
      customBasicFields={customBasicFields}
      customTabs={[workflowConfigTab]}
      validateConfig={validateConfig}
    />
  );
}
