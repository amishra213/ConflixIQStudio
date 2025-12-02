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
import { JsonTextarea } from '@/components/ui/json-textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SimpleTaskDefinitionConfig {
  name: string;
  description?: string;
  retryCount?: number;
  retryLogic?: 'FIXED' | 'LINEAR' | 'EXPONENTIAL';
  retryDelaySeconds?: number;
  timeoutSeconds?: number;
  timeoutPolicy?: 'TIME_OUT_WF' | 'TIME_OUT_TASK' | 'RETRY';
  responseTimeoutSeconds?: number;
  ownerEmail?: string;
  inputKeys?: string[];
  outputKeys?: string[];
  rateLimitPerFrequency?: number;
  rateLimitFrequencyInSeconds?: number;
  pollTimeoutSeconds?: number;
  concurrentExecLimit?: number;
  queueName?: string;
  retryDelayMultiplier?: number;
  backoffRate?: number;
  isolationGroupId?: string;
  executionNameSpace?: string;
  priority?: number;
  ownerApp?: string;
}

interface SimpleTaskCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: SimpleTaskDefinitionConfig) => void;
  initialConfig?: SimpleTaskDefinitionConfig;
}

export function SimpleTaskCreateModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: Readonly<SimpleTaskCreateModalProps>) {
  const [config, setConfig] = useState<SimpleTaskDefinitionConfig>(() => ({
    name: '',
    description: '',
    retryCount: 3,
    retryLogic: 'FIXED',
    retryDelaySeconds: 5,
    timeoutSeconds: 120,
    timeoutPolicy: 'TIME_OUT_WF',
    responseTimeoutSeconds: 60,
    ownerEmail: '',
    inputKeys: [],
    outputKeys: [],
    rateLimitPerFrequency: 10,
    rateLimitFrequencyInSeconds: 1,
    pollTimeoutSeconds: 10,
    concurrentExecLimit: 50,
    queueName: '',
    retryDelayMultiplier: 1,
    backoffRate: 1,
    isolationGroupId: '',
    executionNameSpace: '',
    priority: 1,
    ownerApp: '',
  }));

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        // Load existing config for editing
        setConfig({
          name: initialConfig.name || '',
          description: initialConfig.description || '',
          retryCount: initialConfig.retryCount || 3,
          retryLogic: initialConfig.retryLogic || 'FIXED',
          retryDelaySeconds: initialConfig.retryDelaySeconds || 5,
          timeoutSeconds: initialConfig.timeoutSeconds || 120,
          timeoutPolicy: initialConfig.timeoutPolicy || 'TIME_OUT_WF',
          responseTimeoutSeconds: initialConfig.responseTimeoutSeconds || 60,
          ownerEmail: initialConfig.ownerEmail || '',
          inputKeys: initialConfig.inputKeys || [],
          outputKeys: initialConfig.outputKeys || [],
          rateLimitPerFrequency: initialConfig.rateLimitPerFrequency || 10,
          rateLimitFrequencyInSeconds: initialConfig.rateLimitFrequencyInSeconds || 1,
          pollTimeoutSeconds: initialConfig.pollTimeoutSeconds || 10,
          concurrentExecLimit: initialConfig.concurrentExecLimit || 50,
          queueName: initialConfig.queueName || '',
          retryDelayMultiplier: initialConfig.retryDelayMultiplier || 1,
          backoffRate: initialConfig.backoffRate || 1,
          isolationGroupId: initialConfig.isolationGroupId || '',
          executionNameSpace: initialConfig.executionNameSpace || '',
          priority: initialConfig.priority || 1,
          ownerApp: initialConfig.ownerApp || '',
        });
      } else {
        // Create new task with default values
        const timestamp = Date.now();
        setConfig({
          name: `new_simple_task_${timestamp}`,
          description: 'Worker task that sends email notifications',
          retryCount: 3,
          retryLogic: 'FIXED',
          retryDelaySeconds: 5,
          timeoutSeconds: 120,
          timeoutPolicy: 'TIME_OUT_WF',
          responseTimeoutSeconds: 60,
          ownerEmail: 'team-notifications@example.com',
          inputKeys: ['email', 'subject', 'body'],
          outputKeys: ['status', 'messageId'],
          rateLimitPerFrequency: 10,
          rateLimitFrequencyInSeconds: 1,
          pollTimeoutSeconds: 10,
          concurrentExecLimit: 50,
          queueName: 'email_queue',
          retryDelayMultiplier: 1,
          backoffRate: 1,
          isolationGroupId: 'email_group',
          executionNameSpace: 'default',
          priority: 1,
          ownerApp: 'notification-service',
        });
      }
    }
  }, [open, initialConfig]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof SimpleTaskDefinitionConfig, value: string | number) => {
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name: 'inputKeys' | 'outputKeys', value: string) => {
    setConfig((prev) => ({
      ...prev,
      [name]: value
        .split(',')
        .map((key) => key.trim())
        .filter(Boolean),
    }));
  };

  const handleSave = () => {
    if (!config.name || !config.ownerEmail) {
      alert('Please fill in all required fields (Name, Owner Email)');
      return;
    }

    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-white">
            {initialConfig ? 'Edit Task Definition' : 'Create Simple Task Definition'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs defaultValue="basic" className="space-y-4 py-4">
            <TabsList className="bg-[#0f1419]">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="keys">Input/Output Keys</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="json">JSON Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">General Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Task Name *</Label>
                    <Input
                      name="name"
                      value={config.name}
                      onChange={handleInputChange}
                      placeholder="e.g., send_email"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Owner Email *</Label>
                    <Input
                      name="ownerEmail"
                      type="email"
                      value={config.ownerEmail || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., team@example.com"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-white">Description</Label>
                    <Textarea
                      name="description"
                      value={config.description || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., Worker task that sends email notifications"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Owner App</Label>
                    <Input
                      name="ownerApp"
                      value={config.ownerApp || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., notification-service"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Priority</Label>
                    <Input
                      name="priority"
                      type="number"
                      value={config.priority}
                      onChange={(e) =>
                        handleSelectChange('priority', Number.parseInt(e.target.value) || 0)
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="keys" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Input/Output Keys</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Input Keys (comma-separated)</Label>
                    <Input
                      name="inputKeys"
                      value={config.inputKeys?.join(', ') || ''}
                      onChange={(e) => handleArrayChange('inputKeys', e.target.value)}
                      placeholder="e.g., email, subject, body"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Output Keys (comma-separated)</Label>
                    <Input
                      name="outputKeys"
                      value={config.outputKeys?.join(', ') || ''}
                      onChange={(e) => handleArrayChange('outputKeys', e.target.value)}
                      placeholder="e.g., status, messageId"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="policies" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Retry Policy</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Retry Count</Label>
                    <Input
                      name="retryCount"
                      type="number"
                      value={config.retryCount}
                      onChange={(e) =>
                        handleSelectChange('retryCount', Number.parseInt(e.target.value) || 0)
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Retry Logic</Label>
                    <Select
                      value={config.retryLogic}
                      onValueChange={(value: 'FIXED' | 'LINEAR' | 'EXPONENTIAL') =>
                        handleSelectChange('retryLogic', value)
                      }
                    >
                      <SelectTrigger className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectItem value="FIXED">FIXED</SelectItem>
                        <SelectItem value="LINEAR">LINEAR</SelectItem>
                        <SelectItem value="EXPONENTIAL">EXPONENTIAL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Retry Delay (seconds)</Label>
                    <Input
                      name="retryDelaySeconds"
                      type="number"
                      value={config.retryDelaySeconds}
                      onChange={(e) =>
                        handleSelectChange(
                          'retryDelaySeconds',
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Backoff Rate</Label>
                    <Input
                      name="backoffRate"
                      type="number"
                      step="0.1"
                      value={config.backoffRate}
                      onChange={(e) =>
                        handleSelectChange('backoffRate', Number.parseFloat(e.target.value) || 0)
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Timeout Policy</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Timeout (seconds)</Label>
                    <Input
                      name="timeoutSeconds"
                      type="number"
                      value={config.timeoutSeconds}
                      onChange={(e) =>
                        handleSelectChange('timeoutSeconds', Number.parseInt(e.target.value) || 0)
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Timeout Policy</Label>
                    <Select
                      value={config.timeoutPolicy}
                      onValueChange={(value: 'TIME_OUT_WF' | 'TIME_OUT_TASK' | 'RETRY') =>
                        handleSelectChange('timeoutPolicy', value)
                      }
                    >
                      <SelectTrigger className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectItem value="TIME_OUT_WF">TIME_OUT_WF</SelectItem>
                        <SelectItem value="TIME_OUT_TASK">TIME_OUT_TASK</SelectItem>
                        <SelectItem value="RETRY">RETRY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-white">Response Timeout (seconds)</Label>
                    <Input
                      name="responseTimeoutSeconds"
                      type="number"
                      value={config.responseTimeoutSeconds}
                      onChange={(e) =>
                        handleSelectChange(
                          'responseTimeoutSeconds',
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Rate Limiting</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Rate Limit Per Frequency</Label>
                    <Input
                      name="rateLimitPerFrequency"
                      type="number"
                      value={config.rateLimitPerFrequency}
                      onChange={(e) =>
                        handleSelectChange(
                          'rateLimitPerFrequency',
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Rate Limit Frequency (seconds)</Label>
                    <Input
                      name="rateLimitFrequencyInSeconds"
                      type="number"
                      value={config.rateLimitFrequencyInSeconds}
                      onChange={(e) =>
                        handleSelectChange(
                          'rateLimitFrequencyInSeconds',
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Execution Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Poll Timeout (seconds)</Label>
                    <Input
                      name="pollTimeoutSeconds"
                      type="number"
                      value={config.pollTimeoutSeconds}
                      onChange={(e) =>
                        handleSelectChange(
                          'pollTimeoutSeconds',
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Concurrent Execution Limit</Label>
                    <Input
                      name="concurrentExecLimit"
                      type="number"
                      value={config.concurrentExecLimit}
                      onChange={(e) =>
                        handleSelectChange(
                          'concurrentExecLimit',
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Queue Name</Label>
                    <Input
                      name="queueName"
                      value={config.queueName || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., email_queue"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Isolation Group ID</Label>
                    <Input
                      name="isolationGroupId"
                      value={config.isolationGroupId || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., email_group"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Execution Namespace</Label>
                    <Input
                      name="executionNameSpace"
                      value={config.executionNameSpace || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., default"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <Card
                className="p-6 bg-[#0f1419] border-[#2a3142]"
                style={{ '--line-height': '1.5rem' } as React.CSSProperties}
              >
                <h3 className="text-lg font-semibold text-white mb-4">Complete Definition JSON</h3>
                <JsonTextarea
                  value={JSON.stringify(config, null, 2)}
                  onChange={() => {}}
                  className="font-mono text-xs bg-[#1a1f2e] text-white min-h-[500px]"
                  readOnly
                />
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="border-t border-[#2a3142] px-6 py-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-cyan-500 text-white hover:bg-cyan-600 font-medium"
          >
            {initialConfig ? 'Update Task Definition' : 'Create Task Definition'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
