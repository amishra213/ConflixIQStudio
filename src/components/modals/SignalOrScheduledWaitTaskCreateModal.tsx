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

interface SignalOrScheduledWaitTaskConfig {
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
  taskinputParameters: Record<string, string>;
}

interface SignalOrScheduledWaitTaskCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: SignalOrScheduledWaitTaskConfig) => void;
}

interface InputParameter {
  id: string;
  name: string;
  value: string;
}

export function SignalOrScheduledWaitTaskCreateModal({
  open,
  onOpenChange,
  onSave,
}: SignalOrScheduledWaitTaskCreateModalProps) {
  const [config, setConfig] = useState<SignalOrScheduledWaitTaskConfig>({
    orgId: 'ORG001',
    taskRefId: '',
    taskId: '',
    taskType: 'SIGNAL_OR_SCHEDULED_WAIT',
    taskListDomain: 'BOPUS-TASKLIST',
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
    taskinputParameters: {},
  });

  const [inputParameters, setInputParameters] = useState<InputParameter[]>([
    { id: '1', name: 'pauseDuration', value: '${workflow.input.pauseDuration}' },
    { id: '2', name: 'pauseDurationUnits', value: '${workflow.input.pauseDurationUnits}' }
  ]);

  const [executionRefs, setExecutionRefs] = useState<InputParameter[]>([
    { id: '1', name: 'genericTaskName', value: 'codeExecuter_generic_task' }
  ]);

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      const defaultConfig = {
        orgId: 'ORG001',
        taskRefId: `signalscheduledwait-${timestamp}`,
        taskId: `signal-scheduled-wait-${timestamp}`,
        taskType: 'SIGNAL_OR_SCHEDULED_WAIT', // Corrected task type
        taskListDomain: 'BOPUS-TASKLIST',
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
        taskinputParameters: {},
      };
      setConfig(defaultConfig);
      setInputParameters([
        { id: '1', name: 'pauseDuration', value: '${workflow.input.pauseDuration}' },
        { id: '2', name: 'pauseDurationUnits', value: '${workflow.input.pauseDurationUnits}' }
      ]);
      setExecutionRefs([
        { id: '1', name: 'genericTaskName', value: 'codeExecuter_generic_task' }
      ]);
    }
  }, [open]);

  const handleAddParameter = () => {
    setInputParameters([
      ...inputParameters,
      { id: `${Date.now()}`, name: '', value: '' }
    ]);
  };

  const handleRemoveParameter = (id: string) => {
    if (inputParameters.length > 1) {
      setInputParameters(inputParameters.filter(param => param.id !== id));
    }
  };

  const handleParameterChange = (id: string, field: 'name' | 'value', newValue: string) => {
    setInputParameters(inputParameters.map(param => 
      param.id === id ? { ...param, [field]: newValue } : param
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

    const invalidParams = inputParameters.filter(param => param.name.trim() === '' || param.value.trim() === '');
    if (invalidParams.length > 0) {
      alert('Please fill in all parameter names and values, or remove empty parameters');
      return;
    }

    const invalidRefs = executionRefs.filter(ref => ref.name.trim() === '' || ref.value.trim() === '');
    if (invalidRefs.length > 0) {
      alert('Please fill in all execution reference names and values, or remove empty references');
      return;
    }

    const taskinputParameters: Record<string, string> = {};
    inputParameters.forEach(param => {
      if (param.name.trim() && param.value.trim()) {
        taskinputParameters[param.name.trim()] = param.value.trim();
      }
    });

    const executionReferences: Record<string, string> = {};
    executionRefs.forEach(ref => {
      if (ref.name.trim() && ref.value.trim()) {
        executionReferences[ref.name.trim()] = ref.value.trim();
      }
    });

    const finalConfig: SignalOrScheduledWaitTaskConfig = {
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
      taskinputParameters,
    };

    onSave(finalConfig);
    onOpenChange(false);
  };

  const getJsonPreview = () => {
    const taskinputParameters: Record<string, string> = {};
    inputParameters.forEach(param => {
      if (param.name.trim() && param.value.trim()) {
        taskinputParameters[param.name.trim()] = param.value.trim();
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
      taskinputParameters,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-white">
            Create Signal or Scheduled Wait Task
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs defaultValue="basic" className="space-y-4 py-4">
            <TabsList className="bg-[#0f1419]">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="execution">Execution</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
              <TabsTrigger value="parameters">Input Parameters</TabsTrigger>
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
                      placeholder="e.g., ORG001"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task Reference ID *</Label>
                    <Input
                      value={config.taskRefId}
                      onChange={(e) => setConfig({ ...config, taskRefId: e.target.value })}
                      placeholder="e.g., advancedremorsehold-1760532809257"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task ID *</Label>
                    <Input
                      value={config.taskId}
                      onChange={(e) => setConfig({ ...config, taskId: e.target.value })}
                      placeholder="e.g., advanced-remorse-hold-1"
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
                      placeholder="e.g., BOPUS-TASKLIST"
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

              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-3">About Signal or Scheduled Wait</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <p>
                    This task type allows workflows to pause execution either:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>
                      <strong className="text-cyan-400">For a scheduled duration</strong> - Wait for a specific time period (e.g., 5 minutes, 2 hours)
                    </li>
                    <li>
                      <strong className="text-cyan-400">Until a signal is received</strong> - Wait for an external signal to continue
                    </li>
                    <li>
                      <strong className="text-cyan-400">Whichever comes first</strong> - Resume when either condition is met
                    </li>
                  </ul>
                  <p className="text-xs text-gray-400 mt-3">
                    Common use cases: Remorse periods, approval workflows, rate limiting, scheduled delays
                  </p>
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

            <TabsContent value="parameters" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Task Input Parameters</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Define parameters for pause duration and signal handling
                    </p>
                  </div>
                  <Button
                    onClick={handleAddParameter}
                    className="bg-cyan-500 text-white hover:bg-cyan-600"
                    size="sm"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Parameter
                  </Button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {inputParameters.map((param) => (
                    <Card key={param.id} className="p-4 bg-[#1a1f2e] border-[#2a3142]">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-white text-xs mb-2 block">
                              Parameter Name *
                            </Label>
                            <Input
                              value={param.name}
                              onChange={(e) => handleParameterChange(param.id, 'name', e.target.value)}
                              placeholder="e.g., pauseDuration"
                              className="bg-[#0f1419] text-white border-[#2a3142] h-9 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-xs mb-2 block">
                              Parameter Value *
                            </Label>
                            <Input
                              value={param.value}
                              onChange={(e) => handleParameterChange(param.id, 'value', e.target.value)}
                              placeholder="e.g., ${workflow.input.pauseDuration}"
                              className="bg-[#0f1419] text-white border-[#2a3142] h-9 text-sm font-mono"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRemoveParameter(param.id)}
                          variant="ghost"
                          size="sm"
                          disabled={inputParameters.length === 1}
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
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">💡 Common Parameters</h4>
                  <div className="text-xs text-blue-300 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold text-cyan-400 mb-1">pauseDuration</p>
                        <p className="text-gray-300">The duration to wait (numeric value)</p>
                        <code className="text-xs bg-cyan-500/10 px-1 rounded mt-1 inline-block">
                          ${'${workflow.input.pauseDuration}'}
                        </code>
                      </div>
                      <div>
                        <p className="font-semibold text-cyan-400 mb-1">pauseDurationUnits</p>
                        <p className="text-gray-300">Time unit (SECONDS, MINUTES, HOURS, DAYS)</p>
                        <code className="text-xs bg-cyan-500/10 px-1 rounded mt-1 inline-block">
                          ${'${workflow.input.pauseDurationUnits}'}
                        </code>
                      </div>
                      <div>
                        <p className="font-semibold text-cyan-400 mb-1">signalName</p>
                        <p className="text-gray-300">Name of the signal to wait for</p>
                        <code className="text-xs bg-cyan-500/10 px-1 rounded mt-1 inline-block">
                          ${'${workflow.input.signalName}'}
                        </code>
                      </div>
                      <div>
                        <p className="font-semibold text-cyan-400 mb-1">signalTimeout</p>
                        <p className="text-gray-300">Max time to wait for signal</p>
                        <code className="text-xs bg-cyan-500/10 px-1 rounded mt-1 inline-block">
                          ${'${workflow.input.signalTimeout}'}
                        </code>
                      </div>
                    </div>
                  </div>
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
