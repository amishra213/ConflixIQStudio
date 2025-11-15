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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusIcon, Trash2Icon } from 'lucide-react';

export interface SimpleTaskDefinition {
  ownerApp?: string;
  createTime?: number;
  updateTime?: number;
  createdBy?: string;
  updatedBy?: string;
  name: string;
  description?: string;
  retryCount: number;
  timeoutSeconds: number;
  inputKeys?: string[];
  outputKeys?: string[];
  timeoutPolicy: 'RETRY' | 'ALERT' | 'FAIL';
  retryLogic: 'FIXED' | 'EXPONENTIAL_BACKOFF' | 'LINEAR_BACKOFF';
  retryDelaySeconds?: number;
  responseTimeoutSeconds?: number;
  concurrentExecLimit?: number;
  inputTemplate?: Record<string, any>;
  rateLimitPerFrequency?: number;
  rateLimitFrequencyInSeconds?: number;
  isolationGroupId?: string;
  executionNameSpace?: string;
  ownerEmail?: string;
  pollTimeoutSeconds?: number;
  backoffScaleFactor?: number;
}

export interface SimpleTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: SimpleTaskDefinition) => Promise<void>;
}

interface KeyValuePair {
  id: string;
  key: string;
}

export function SimpleTaskModal({
  open,
  onOpenChange,
  onSave,
}: SimpleTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<SimpleTaskDefinition>(() => ({
    name: '',
    description: '',
    retryCount: 10,
    timeoutSeconds: 0,
    inputKeys: [],
    outputKeys: [],
    timeoutPolicy: 'RETRY',
    retryLogic: 'FIXED',
    retryDelaySeconds: 0,
    responseTimeoutSeconds: 1,
    concurrentExecLimit: 0,
    rateLimitPerFrequency: 0,
    rateLimitFrequencyInSeconds: 0,
    pollTimeoutSeconds: 0,
    backoffScaleFactor: 1,
    inputTemplate: {},
  }));

  const [inputKeys, setInputKeys] = useState<KeyValuePair[]>([]);
  const [outputKeys, setOutputKeys] = useState<KeyValuePair[]>([]);
  const [inputTemplateJson, setInputTemplateJson] = useState('{}');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        name: `task-${timestamp}`,
        description: '',
        retryCount: 10,
        timeoutSeconds: 0,
        inputKeys: [],
        outputKeys: [],
        timeoutPolicy: 'RETRY',
        retryLogic: 'FIXED',
        retryDelaySeconds: 0,
        responseTimeoutSeconds: 1,
        concurrentExecLimit: 0,
        rateLimitPerFrequency: 0,
        rateLimitFrequencyInSeconds: 0,
        pollTimeoutSeconds: 0,
        backoffScaleFactor: 1,
        inputTemplate: {},
      });
      setInputKeys([]);
      setOutputKeys([]);
      setInputTemplateJson('{}');
      setJsonError('');
    }
  }, [open]);

  const validateJson = (value: string): boolean => {
    try {
      if (value.trim() === '') return true;
      JSON.parse(value);
      setJsonError('');
      return true;
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
      return false;
    }
  };

  const handleAddInputKey = () => {
    setInputKeys([
      ...inputKeys,
      { id: `${Date.now()}`, key: '' }
    ]);
  };

  const handleRemoveInputKey = (id: string) => {
    setInputKeys(inputKeys.filter(k => k.id !== id));
  };

  const handleInputKeyChange = (id: string, newValue: string) => {
    setInputKeys(inputKeys.map(k =>
      k.id === id ? { ...k, key: newValue } : k
    ));
  };

  const handleAddOutputKey = () => {
    setOutputKeys([
      ...outputKeys,
      { id: `${Date.now()}`, key: '' }
    ]);
  };

  const handleRemoveOutputKey = (id: string) => {
    setOutputKeys(outputKeys.filter(k => k.id !== id));
  };

  const handleOutputKeyChange = (id: string, newValue: string) => {
    setOutputKeys(outputKeys.map(k =>
      k.id === id ? { ...k, key: newValue } : k
    ));
  };

  const handleSave = async () => {
    if (!config.name || config.name.trim() === '') {
      setJsonError('Task name is required');
      return;
    }

    if (!validateJson(inputTemplateJson)) {
      return;
    }

    try {
      const inputTemplate = inputTemplateJson.trim() ? JSON.parse(inputTemplateJson) : {};
      const inputKeysList = inputKeys.filter(k => k.key.trim()).map(k => k.key.trim());
      const outputKeysList = outputKeys.filter(k => k.key.trim()).map(k => k.key.trim());

      const finalConfig: SimpleTaskDefinition = {
        ...config,
        inputTemplate,
        inputKeys: inputKeysList.length > 0 ? inputKeysList : undefined,
        outputKeys: outputKeysList.length > 0 ? outputKeysList : undefined,
      };

      setIsLoading(true);
      await onSave(finalConfig);
      onOpenChange(false);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Failed to save task definition');
    } finally {
      setIsLoading(false);
    }
  };

  const getJsonPreview = () => {
    const inputTemplate = inputTemplateJson.trim() ? JSON.parse(inputTemplateJson) : {};
    const inputKeysList = inputKeys.filter(k => k.key.trim()).map(k => k.key.trim());
    const outputKeysList = outputKeys.filter(k => k.key.trim()).map(k => k.key.trim());

    return {
      ...config,
      inputTemplate,
      inputKeys: inputKeysList.length > 0 ? inputKeysList : [],
      outputKeys: outputKeysList.length > 0 ? outputKeysList : [],
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-white">
            Create Task Definition
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs defaultValue="basic" className="space-y-4 py-4">
            <TabsList className="bg-[#0f1419]">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="keys">Input/Output Keys</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
              <TabsTrigger value="template">Input Template</TabsTrigger>
              <TabsTrigger value="json">JSON Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Basic Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Task Name *</Label>
                    <Input
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      placeholder="e.g., my_task_definition"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Description</Label>
                    <Textarea
                      value={config.description || ''}
                      onChange={(e) => setConfig({ ...config, description: e.target.value })}
                      placeholder="Describe what this task does"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142] min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Owner App</Label>
                      <Input
                        value={config.ownerApp || ''}
                        onChange={(e) => setConfig({ ...config, ownerApp: e.target.value })}
                        placeholder="e.g., my_app"
                        className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Owner Email</Label>
                      <Input
                        type="email"
                        value={config.ownerEmail || ''}
                        onChange={(e) => setConfig({ ...config, ownerEmail: e.target.value })}
                        placeholder="owner@example.com"
                        className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Execution Namespace</Label>
                      <Input
                        value={config.executionNameSpace || ''}
                        onChange={(e) => setConfig({ ...config, executionNameSpace: e.target.value })}
                        placeholder="e.g., my_namespace"
                        className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Isolation Group ID</Label>
                      <Input
                        value={config.isolationGroupId || ''}
                        onChange={(e) => setConfig({ ...config, isolationGroupId: e.target.value })}
                        placeholder="e.g., isolation_group_1"
                        className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="keys" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Input Keys</h3>
                    <p className="text-sm text-gray-400 mt-1">Define input parameter names</p>
                  </div>
                  <Button
                    onClick={handleAddInputKey}
                    className="bg-cyan-500 text-white hover:bg-cyan-600"
                    size="sm"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Key
                  </Button>
                </div>

                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                  {inputKeys.length === 0 ? (
                    <p className="text-sm text-gray-500 italic py-4">No input keys defined</p>
                  ) : (
                    inputKeys.map((key) => (
                      <Card key={key.id} className="p-3 bg-[#1a1f2e] border-[#2a3142]">
                        <div className="flex items-center gap-3">
                          <Input
                            value={key.key}
                            onChange={(e) => handleInputKeyChange(key.id, e.target.value)}
                            placeholder="e.g., userId"
                            className="flex-1 bg-[#0f1419] text-white border-[#2a3142] h-9 text-sm"
                          />
                          <Button
                            onClick={() => handleRemoveInputKey(key.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-500/10 hover:text-red-400 h-9 w-9 p-0"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Output Keys</h3>
                    <p className="text-sm text-gray-400 mt-1">Define output parameter names</p>
                  </div>
                  <Button
                    onClick={handleAddOutputKey}
                    className="bg-cyan-500 text-white hover:bg-cyan-600"
                    size="sm"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Key
                  </Button>
                </div>

                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                  {outputKeys.length === 0 ? (
                    <p className="text-sm text-gray-500 italic py-4">No output keys defined</p>
                  ) : (
                    outputKeys.map((key) => (
                      <Card key={key.id} className="p-3 bg-[#1a1f2e] border-[#2a3142]">
                        <div className="flex items-center gap-3">
                          <Input
                            value={key.key}
                            onChange={(e) => handleOutputKeyChange(key.id, e.target.value)}
                            placeholder="e.g., result"
                            className="flex-1 bg-[#0f1419] text-white border-[#2a3142] h-9 text-sm"
                          />
                          <Button
                            onClick={() => handleRemoveOutputKey(key.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-500/10 hover:text-red-400 h-9 w-9 p-0"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="policies" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Retry & Timeout Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Retry Count</Label>
                    <Input
                      type="number"
                      value={config.retryCount}
                      onChange={(e) => setConfig({ ...config, retryCount: Number.parseInt(e.target.value) || 0 })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Retry Delay (seconds)</Label>
                    <Input
                      type="number"
                      value={config.retryDelaySeconds || 0}
                      onChange={(e) => setConfig({ ...config, retryDelaySeconds: Number.parseInt(e.target.value) || 0 })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Timeout Seconds</Label>
                    <Input
                      type="number"
                      value={config.timeoutSeconds}
                      onChange={(e) => setConfig({ ...config, timeoutSeconds: Number.parseInt(e.target.value) || 0 })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Response Timeout (seconds)</Label>
                    <Input
                      type="number"
                      value={config.responseTimeoutSeconds || 1}
                      onChange={(e) => setConfig({ ...config, responseTimeoutSeconds: Number.parseInt(e.target.value) || 1 })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      min="1"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Poll Timeout (seconds)</Label>
                    <Input
                      type="number"
                      value={config.pollTimeoutSeconds || 0}
                      onChange={(e) => setConfig({ ...config, pollTimeoutSeconds: Number.parseInt(e.target.value) || 0 })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Timeout Policy</Label>
                    <Select
                      value={config.timeoutPolicy}
                      onValueChange={(value: any) => setConfig({ ...config, timeoutPolicy: value })}
                    >
                      <SelectTrigger className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectItem value="RETRY">RETRY</SelectItem>
                        <SelectItem value="ALERT">ALERT</SelectItem>
                        <SelectItem value="FAIL">FAIL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Retry Logic & Rate Limiting</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Retry Logic</Label>
                    <Select
                      value={config.retryLogic}
                      onValueChange={(value: any) => setConfig({ ...config, retryLogic: value })}
                    >
                      <SelectTrigger className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectItem value="FIXED">FIXED</SelectItem>
                        <SelectItem value="EXPONENTIAL_BACKOFF">EXPONENTIAL_BACKOFF</SelectItem>
                        <SelectItem value="LINEAR_BACKOFF">LINEAR_BACKOFF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Backoff Scale Factor</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={config.backoffScaleFactor || 1}
                      onChange={(e) => setConfig({ ...config, backoffScaleFactor: Number.parseFloat(e.target.value) || 1 })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      min="1"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Concurrent Execution Limit</Label>
                    <Input
                      type="number"
                      value={config.concurrentExecLimit || 0}
                      onChange={(e) => setConfig({ ...config, concurrentExecLimit: Number.parseInt(e.target.value) || 0 })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Rate Limit Per Frequency</Label>
                    <Input
                      type="number"
                      value={config.rateLimitPerFrequency || 0}
                      onChange={(e) => setConfig({ ...config, rateLimitPerFrequency: Number.parseInt(e.target.value) || 0 })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Rate Limit Frequency (seconds)</Label>
                    <Input
                      type="number"
                      value={config.rateLimitFrequencyInSeconds || 0}
                      onChange={(e) => setConfig({ ...config, rateLimitFrequencyInSeconds: Number.parseInt(e.target.value) || 0 })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      min="0"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="template" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Input Template (JSON)</h3>
                {jsonError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-400">{jsonError}</p>
                  </div>
                )}
                <Textarea
                  value={inputTemplateJson}
                  onChange={(e) => {
                    setInputTemplateJson(e.target.value);
                    validateJson(e.target.value);
                  }}
                  className="mt-2 font-mono text-sm bg-[#1a1f2e] text-white border-[#2a3142] min-h-[200px]"
                  placeholder='{"param1": {}, "param2": {}}'
                />
                <p className="text-xs text-gray-400 mt-3">
                  Define default or template values for input parameters. Each property represents a parameter key.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Complete Configuration JSON</h3>
                <pre className="text-xs text-gray-300 font-mono bg-[#1a1f2e] p-4 rounded-lg border border-[#2a3142] overflow-x-auto max-h-[500px] overflow-y-auto">
                  {JSON.stringify(getJsonPreview(), null, 2)}
                </pre>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="border-t border-[#2a3142] px-6 py-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!!jsonError || isLoading}
            className="bg-cyan-500 text-white hover:bg-cyan-600 font-medium disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Task Definition'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
