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
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusIcon, Trash2Icon } from 'lucide-react';

interface MapperTaskConfig {
  orgId: string;
  taskRefId: string;
  taskId: string;
  taskType: string;
  taskListDomain: string;
  sequenceNo: number;
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
  taskinputParameters: {
    MAPPER: Record<string, string>;
  };
}

interface MapperTaskCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: MapperTaskConfig) => void;
}

interface NameValuePair {
  id: string;
  name: string;
  value: string;
}

export function MapperTaskCreateModal({
  open,
  onOpenChange,
  onSave,
}: MapperTaskCreateModalProps) {
  const [config, setConfig] = useState<MapperTaskConfig>({
    orgId: 'TEST_ORG001',
    taskRefId: '',
    taskId: '',
    taskType: 'MAPPER',
    taskListDomain: 'ORDER-TASKLIST',
    sequenceNo: 1,
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
    taskinputParameters: {
      MAPPER: {}
    },
  });

  const [mapperPairs, setMapperPairs] = useState<NameValuePair[]>([
    { id: '1', name: '', value: '' }
  ]);
  const [executionRefs, setExecutionRefs] = useState<NameValuePair[]>([
    { id: '1', name: 'genericTaskName', value: 'codeExecuter_generic_task' }
  ]);

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      const defaultConfig = {
        orgId: 'TEST_ORG001',
        taskRefId: `mapper_task_${timestamp}`,
        taskId: `mapper-task-${timestamp}`,
        taskType: 'MAPPER',
        taskListDomain: 'ORDER-TASKLIST',
        sequenceNo: 1,
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
        taskinputParameters: {
          MAPPER: {}
        },
      };
      setConfig(defaultConfig);
      setMapperPairs([
        { id: '1', name: 'orderWrapperRequest', value: '${workflow.input.orderWrapperRequest}' }
      ]);
      setExecutionRefs([{ id: '1', name: 'genericTaskName', value: 'codeExecuter_generic_task' }]);
    }
  }, [open]);

  const handleAddPair = () => {
    setMapperPairs([
      ...mapperPairs,
      { id: `${Date.now()}`, name: '', value: '' }
    ]);
  };

  const handleRemovePair = (id: string) => {
    if (mapperPairs.length > 1) {
      setMapperPairs(mapperPairs.filter(pair => pair.id !== id));
    }
  };

  const handlePairChange = (id: string, field: 'name' | 'value', newValue: string) => {
    setMapperPairs(mapperPairs.map(pair => 
      pair.id === id ? { ...pair, [field]: newValue } : pair
    ));
  };

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

  const handleSave = () => {
    if (!config.orgId || !config.taskRefId || !config.taskId || !config.taskListDomain || !config.executionNamespace) {
      alert('Please fill in all required fields (Organization ID, Task Reference ID, Task ID, Task List Domain, Execution Namespace)');
      return;
    }

    const invalidPairs = mapperPairs.filter(pair => pair.name.trim() === '' || pair.value.trim() === '');
    if (invalidPairs.length > 0) {
      alert('Please fill in all mapper parameter names and values, or remove empty pairs');
      return;
    }

    const invalidRefs = executionRefs.filter(ref => ref.name.trim() === '' || ref.value.trim() === '');
    if (invalidRefs.length > 0) {
      alert('Please fill in all execution reference names and values, or remove empty references');
      return;
    }

    const mapperObject: Record<string, string> = {};
    mapperPairs.forEach(pair => {
      if (pair.name.trim() && pair.value.trim()) {
        mapperObject[pair.name.trim()] = pair.value.trim();
      }
    });

    const executionReferences: Record<string, string> = {};
    executionRefs.forEach(ref => {
      if (ref.name.trim() && ref.value.trim()) {
        executionReferences[ref.name.trim()] = ref.value.trim();
      }
    });

    const finalConfig: MapperTaskConfig = {
      orgId: config.orgId,
      taskRefId: config.taskRefId,
      taskId: config.taskId,
      taskType: config.taskType,
      taskListDomain: config.taskListDomain,
      sequenceNo: config.sequenceNo,
      executionNamespace: config.executionNamespace,
      executionReferences,
      retryPolicy: config.retryPolicy,
      timeoutPolicy: config.timeoutPolicy,
      taskinputParameters: {
        MAPPER: mapperObject
      },
    };

    onSave(finalConfig);
    onOpenChange(false);
  };

  const getJsonPreview = () => {
    const mapperObject: Record<string, string> = {};
    mapperPairs.forEach(pair => {
      if (pair.name.trim() && pair.value.trim()) {
        mapperObject[pair.name.trim()] = pair.value.trim();
      }
    });

    const executionReferences: Record<string, string> = {};
    executionRefs.forEach(ref => {
      if (ref.name.trim() && ref.value.trim()) {
        executionReferences[ref.name.trim()] = ref.value.trim();
      }
    });

    return {
      orgId: config.orgId,
      taskRefId: config.taskRefId,
      taskId: config.taskId,
      taskType: config.taskType,
      taskListDomain: config.taskListDomain,
      sequenceNo: config.sequenceNo,
      executionNamespace: config.executionNamespace,
      executionReferences,
      retryPolicy: config.retryPolicy,
      timeoutPolicy: config.timeoutPolicy,
      taskinputParameters: {
        MAPPER: mapperObject
      }
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-white">
            Create Mapper Task
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs defaultValue="basic" className="space-y-4 py-4">
            <TabsList className="bg-[#0f1419]">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="execution">Execution</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
              <TabsTrigger value="mapping">Mapper Parameters</TabsTrigger>
              <TabsTrigger value="json">JSON Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Basic Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Organization ID *</Label>
                    <Input
                      value={config.orgId}
                      onChange={(e) => setConfig({ ...config, orgId: e.target.value })}
                      placeholder="e.g., TEST_ORG001"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task Reference ID *</Label>
                    <Input
                      value={config.taskRefId}
                      onChange={(e) => setConfig({ ...config, taskRefId: e.target.value })}
                      placeholder="e.g., order2customer"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task ID *</Label>
                    <Input
                      value={config.taskId}
                      onChange={(e) => setConfig({ ...config, taskId: e.target.value })}
                      placeholder="e.g., order2customer-mapper-1"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task Type</Label>
                    <Input
                      value={config.taskType}
                      disabled
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142] opacity-60"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task List Domain *</Label>
                    <Input
                      value={config.taskListDomain}
                      onChange={(e) => setConfig({ ...config, taskListDomain: e.target.value })}
                      placeholder="e.g., ORDER-TASKLIST"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Sequence Number</Label>
                    <Input
                      type="number"
                      value={config.sequenceNo}
                      onChange={(e) => setConfig({ ...config, sequenceNo: parseInt(e.target.value) || 1 })}
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
                            retryInterval: parseInt(e.target.value) || 60,
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
                            retryCount: parseInt(e.target.value) || 3,
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
                    <Select
                      value={config.timeoutPolicy.timeoutAction}
                      onValueChange={(value) =>
                        setConfig({
                          ...config,
                          timeoutPolicy: {
                            ...config.timeoutPolicy,
                            timeoutAction: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectItem value="RETRY">RETRY</SelectItem>
                        <SelectItem value="FAIL">FAIL</SelectItem>
                        <SelectItem value="ALERT_ONLY">ALERT_ONLY</SelectItem>
                      </SelectContent>
                    </Select>
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
                            responseTimeoutSeconds: parseInt(e.target.value) || 600,
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
                            timeoutInterval: parseInt(e.target.value) || 1200,
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
                            pollTimeoutSeconds: parseInt(e.target.value) || 600,
                          },
                        })
                      }
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="mapping" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Mapper Parameters (Name-Value Pairs)</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Define mapping parameters as key-value pairs
                    </p>
                  </div>
                  <Button
                    onClick={handleAddPair}
                    className="bg-cyan-500 text-white hover:bg-cyan-600"
                    size="sm"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Parameter
                  </Button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {mapperPairs.map((pair) => (
                    <Card key={pair.id} className="p-4 bg-[#1a1f2e] border-[#2a3142]">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-white text-xs mb-2 block">
                              Parameter Name *
                            </Label>
                            <Input
                              value={pair.name}
                              onChange={(e) => handlePairChange(pair.id, 'name', e.target.value)}
                              placeholder="e.g., orderWrapperRequest"
                              className="bg-[#0f1419] text-white border-[#2a3142] h-9 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-xs mb-2 block">
                              Parameter Value *
                            </Label>
                            <Input
                              value={pair.value}
                              onChange={(e) => handlePairChange(pair.id, 'value', e.target.value)}
                              placeholder="e.g., ${workflow.input.orderWrapperRequest}"
                              className="bg-[#0f1419] text-white border-[#2a3142] h-9 text-sm font-mono"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRemovePair(pair.id)}
                          variant="ghost"
                          size="sm"
                          disabled={mapperPairs.length === 1}
                          className="text-red-500 hover:bg-red-500/10 hover:text-red-400 mt-6 h-9 w-9 p-0"
                          title="Delete parameter"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">💡 Mapper Tips</h4>
                  <ul className="text-xs text-blue-300 space-y-1 list-disc list-inside">
                    <li>Use <code className="text-cyan-400 bg-cyan-500/10 px-1 rounded">${'${workflow.input.field}'}</code> to reference workflow inputs</li>
                    <li>Use <code className="text-cyan-400 bg-cyan-500/10 px-1 rounded">${'${taskName.output.field}'}</code> to reference previous task outputs</li>
                    <li>Each key-value pair maps input data to the format expected by downstream tasks</li>
                    <li>The mapper task transforms data without executing custom code</li>
                  </ul>
                </div>
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
            className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-cyan-500 text-white hover:bg-cyan-600 font-medium"
          >
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
