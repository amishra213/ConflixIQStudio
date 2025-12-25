import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

export interface StartWorkflowConfig extends BaseTaskConfig {
  name: string;
  taskReferenceName: string;
  taskType: 'START_WORKFLOW';
  description?: string;
  inputParameters: {
    startWorkflow: {
      name: string;
      version?: number;
      correlationId?: string;
      input?: Record<string, unknown>;
      taskToDomain?: Record<string, string>;
      workflowDef?: Record<string, unknown>;
    };
  };
}

interface StartWorkflowModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: StartWorkflowConfig) => void;
  readonly initialConfig?: StartWorkflowConfig | null;
}

export function StartWorkflowModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: StartWorkflowModalProps) {
  const [config, setConfig] = useState<StartWorkflowConfig>({
    name: 'start_workflow',
    taskReferenceName: 'start_workflow_ref',
    taskType: 'START_WORKFLOW',
    inputParameters: {
      startWorkflow: {
        name: '',
        version: 1,
        correlationId: '',
        input: {},
      },
    },
  });

  const [workflowInput, setWorkflowInput] = useState('{}');
  const [taskToDomain, setTaskToDomain] = useState('');
  const [workflowDef, setWorkflowDef] = useState('');

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setConfig(initialConfig);
        setWorkflowInput(
          JSON.stringify(initialConfig.inputParameters.startWorkflow.input || {}, null, 2)
        );
        setTaskToDomain(
          initialConfig.inputParameters.startWorkflow.taskToDomain
            ? JSON.stringify(initialConfig.inputParameters.startWorkflow.taskToDomain, null, 2)
            : ''
        );
        setWorkflowDef(
          initialConfig.inputParameters.startWorkflow.workflowDef
            ? JSON.stringify(initialConfig.inputParameters.startWorkflow.workflowDef, null, 2)
            : ''
        );
      } else {
        const timestamp = Date.now();
        const defaultConfig: StartWorkflowConfig = {
          name: 'start_workflow',
          taskReferenceName: `start_workflow_ref_${timestamp}`,
          taskType: 'START_WORKFLOW',
          inputParameters: {
            startWorkflow: {
              name: '',
              version: 1,
              correlationId: '',
              input: {},
            },
          },
        };
        setConfig(defaultConfig);
        setWorkflowInput('{}');
        setTaskToDomain('');
        setWorkflowDef('');
      }
    }
  }, [open, initialConfig]);

  const customBasicFields = (
    <div className="space-y-4">
      {/* Information Banner */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/30">
        <div className="flex items-start gap-3">
          <div className="text-blue-400 mt-0.5">ℹ️</div>
          <div className="flex-1">
            <p className="text-sm text-blue-300 font-medium mb-1">
              Asynchronous Workflow Execution
            </p>
            <p className="text-xs text-blue-200/80">
              The START_WORKFLOW task starts another workflow asynchronously. The current workflow
              proceeds to the next task without waiting for the started workflow to complete.
            </p>
          </div>
        </div>
      </Card>

      {/* Workflow Name */}
      <div>
        <Label className="text-foreground">Workflow Name *</Label>
        <Input
          value={config.inputParameters.startWorkflow.name}
          onChange={(e) =>
            setConfig({
              ...config,
              inputParameters: {
                startWorkflow: {
                  ...config.inputParameters.startWorkflow,
                  name: e.target.value,
                },
              },
            })
          }
          placeholder="e.g., my_target_workflow"
          className="mt-1 bg-card text-foreground border-border"
        />
        <p className="text-xs text-muted-foreground mt-1">Name of the workflow to start</p>
      </div>

      {/* Workflow Version */}
      <div>
        <Label className="text-foreground">Workflow Version</Label>
        <Input
          type="number"
          value={config.inputParameters.startWorkflow.version || ''}
          onChange={(e) =>
            setConfig({
              ...config,
              inputParameters: {
                startWorkflow: {
                  ...config.inputParameters.startWorkflow,
                  version: e.target.value ? Number.parseInt(e.target.value) : undefined,
                },
              },
            })
          }
          placeholder="e.g., 1"
          className="mt-1 bg-card text-foreground border-border"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Optional workflow version (defaults to latest if not specified)
        </p>
      </div>

      {/* Correlation ID */}
      <div>
        <Label className="text-foreground">Correlation ID</Label>
        <Input
          value={config.inputParameters.startWorkflow.correlationId || ''}
          onChange={(e) =>
            setConfig({
              ...config,
              inputParameters: {
                startWorkflow: {
                  ...config.inputParameters.startWorkflow,
                  correlationId: e.target.value,
                },
              },
            })
          }
          placeholder="e.g., order_12345"
          className="mt-1 bg-card text-foreground border-border"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Optional correlation ID for the started workflow
        </p>
      </div>

      {/* Workflow Input */}
      <div>
        <Label className="text-foreground">Workflow Input</Label>
        <Textarea
          value={workflowInput}
          onChange={(e) => setWorkflowInput(e.target.value)}
          placeholder='{\n  "someParameter": "someValue",\n  "anotherParameter": "anotherValue"\n}'
          className="mt-1 bg-card text-foreground border-border font-mono text-sm min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground mt-1">
          JSON object with input parameters for the workflow to be started
        </p>
      </div>

      {/* Task to Domain */}
      <div>
        <Label className="text-foreground">Task to Domain (Optional)</Label>
        <Textarea
          value={taskToDomain}
          onChange={(e) => setTaskToDomain(e.target.value)}
          placeholder='{\n  "taskName": "domainName"\n}'
          className="mt-1 bg-card text-foreground border-border font-mono text-sm min-h-[80px]"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Optional JSON object mapping task names to domain names
        </p>
      </div>

      {/* Workflow Definition */}
      <div>
        <Label className="text-foreground">Workflow Definition (Optional)</Label>
        <Textarea
          value={workflowDef}
          onChange={(e) => setWorkflowDef(e.target.value)}
          placeholder='{\n  "name": "workflow_name",\n  "version": 1,\n  "tasks": [...]\n}'
          className="mt-1 bg-card text-foreground border-border font-mono text-sm min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Optional inline workflow definition (if not registered in Conductor)
        </p>
      </div>
    </div>
  );

  const handleSaveWithInputParameters = (finalConfig: StartWorkflowConfig) => {
    // Parse workflow input
    let input: Record<string, unknown> = {};
    if (workflowInput.trim()) {
      try {
        input = JSON.parse(workflowInput);
      } catch {
        throw new Error('Invalid JSON in Workflow Input');
      }
    }

    // Parse taskToDomain if provided
    let taskToDomainObj: Record<string, string> | undefined = undefined;
    if (taskToDomain.trim()) {
      try {
        taskToDomainObj = JSON.parse(taskToDomain);
      } catch {
        throw new Error('Invalid JSON in Task to Domain');
      }
    }

    // Parse workflowDef if provided
    let workflowDefObj: Record<string, unknown> | undefined = undefined;
    if (workflowDef.trim()) {
      try {
        workflowDefObj = JSON.parse(workflowDef);
      } catch {
        throw new Error('Invalid JSON in Workflow Definition');
      }
    }

    // Build final config
    const savedConfig: StartWorkflowConfig = {
      ...finalConfig,
      inputParameters: {
        startWorkflow: {
          name: config.inputParameters.startWorkflow.name,
          version: config.inputParameters.startWorkflow.version,
          correlationId: config.inputParameters.startWorkflow.correlationId,
          input,
          ...(taskToDomainObj && { taskToDomain: taskToDomainObj }),
          ...(workflowDefObj && { workflowDef: workflowDefObj }),
        },
      },
    };

    onSave(savedConfig);
  };

  const validateConfig = (cfg: StartWorkflowConfig): string | null => {
    if (
      !cfg.inputParameters.startWorkflow.name ||
      cfg.inputParameters.startWorkflow.name.trim() === ''
    ) {
      return 'Workflow Name is required';
    }

    // Validate workflow input JSON
    if (workflowInput.trim()) {
      try {
        JSON.parse(workflowInput);
      } catch {
        return 'Workflow Input must be valid JSON';
      }
    }

    // Validate taskToDomain JSON if provided
    if (taskToDomain.trim()) {
      try {
        JSON.parse(taskToDomain);
      } catch {
        return 'Task to Domain must be valid JSON';
      }
    }

    // Validate workflowDef JSON if provided
    if (workflowDef.trim()) {
      try {
        JSON.parse(workflowDef);
      } catch {
        return 'Workflow Definition must be valid JSON';
      }
    }

    return null;
  };

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSaveWithInputParameters}
      initialConfig={config}
      title="Create Start Workflow Operator"
      description="Start another workflow asynchronously without waiting for completion"
      buttonLabel="Save Operator"
      customBasicFields={customBasicFields}
      validateConfig={validateConfig}
    />
  );
}

