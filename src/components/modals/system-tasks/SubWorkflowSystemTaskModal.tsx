import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface SubWorkflowParam {
  name: string;
  version?: number;
  workflowDefinition?: Record<string, any>;
}

export interface SubWorkflowSystemTaskConfig {
  type: 'SUB_WORKFLOW';
  name: string;
  taskReferenceName: string;
  subWorkflowParam: SubWorkflowParam;
}

interface SubWorkflowSystemTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: SubWorkflowSystemTaskConfig) => void;
}

export function SubWorkflowSystemTaskModal({
  open,
  onOpenChange,
  onSave,
}: SubWorkflowSystemTaskModalProps) {
  const [config, setConfig] = useState<SubWorkflowSystemTaskConfig>({
    type: 'SUB_WORKFLOW',
    name: '',
    taskReferenceName: '',
    subWorkflowParam: {
      name: '',
      version: 1,
    },
  });

  const [workflowDefText, setWorkflowDefText] = useState('');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      setConfig({
        type: 'SUB_WORKFLOW',
        name: '',
        taskReferenceName: '',
        subWorkflowParam: {
          name: '',
          version: 1,
        },
      });
      setWorkflowDefText('');
      setJsonError('');
    }
  }, [open]);

  const handleSave = () => {
    if (!config.name || config.name.trim() === '') {
      setJsonError('Name is required');
      return;
    }
    if (!config.taskReferenceName || config.taskReferenceName.trim() === '') {
      setJsonError('Task Reference Name is required');
      return;
    }
    if (!config.subWorkflowParam.name || config.subWorkflowParam.name.trim() === '') {
      setJsonError('Sub Workflow Name is required');
      return;
    }

    let workflowDefinition: Record<string, any> | undefined = undefined;
    if (workflowDefText.trim()) {
      try {
        workflowDefinition = JSON.parse(workflowDefText);
      } catch {
        setJsonError('Invalid workflow definition JSON');
        return;
      }
    }

    const updatedConfig: SubWorkflowSystemTaskConfig = {
      ...config,
      subWorkflowParam: {
        ...config.subWorkflowParam,
        workflowDefinition,
      },
    };

    onSave(updatedConfig);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1f2e] border-[#2a3142] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create SUB_WORKFLOW System Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#0f1419] border-[#2a3142]">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="workflow">Workflow Config</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-3">
              <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
                <div className="space-y-3">
                  <div>
                    <Label className="text-white">Name *</Label>
                    <Input
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      placeholder="SUB_WORKFLOW task name"
                      className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task Reference Name *</Label>
                    <Input
                      value={config.taskReferenceName}
                      onChange={(e) => setConfig({ ...config, taskReferenceName: e.target.value })}
                      placeholder="e.g., sub_workflow_1"
                      className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="workflow" className="space-y-3">
              <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
                <div className="space-y-3">
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
                  </div>
                  <div>
                    <Label className="text-white">Workflow Definition (JSON)</Label>
                    <Textarea
                      value={workflowDefText}
                      onChange={(e) => setWorkflowDefText(e.target.value)}
                      placeholder='{"name": "subwf", "tasks": [...]}'
                      className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] font-mono text-sm min-h-[120px]"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Optional: Full workflow definition
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {jsonError && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{jsonError}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-cyan-500 text-white hover:bg-cyan-600"
          >
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
