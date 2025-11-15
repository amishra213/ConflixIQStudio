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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

export interface HttpRequest {
  uri: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  connectionTimeOut?: number;
  readTimeOut?: number;
}

export interface HttpTaskConfig {
  type?: 'HTTP';
  name?: string;
  taskReferenceName?: string;
  http_request?: HttpRequest;
  // Extended fields for full-featured HTTP task
  orgId?: string;
  taskId?: string;
  taskType?: string;
  executionNamespace?: string;
  executionReferences?: Record<string, string>;
  retryPolicy?: {
    retryInterval: number;
    retryCount: number;
  };
  timeoutPolicy?: {
    timeoutAction: string;
    responseTimeoutSeconds: number;
    timeoutInterval: number;
    pollTimeoutSeconds: number;
  };
  taskinputParameters?: any;
  input?: Record<string, any>;
  output?: Record<string, any>;
  httpRequest?: HttpRequest;
}

interface HttpTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: HttpTaskConfig) => void;
  readonly variant?: 'simple' | 'full'; // 'simple' for WorkflowDesigner, 'full' for TaskManagement
  readonly initialConfig?: HttpTaskConfig | null;
}

interface ExecutionReference {
  id: string;
  name: string;
  value: string;
}

export function HttpTaskModal({ open, onOpenChange, onSave, variant = 'simple', initialConfig }: HttpTaskModalProps) {
  const [config, setConfig] = useState<HttpTaskConfig>({
    type: 'HTTP',
    name: '',
    taskReferenceName: '',
    http_request: {
      uri: '',
      method: 'GET',
      headers: {},
      timeout: 5000,
      connectionTimeOut: 3000,
      readTimeOut: 3000,
    },
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
    taskinputParameters: {},
    input: {},
    output: {},
  });

  const [headers, setHeaders] = useState<Array<{id: string; key: string; value: string}>>([]);
  const [bodyText, setBodyText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [executionRefs, setExecutionRefs] = useState<ExecutionReference[]>([
    { id: '1', name: 'genericTaskName', value: 'codeExecuter_generic_task' }
  ]);
  const [inputJsonState, setInputJsonState] = useState('{}');
  const [outputJsonState, setOutputJsonState] = useState('{}');

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        // Load existing configuration
        setConfig({
          type: 'HTTP',
          name: initialConfig.name || '',
          taskReferenceName: initialConfig.taskReferenceName || '',
          http_request: initialConfig.http_request || initialConfig.httpRequest || {
            uri: '',
            method: 'GET',
            headers: {},
            timeout: 5000,
            connectionTimeOut: 3000,
            readTimeOut: 3000,
          },
          orgId: initialConfig.orgId || 'TEST_ORG_DT',
          taskId: initialConfig.taskId || '',
          taskType: initialConfig.taskType || 'HTTP',
          executionNamespace: initialConfig.executionNamespace || 'FULFILLMENT',
          executionReferences: initialConfig.executionReferences || {},
          retryPolicy: initialConfig.retryPolicy || {
            retryInterval: 60,
            retryCount: 3,
          },
          timeoutPolicy: initialConfig.timeoutPolicy || {
            timeoutAction: 'RETRY',
            responseTimeoutSeconds: 600,
            timeoutInterval: 1200,
            pollTimeoutSeconds: 600,
          },
          taskinputParameters: initialConfig.taskinputParameters || {},
          input: initialConfig.input || {},
          output: initialConfig.output || {},
        });

        // Set headers from config
        const httpReq = initialConfig.http_request || initialConfig.httpRequest;
        if (httpReq?.headers) {
          const headerArray = Object.entries(httpReq.headers).map(([key, value]) => ({
            id: `header-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            key,
            value: value as string,
          }));
          setHeaders(headerArray);
        } else {
          setHeaders([]);
        }

        // Set body text
        const body = httpReq?.body;
        if (body) {
          setBodyText(typeof body === 'string' ? body : JSON.stringify(body, null, 2));
        } else {
          setBodyText('');
        }

        // Set execution references
        const execRefs = initialConfig.executionReferences;
        if (execRefs && Object.keys(execRefs).length > 0) {
          const refArray = Object.entries(execRefs).map(([name, value]) => ({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            name,
            value,
          }));
          setExecutionRefs(refArray);
        } else {
          setExecutionRefs([{ id: '1', name: 'genericTaskName', value: 'codeExecuter_generic_task' }]);
        }

        // Set input/output JSON
        setInputJsonState(initialConfig.input ? JSON.stringify(initialConfig.input, null, 2) : '{}');
        setOutputJsonState(initialConfig.output ? JSON.stringify(initialConfig.output, null, 2) : '{}');
      } else {
        // Create new configuration
        const timestamp = Date.now();
        setConfig({
          type: 'HTTP',
          name: '',
          taskReferenceName: '',
          http_request: {
            uri: '',
            method: 'GET',
            headers: {},
            timeout: 5000,
            connectionTimeOut: 3000,
            readTimeOut: 3000,
          },
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
          taskinputParameters: {},
          input: {},
          output: {},
        });
        setHeaders([]);
        setBodyText('');
        setExecutionRefs([{ id: '1', name: 'genericTaskName', value: 'codeExecuter_generic_task' }]);
        setInputJsonState('{}');
        setOutputJsonState('{}');
      }
      setJsonError('');
    }
  }, [open, initialConfig]);

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

  const handleAddHeader = () => {
    const newId = `header-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setHeaders([...headers, { id: newId, key: '', value: '' }]);
  };

  const handleRemoveHeader = (id: string) => {
    setHeaders(headers.filter((h) => h.id !== id));
  };

  const handleHeaderChange = (id: string, field: 'key' | 'value', val: string) => {
    setHeaders(headers.map((h) => 
      h.id === id ? { ...h, [field]: val } : h
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
    if (variant === 'simple') {
      // Simple variant validation
      if (!config.name || config.name.trim() === '') {
        setJsonError('Name is required');
        return;
      }
      if (!config.taskReferenceName || config.taskReferenceName.trim() === '') {
        setJsonError('Task Reference Name is required');
        return;
      }
      if (!config.http_request?.uri || config.http_request.uri.trim() === '') {
        setJsonError('URI is required');
        return;
      }

      const headersObj: Record<string, string> = {};
      for (const h of headers) {
        if (h.key && h.value) {
          headersObj[h.key] = h.value;
        }
      }

      let body: any = undefined;
      if (bodyText.trim()) {
        try {
          body = JSON.parse(bodyText);
        } catch {
          body = bodyText;
        }
      }

      const updatedConfig: HttpTaskConfig = {
        type: 'HTTP',
        name: config.name,
        taskReferenceName: config.taskReferenceName,
        http_request: {
          uri: config.http_request.uri,
          method: config.http_request.method,
          headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
          body: body,
          timeout: config.http_request.timeout,
        },
      };

      onSave(updatedConfig);
      onOpenChange(false);
    } else {
      // Full variant validation
      if (!config.orgId || !config.taskId || !config.executionNamespace) {
        setJsonError('Please fill in all required fields (Organization ID, Task ID, Execution Namespace)');
        return;
      }

      if (!validateJson(bodyText) || !validateJson(inputJsonState) || !validateJson(outputJsonState)) {
        return;
      }

      const invalidRefs = executionRefs.filter(ref => ref.name.trim() === '' || ref.value.trim() === '');
      if (invalidRefs.length > 0) {
        setJsonError('Please fill in all execution reference names and values, or remove empty references');
        return;
      }

      try {
        const headers = {};
        const body = bodyText.trim() ? JSON.parse(bodyText) : {};
        const input = inputJsonState.trim() ? JSON.parse(inputJsonState) : {};
        const output = outputJsonState.trim() ? JSON.parse(outputJsonState) : {};
        
        const executionReferences: Record<string, string> = {};
        executionRefs.forEach(ref => {
          if (ref.name.trim() && ref.value.trim()) {
            executionReferences[ref.name.trim()] = ref.value.trim();
          }
        });

        const finalConfig: HttpTaskConfig = {
          orgId: config.orgId,
          taskId: config.taskId,
          taskType: config.taskType,
          executionNamespace: config.executionNamespace,
          executionReferences,
          retryPolicy: config.retryPolicy,
          timeoutPolicy: config.timeoutPolicy,
          httpRequest: {
            uri: config.http_request?.uri || '',
            method: config.http_request?.method || 'GET',
            headers,
            body,
            connectionTimeOut: config.http_request?.connectionTimeOut,
            readTimeOut: config.http_request?.readTimeOut,
          },
          taskinputParameters: config.taskinputParameters,
          input,
          output,
        };

        onSave(finalConfig);
        onOpenChange(false);
      } catch (error) {
        setJsonError('Failed to parse JSON for body, input, output, or execution references');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${variant === 'full' ? 'max-w-4xl h-[85vh]' : 'max-w-2xl'} bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col ${variant === 'full' ? 'p-0' : ''}`}>
        <DialogHeader className={variant === 'full' ? 'px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0' : ''}>
          <DialogTitle className="text-2xl font-semibold">
            {variant === 'full' ? 'Create HTTP Task' : 'Create HTTP System Task'}
          </DialogTitle>
        </DialogHeader>

        <div className={variant === 'full' ? 'flex-1 overflow-y-auto px-6' : 'space-y-4 max-h-[70vh] overflow-y-auto'}>
          {variant === 'simple' ? (
            // Simple variant - original HttpTaskModal
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#0f1419] border-[#2a3142]">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="request">HTTP Request</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-3">
                <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-white">Name *</Label>
                      <Input
                        value={config.name}
                        onChange={(e) => setConfig({ ...config, name: e.target.value })}
                        placeholder="HTTP Task name"
                        className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Task Reference Name *</Label>
                      <Input
                        value={config.taskReferenceName}
                        onChange={(e) => setConfig({ ...config, taskReferenceName: e.target.value })}
                        placeholder="e.g., http_ref_1"
                        className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="request" className="space-y-3">
                <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-white">URI *</Label>
                      <Input
                        value={config.http_request?.uri || ''}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            http_request: { ...config.http_request!, uri: e.target.value },
                          })
                        }
                        placeholder="https://api.example.com/endpoint"
                        className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Method *</Label>
                      <Select
                        value={config.http_request?.method || 'GET'}
                        onValueChange={(method) =>
                          setConfig({
                            ...config,
                            http_request: {
                              ...config.http_request!,
                              method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
                            },
                          })
                        }
                      >
                        <SelectTrigger className="bg-[#1a1f2e] text-white border-[#2a3142]">
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

                    <div>
                      <Label className="text-white">Timeout (ms)</Label>
                      <Input
                        type="number"
                        value={config.http_request?.timeout || 5000}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            http_request: {
                              ...config.http_request!,
                              timeout: Number(e.target.value),
                            },
                          })
                        }
                        placeholder="5000"
                        className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-white">Headers</Label>
                        <Button
                          size="sm"
                          onClick={handleAddHeader}
                          className="bg-cyan-500 text-white hover:bg-cyan-600 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Header
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {headers.map((header) => (
                          <div key={header.id} className="flex gap-2">
                            <Input
                              value={header.key}
                              onChange={(e) => handleHeaderChange(header.id, 'key', e.target.value)}
                              placeholder="Header name"
                              className="flex-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                            />
                            <Input
                              value={header.value}
                              onChange={(e) => handleHeaderChange(header.id, 'value', e.target.value)}
                              placeholder="Header value"
                              className="flex-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveHeader(header.id)}
                              className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Body (JSON or text)</Label>
                      <Textarea
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        placeholder='{"key": "value"}'
                        className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] font-mono text-sm min-h-[100px]"
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            // Full variant - merged from HttpTaskCreateModal
            <Tabs defaultValue="basic" className="space-y-4 py-4">
              <TabsList className="bg-[#0f1419]">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="execution">Execution</TabsTrigger>
                <TabsTrigger value="policies">Policies</TabsTrigger>
                <TabsTrigger value="http">HTTP Request</TabsTrigger>
                <TabsTrigger value="input-output">Input/Output</TabsTrigger>
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
                      <Plus className="w-4 h-4 mr-2" />
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
                            <Trash2 className="w-4 h-4" />
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
                        value={config.http_request?.uri || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          http_request: { ...config.http_request!, uri: e.target.value }
                        })}
                        placeholder="https://api.example.com/endpoint"
                        className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Method</Label>
                      <Select
                        value={config.http_request?.method || 'GET'}
                        onValueChange={(value) => setConfig({
                          ...config,
                          http_request: { ...config.http_request!, method: value as any }
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
                          value={config.http_request?.connectionTimeOut}
                          onChange={(e) => setConfig({
                            ...config,
                            http_request: { ...config.http_request!, connectionTimeOut: parseInt(e.target.value) || 3000 }
                          })}
                          className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Read Timeout (ms)</Label>
                        <Input
                          type="number"
                          value={config.http_request?.readTimeOut}
                          onChange={(e) => setConfig({
                            ...config,
                            http_request: { ...config.http_request!, readTimeOut: parseInt(e.target.value) || 3000 }
                          })}
                          className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white">Body (JSON)</Label>
                      <Textarea
                        value={bodyText}
                        onChange={(e) => {
                          setBodyText(e.target.value);
                          validateJson(e.target.value);
                        }}
                        className="mt-2 font-mono text-sm bg-[#1a1f2e] text-white border-[#2a3142] min-h-[150px]"
                        placeholder='{"key": "value"}'
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="input-output" className="space-y-4">
                <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                  <h3 className="text-lg font-semibold text-white mb-4">Input/Output Parameters (JSON)</h3>
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
            </Tabs>
          )}

          {jsonError && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{jsonError}</p>
            </div>
          )}
        </div>

        <DialogFooter className={variant === 'full' ? 'border-t border-[#2a3142] px-6 py-4 flex-shrink-0' : ''}>
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
            {variant === 'full' ? 'Create Task' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
