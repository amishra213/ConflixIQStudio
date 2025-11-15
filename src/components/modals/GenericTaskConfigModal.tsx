import { useState, useEffect } from 'react';
import {PlusIcon, Trash2Icon } from 'lucide-react';
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
import { Node } from 'reactflow';

interface GenericTaskConfig {
  orgId: string;
  taskRefId: string;
  taskId: string;
  taskType: string;
  taskListDomain: string;
  executionNamespace: string;
  executionReferences: Record<string, string>;
  retryPolicy: {
    retryInterval: number;
    retryCount: number;
  };
  timeoutPolicy: {
    timeoutAction: string;
    responseTimeoutSeconds: number;
    timeoutInterval: number;
    pollTimeoutSeconds: number;
  };
  sequenceNo: number;
  taskinputParameters: any;
}

interface NameValuePair {
  id: string;
  name: string;
  value: string;
}

interface GenericTaskConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: Node | null;
  onSave: (config: GenericTaskConfig) => void;
}

export function GenericTaskConfigModal({
  open,
  onOpenChange,
  node,
  onSave,
}: GenericTaskConfigModalProps) {
  const [config, setConfig] = useState<GenericTaskConfig>({
    orgId: 'ORG001',
    taskRefId: '',
    taskId: '',
    taskType: 'GENERIC',
    taskListDomain: 'DEFAULT-TASKLIST',
    executionNamespace: 'ORDER',
    executionReferences: {},
    retryPolicy: {
      retryInterval: 60,
      retryCount: 3,
    },
    timeoutPolicy: {
      timeoutAction: 'RETRY',
      responseTimeoutSeconds: 600,
      timeoutInterval: 1200,
      pollTimeoutSeconds: 600,
    },
    sequenceNo: 1,
    taskinputParameters: {},
  });

  const [inputParamsJson, setInputParamsJson] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [executionRefs, setExecutionRefs] = useState<NameValuePair[]>([
    { id: '1', name: 'genericTaskName', value: 'codeExecuter_generic_task' }
  ]);

  useEffect(() => {
    if (open) {
      const initialConfig = node?.data?.config; // Use node's config if available
      
      if (initialConfig) {
        setConfig(initialConfig);
        setInputParamsJson(JSON.stringify(initialConfig.taskinputParameters, null, 2));
        const execRefs = Object.entries(initialConfig.executionReferences).map(([name, value], index) => ({
          id: `${Date.now()}-exec-${index}`,
          name,
          value
        }));
        setExecutionRefs(execRefs.length > 0 ? execRefs : [{ id: '1', name: 'genericTaskName', value: 'codeExecuter_generic_task' }]);
      } else {
        // Default config for new task
        const newConfig = {
          ...config,
          taskRefId: node?.id || `generic_task_${Date.now()}`,
          taskId: node?.data?.taskName || `generic-task-${Date.now()}`,
          taskType: node?.data?.taskType || 'GENERIC',
          sequenceNo: node?.data?.sequenceNo || 1,
        };
        setConfig(newConfig);
        setInputParamsJson(JSON.stringify({
          order: {
            orderType: '${workflow.input.orderType}',
            hasReservation: 'Y',
            shipNode: '${workflow.input.shipNode}',
            orderNo: 'Order-1',
          },
        }, null, 2));
        setExecutionRefs([{ id: '1', name: 'genericTaskName', value: 'codeExecuter_generic_task' }]);
      }
      setJsonError('');
    }
  }, [open, node]);

  const handleAddExecutionRef = () => {
    setExecutionRefs([
      ...executionRefs,
      { id: `${Date.now()}`, name: '', value: '' }
    ]);
  };

  const handleRemoveExecutionRef = (id: string) => {
    if (executionRefs.length > 1) {
      setExecutionRefs(executionRefs.filter(ref => ref.id !== id));
    }
  };

  const handleExecutionRefChange = (id: string, field: 'name' | 'value', newValue: string) => {
    setExecutionRefs(executionRefs.map(ref => 
      ref.id === id ? { ...ref, [field]: newValue } : ref
    ));
  };

  const validateJson = (value: string) => {
    try {
      if (value.trim() === '') {
        setJsonError('');
        return true;
      }
      JSON.parse(value);
      setJsonError('');
      return true;
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
      return false;
    }
  };

  const handleInputParamsChange = (value: string) => {
    setInputParamsJson(value);
    validateJson(value);
  };

  const handleSave = () => {
    if (!validateJson(inputParamsJson)) {
      return;
    }

    const invalidRefs = executionRefs.filter(ref => ref.name.trim() === '' || ref.value.trim() === '');
    if (invalidRefs.length > 0) {
      alert('Please fill in all execution reference names and values, or remove empty references');
      return;
    }

    try {
      const parsedParams = inputParamsJson.trim() ? JSON.parse(inputParamsJson) : {};
      const executionReferences: Record<string, string> = {};
      executionRefs.forEach(ref => {
        if (ref.name.trim() && ref.value.trim()) {
          executionReferences[ref.name.trim()] = ref.value.trim();
        }
      });

      const finalConfig = {
        ...config,
        executionReferences,
        taskinputParameters: parsedParams,
      };

      onSave(finalConfig);
      onOpenChange(false);
    } catch (error) {
      setJsonError('Failed to parse input parameters JSON or execution references');
    }
  };

  const getJsonPreview = () => {
    const parsedParams = inputParamsJson.trim() ? JSON.parse(inputParamsJson) : {};
    const executionReferences: Record<string, string> = {};
    executionRefs.forEach(ref => {
      if (ref.name.trim() && ref.value.trim()) {
        executionReferences[ref.name.trim()] = ref.value.trim();
      }
    });

    return {
      ...config,
      executionReferences,
      taskinputParameters: parsedParams,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-white">
            Configure Generic Task
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-2">
            Task: <span className="text-cyan-400 font-medium">{node?.data?.taskName || config.taskId}</span>
            {' • '}
            Sequence: <span className="text-cyan-400 font-medium">#{node?.data?.sequenceNo || config.sequenceNo}</span>
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs defaultValue="basic" className="space-y-4 py-4">
            <TabsList className="bg-[#0f1419]">
              <TabsTrigger value="basic" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="execution" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                Execution
              </TabsTrigger>
              <TabsTrigger value="policies" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                Policies
              </TabsTrigger>
              <TabsTrigger value="input" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                Input Parameters
              </TabsTrigger>
              <TabsTrigger value="json" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                JSON Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Basic Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Organization ID</Label>
                    <Input
                      value={config.orgId}
                      onChange={(e) => setConfig({ ...config, orgId: e.target.value })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task Reference ID</Label>
                    <Input
                      value={config.taskRefId}
                      onChange={(e) => setConfig({ ...config, taskRefId: e.target.value })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task ID</Label>
                    <Input
                      value={config.taskId}
                      onChange={(e) => setConfig({ ...config, taskId: e.target.value })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task Type</Label>
                    <Input
                      value={config.taskType}
                      disabled
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Sequence Number</Label>
                    <Input
                      value={config.sequenceNo}
                      disabled
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="execution" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Execution Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Task List Domain *</Label>
                    <Input
                      value={config.taskListDomain}
                      onChange={(e) => setConfig({ ...config, taskListDomain: e.target.value })}
                      placeholder="e.g., DEFAULT-TASKLIST"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Execution Namespace *</Label>
                    <Input
                      value={config.executionNamespace}
                      onChange={(e) => setConfig({ ...config, executionNamespace: e.target.value })}
                      placeholder="e.g., ORDER"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Execution References</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Define execution reference attributes as key-value pairs
                    </p>
                  </div>
                  <Button
                    onClick={handleAddExecutionRef}
                    className="bg-cyan-500 text-white hover:bg-cyan-600"
                    size="sm"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Reference
                  </Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {executionRefs.map((ref) => (
                    <Card key={ref.id} className="p-4 bg-[#1a1f2e] border-[#2a3142]">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-white text-xs mb-2 block">
                              Attribute Name *
                            </Label>
                            <Input
                              value={ref.name}
                              onChange={(e) => handleExecutionRefChange(ref.id, 'name', e.target.value)}
                              placeholder="e.g., genericTaskName"
                              className="bg-[#0f1419] text-white border-[#2a3142] h-9 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-xs mb-2 block">
                              Attribute Value *
                            </Label>
                            <Input
                              value={ref.value}
                              onChange={(e) => handleExecutionRefChange(ref.id, 'value', e.target.value)}
                              placeholder="e.g., codeExecuter_generic_task"
                              className="bg-[#0f1419] text-white border-[#2a3142] h-9 text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRemoveExecutionRef(ref.id)}
                          variant="ghost"
                          size="sm"
                          disabled={executionRefs.length === 1}
                          className="text-red-500 hover:bg-red-500/10 hover:text-red-400 mt-6 h-9 w-9 p-0"
                          title="Delete reference"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                  <p className="text-xs text-blue-300">
                    <strong className="text-blue-400">Common attributes:</strong> genericTaskName, workerTaskName, taskDefinition, etc.
                  </p>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="policies" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Retry Policy</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Retry Interval (seconds)</Label>
                    <Input
                      type="number"
                      value={config.retryPolicy.retryInterval}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          retryPolicy: {
                            ...config.retryPolicy,
                            retryInterval: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Retry Count</Label>
                    <Input
                      type="number"
                      value={config.retryPolicy.retryCount}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          retryPolicy: {
                            ...config.retryPolicy,
                            retryCount: parseInt(e.target.value) || 0,
                          },
                        })
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
                    <Label className="text-white">Timeout Action</Label>
                    <Input
                      value={config.timeoutPolicy.timeoutAction}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          timeoutPolicy: {
                            ...config.timeoutPolicy,
                            timeoutAction: e.target.value,
                          },
                        })
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Response Timeout (seconds)</Label>
                    <Input
                      type="number"
                      value={config.timeoutPolicy.responseTimeoutSeconds}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          timeoutPolicy: {
                            ...config.timeoutPolicy,
                            responseTimeoutSeconds: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Timeout Interval (seconds)</Label>
                    <Input
                      type="number"
                      value={config.timeoutPolicy.timeoutInterval}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          timeoutPolicy: {
                            ...config.timeoutPolicy,
                            timeoutInterval: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Poll Timeout (seconds)</Label>
                    <Input
                      type="number"
                      value={config.timeoutPolicy.pollTimeoutSeconds}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          timeoutPolicy: {
                            ...config.timeoutPolicy,
                            pollTimeoutSeconds: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="input" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Task Input Parameters (JSON)</h3>
                
                {jsonError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-400">{jsonError}</p>
                  </div>
                )}

                <Textarea
                  value={inputParamsJson}
                  onChange={(e) => handleInputParamsChange(e.target.value)}
                  className="font-mono text-sm bg-[#1a1f2e] text-white border-[#2a3142] min-h-[300px]"
                  placeholder='{\n  "order": {\n    "orderType": "${workflow.input.orderType}"\n  }\n}'
                />
              </Card>
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Complete Configuration JSON</h3>
                <pre className="text-xs text-gray-300 font-mono bg-[#1a1f2e] p-4 rounded-lg border border-[#2a3142] overflow-x-auto max-h-[500px] overflow-y-auto">
                  {JSON.stringify(
                    {
                      ...config,
                      taskinputParameters: inputParamsJson.trim()
                        ? JSON.parse(inputParamsJson)
                        : {},
                    },
                    null,
                    2
                  )}
                </pre>
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
            disabled={!!jsonError}
            className="bg-cyan-500 text-white hover:bg-cyan-600 font-medium disabled:opacity-50"
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
