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

export interface HttpTaskConfig {
  orgId: string;
  taskId: string;
  taskType: string;
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
  httpRequest: {
    uri: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
    connectionTimeOut?: number;
    readTimeOut?: number;
  };
  taskinputParameters?: any;
  input?: Record<string, any>;
  output?: Record<string, any>;
}

export interface HttpTaskCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: HttpTaskConfig) => void;
}

interface NameValuePair {
  id: string;
  name: string;
  value: string;
}

export function HttpTaskCreateModal({
  open,
  onOpenChange,
  onSave,
}: HttpTaskCreateModalProps) {
  const [config, setConfig] = useState<HttpTaskConfig>(() => ({
    orgId: 'TEST_ORG_DT',
    taskId: '',
    taskType: 'HTTP',
    executionNamespace: 'FULFILLMENT',
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
    httpRequest: {
      uri: '',
      method: 'GET',
      connectionTimeOut: 3000,
      readTimeOut: 3000,
    },
    taskinputParameters: {},
		input: {},
		output: {}
  }));

  const [headersJson, setHeadersJson] = useState('{}');
  const [bodyJson, setBodyJson] = useState('{}');
  const [inputJsonState, setInputJsonState] = useState('{}');
  const [outputJsonState, setOutputJsonState] = useState('{}');
  const [jsonError, setJsonError] = useState('');
  const [executionRefs, setExecutionRefs] = useState<NameValuePair[]>([
    { id: '1', name: 'genericTaskName', value: 'codeExecuter_generic_task' }
  ]);

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      const defaultConfig: HttpTaskConfig = {
        orgId: 'TEST_ORG_DT',
        taskId: `http-task-${timestamp}`,
        taskType: 'HTTP',
        executionNamespace: 'FULFILLMENT',
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
        httpRequest: {
          uri: '',
          method: 'GET',
          connectionTimeOut: 3000,
          readTimeOut: 3000,
        },
        taskinputParameters: {},
        input: {},
        output: {},
      };
      setConfig(defaultConfig);
      setHeadersJson('{}');
      setBodyJson('{}');
      setInputJsonState('{}');
      setOutputJsonState('{}');
      setExecutionRefs([{ id: '1', name: 'genericTaskName', value: 'codeExecuter_generic_task' }]);
      setJsonError('');
    }
  }, [open]);

  const validateJson = (value: string) => {
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
    if (!config.orgId || !config.taskId || !config.executionNamespace) {
      setJsonError('Please fill in all required fields (Organization ID, Task ID, Execution Namespace)');
      return;
    }

    if (!validateJson(headersJson) || !validateJson(bodyJson) || !validateJson(inputJsonState) || !validateJson(outputJsonState)) {
      return;
    }

    const invalidRefs = executionRefs.filter(ref => ref.name.trim() === '' || ref.value.trim() === '');
    if (invalidRefs.length > 0) {
      setJsonError('Please fill in all execution reference names and values, or remove empty references');
      return;
    }

    try {
      const headers = headersJson.trim() ? JSON.parse(headersJson) : {};
      const body = bodyJson.trim() ? JSON.parse(bodyJson) : {};
      const input = inputJsonState.trim() ? JSON.parse(inputJsonState) : {};
      const output = outputJsonState.trim() ? JSON.parse(outputJsonState) : {};
      
      const executionReferences: Record<string, string> = {};
      executionRefs.forEach(ref => {
        if (ref.name.trim() && ref.value.trim()) {
          executionReferences[ref.name.trim()] = ref.value.trim();
        }
      });

      const finalConfig = {
        orgId: config.orgId,
        taskId: config.taskId,
        taskType: config.taskType,
        executionNamespace: config.executionNamespace,
        executionReferences,
        retryPolicy: config.retryPolicy,
        timeoutPolicy: config.timeoutPolicy,
        httpRequest: {
          ...config.httpRequest,
          headers,
          body,
        },
        taskinputParameters: config.taskinputParameters,
        input,
        output,
      };

      onSave(finalConfig);
      onOpenChange(false);
    } catch (error) {
      setJsonError('Failed to parse JSON for headers, body, input, output, or execution references');
    }
  };

  const getJsonPreview = () => {
    const headers = headersJson.trim() ? JSON.parse(headersJson) : {};
    const body = bodyJson.trim() ? JSON.parse(bodyJson) : {};
    const input = inputJsonState.trim() ? JSON.parse(inputJsonState) : {};
    const output = outputJsonState.trim() ? JSON.parse(outputJsonState) : {};
    const executionReferences: Record<string, string> = {};
    executionRefs.forEach(ref => {
      if (ref.name.trim() && ref.value.trim()) {
        executionReferences[ref.name.trim()] = ref.value.trim();
      }
    });

    return {
      orgId: config.orgId,
      taskId: config.taskId,
      taskType: config.taskType,
      executionNamespace: config.executionNamespace,
      executionReferences,
      retryPolicy: config.retryPolicy,
      timeoutPolicy: config.timeoutPolicy,
      httpRequest: {
        uri: config.httpRequest.uri,
        method: config.httpRequest.method,
        headers,
        body,
        connectionTimeOut: config.httpRequest.connectionTimeOut,
        readTimeOut: config.httpRequest.readTimeOut,
      },
      taskinputParameters: config.taskinputParameters,
      input,
      output,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-white">
            Create HTTP Task
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs defaultValue="basic" className="space-y-4 py-4">
            <TabsList className="bg-[#0f1419]">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="execution">Execution</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
              <TabsTrigger value="http">HTTP Request</TabsTrigger>
              <TabsTrigger value="input-output">Input/Output</TabsTrigger>
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
                      placeholder="e.g., TEST_ORG_DT"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task ID *</Label>
                    <Input
                      value={config.taskId}
                      onChange={(e) => setConfig({ ...config, taskId: e.target.value })}
                      placeholder="e.g., call_dirty_node_api_http_task"
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
                      placeholder="e.g., FULFILLMENT"
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
                      value={config.retryPolicy?.retryInterval ?? 60}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          retryPolicy: {
                            ...(config.retryPolicy || { retryInterval: 60, retryCount: 3 }),
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
                      value={config.retryPolicy?.retryCount ?? 3}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          retryPolicy: {
                            ...(config.retryPolicy || { retryInterval: 60, retryCount: 3 }),
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
                      value={config.timeoutPolicy?.timeoutAction ?? 'RETRY'}
                      onValueChange={(value) =>
                        setConfig({
                          ...config,
                          timeoutPolicy: {
                            ...(config.timeoutPolicy || {
                              timeoutAction: 'RETRY',
                              responseTimeoutSeconds: 600,
                              timeoutInterval: 1200,
                              pollTimeoutSeconds: 600,
                            }),
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
                      value={config.timeoutPolicy?.responseTimeoutSeconds ?? 600}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          timeoutPolicy: {
                            ...(config.timeoutPolicy || {
                              timeoutAction: 'RETRY',
                              responseTimeoutSeconds: 600,
                              timeoutInterval: 1200,
                              pollTimeoutSeconds: 600,
                            }),
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
                      value={config.timeoutPolicy?.timeoutInterval ?? 1200}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          timeoutPolicy: {
                            ...(config.timeoutPolicy || {
                              timeoutAction: 'RETRY',
                              responseTimeoutSeconds: 600,
                              timeoutInterval: 1200,
                              pollTimeoutSeconds: 600,
                            }),
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
                      value={config.timeoutPolicy?.pollTimeoutSeconds ?? 600}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          timeoutPolicy: {
                            ...(config.timeoutPolicy || {
                              timeoutAction: 'RETRY',
                              responseTimeoutSeconds: 600,
                              timeoutInterval: 1200,
                              pollTimeoutSeconds: 600,
                            }),
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

            <TabsContent value="http" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">HTTP Request Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">URI</Label>
                    <Input
                      value={config.httpRequest.uri}
                      onChange={(e) => setConfig({
                        ...config,
                        httpRequest: { ...config.httpRequest, uri: e.target.value }
                      })}
                      placeholder="https://api.example.com/endpoint"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Method</Label>
                    <Select
                      value={config.httpRequest.method}
                      onValueChange={(value) => setConfig({
                        ...config,
                        httpRequest: { ...config.httpRequest, method: value }
                      })}
                    >
                      <SelectTrigger className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Connection Timeout (ms)</Label>
                      <Input
                        type="number"
                        value={config.httpRequest.connectionTimeOut}
                        onChange={(e) => setConfig({
                          ...config,
                          httpRequest: { ...config.httpRequest, connectionTimeOut: parseInt(e.target.value) || 3000 }
                        })}
                        className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Read Timeout (ms)</Label>
                      <Input
                        type="number"
                        value={config.httpRequest.readTimeOut}
                        onChange={(e) => setConfig({
                          ...config,
                          httpRequest: { ...config.httpRequest, readTimeOut: parseInt(e.target.value) || 3000 }
                        })}
                        className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white">Headers (JSON)</Label>
                    <Textarea
                      value={headersJson}
                      onChange={(e) => {
                        setHeadersJson(e.target.value);
                        validateJson(e.target.value);
                      }}
                      className="mt-2 font-mono text-sm bg-[#1a1f2e] text-white border-[#2a3142] min-h-[100px]"
                      placeholder='{"Content-Type": "application/json"}'
                    />
                  </div>
                  <div>
                    <Label className="text-white">Body (JSON)</Label>
                    <Textarea
                      value={bodyJson}
                      onChange={(e) => {
                        setBodyJson(e.target.value);
                        validateJson(e.target.value);
                      }}
                      className="mt-2 font-mono text-sm bg-[#1a1f2e] text-white border-[#2a3142] min-h-[150px]"
                      placeholder='{"key": "value"}'
                    />
                  </div>
                  {jsonError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                      <p className="text-sm text-red-400">{jsonError}</p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="input-output" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Input/Output Parameters (JSON)</h3>
                {jsonError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-400">{jsonError}</p>
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Input Parameters</Label>
                    <Textarea
                      value={inputJsonState}
                      onChange={(e) => {
                        setInputJsonState(e.target.value);
                        validateJson(e.target.value);
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setConfig(prev => ({ ...prev, input: parsed }));
                        } catch (err) {
                          setConfig(prev => ({ ...prev, input: {} }));
                        }
                      }}
                      className="mt-2 font-mono text-sm bg-[#1a1f2e] text-white border-[#2a3142] min-h-[150px]"
                      placeholder='{"key": "value"}'
                    />
                  </div>
                  <div>
                    <Label className="text-white">Output Parameters</Label>
                    <Textarea
                      value={outputJsonState}
                      onChange={(e) => {
                        setOutputJsonState(e.target.value);
                        validateJson(e.target.value);
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setConfig(prev => ({ ...prev, output: parsed }));
                        } catch (err) {
                          setConfig(prev => ({ ...prev, output: {} }));
                        }
                      }}
                      className="mt-2 font-mono text-sm bg-[#1a1f2e] text-white border-[#2a3142] min-h-[150px]"
                      placeholder='{"key": "value"}'
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Complete Configuration JSON</h3>
                {jsonError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-400">{jsonError}</p>
                  </div>
                )}
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
            disabled={!!jsonError}
            className="bg-cyan-500 text-white hover:bg-cyan-600 font-medium disabled:opacity-50"
          >
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
