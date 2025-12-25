import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { JsonTextarea } from '@/components/ui/json-textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

// OSS Conductor HTTP Task Configuration
export interface HttpRequest {
  uri: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'TRACE';
  accept?: string;
  contentType?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string | null;
  asyncComplete?: boolean;
  connectionTimeOut?: number;
  readTimeOut?: number;
}

export interface HttpTaskConfig extends BaseTaskConfig {
  type: 'HTTP';
  inputParameters: {
    http_request: HttpRequest;
    [key: string]: unknown;
  };
}

export interface HttpTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: HttpTaskConfig) => void;
  initialConfig?: HttpTaskConfig | null;
}

export function HttpTaskModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: Readonly<HttpTaskModalProps>) {
  const [config, setConfig] = useState<HttpTaskConfig>({
    type: 'HTTP',
    name: 'http_task',
    taskReferenceName: 'http_task_ref',
    inputParameters: {
      http_request: {
        uri: 'http://localhost:8080/api',
        method: 'GET',
        accept: 'application/json',
        contentType: 'application/json',
        connectionTimeOut: 100,
        readTimeOut: 150,
        asyncComplete: false,
      },
    },
  });

  const [headers, setHeaders] = useState<Array<{ id: string; key: string; value: string }>>([]);
  const [bodyJson, setBodyJson] = useState('');

  useEffect(() => {
    if (open) {
      console.log('[HttpTaskModal] Modal opening with initialConfig:', initialConfig);
      if (initialConfig) {
        // Safely access http_request from initialConfig
        const httpRequest = initialConfig.inputParameters?.http_request || {};
        const timestamp = Date.now();

        console.log('[HttpTaskModal] Setting config from initialConfig. httpRequest:', httpRequest);

        setConfig({
          ...initialConfig,
          name: initialConfig.name || `http_task_${timestamp}`,
          taskReferenceName: initialConfig.taskReferenceName || `http_task_ref_${timestamp}`,
          inputParameters: {
            ...initialConfig.inputParameters,
            http_request: {
              uri: httpRequest.uri || 'http://localhost:8080/api',
              method: httpRequest.method || 'GET',
              accept: httpRequest.accept || 'application/json',
              contentType: httpRequest.contentType || 'application/json',
              connectionTimeOut: httpRequest.connectionTimeOut ?? 100,
              readTimeOut: httpRequest.readTimeOut ?? 150,
              asyncComplete: httpRequest.asyncComplete || false,
            },
          },
        });

        // Extract headers
        const headerEntries = Object.entries(httpRequest.headers || {});
        const headerList = headerEntries.map(([key, value], index) => ({
          id: `header-${Date.now()}-${index}`,
          key,
          value: String(value),
        }));
        setHeaders(headerList.length > 0 ? headerList : []);

        // Set body JSON
        const body = httpRequest.body;
        setBodyJson(body ? JSON.stringify(body, null, 2) : '');
      } else {
        console.log('[HttpTaskModal] No initialConfig provided, using defaults');
        const timestamp = Date.now();
        const defaultConfig: HttpTaskConfig = {
          type: 'HTTP',
          name: `http_task_${timestamp}`,
          taskReferenceName: `http_task_ref_${timestamp}`,
          inputParameters: {
            http_request: {
              uri: 'http://localhost:8080/api',
              method: 'GET',
              accept: 'application/json',
              contentType: 'application/json',
              connectionTimeOut: 100,
              readTimeOut: 150,
              asyncComplete: false,
            },
          },
        };
        setConfig(defaultConfig);
        setHeaders([]);
        setBodyJson('');
      }
    }
  }, [open, initialConfig]);

  const handleAddHeader = () => {
    const newId = `header-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setHeaders([...headers, { id: newId, key: '', value: '' }]);
  };

  const handleRemoveHeader = (id: string) => {
    const updated = headers.filter((h) => h.id !== id);
    setHeaders(updated);
    // Sync to config
    const headersObj: Record<string, string> = {};
    for (const h of updated) {
      if (h.key && h.value) {
        headersObj[h.key] = h.value;
      }
    }
    setConfig({
      ...config,
      inputParameters: {
        ...config.inputParameters,
        http_request: {
          ...config.inputParameters.http_request,
          headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
        },
      },
    });
  };

  const handleHeaderChange = (id: string, field: 'key' | 'value', val: string) => {
    const updated = headers.map((h) => (h.id === id ? { ...h, [field]: val } : h));
    setHeaders(updated);
    // Sync to config
    const headersObj: Record<string, string> = {};
    for (const h of updated) {
      if (h.key && h.value) {
        headersObj[h.key] = h.value;
      }
    }
    setConfig({
      ...config,
      inputParameters: {
        ...config.inputParameters,
        http_request: {
          ...config.inputParameters.http_request,
          headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
        },
      },
    });
  };

  const validateConfig = (cfg: HttpTaskConfig): string | null => {
    if (
      !cfg.inputParameters.http_request.uri ||
      cfg.inputParameters.http_request.uri.trim() === ''
    ) {
      return 'URI is required';
    }
    return null;
  };

  // Before saving, merge headers and body into http_request
  const handleSaveWithMerge = (cfg: HttpTaskConfig) => {
    // Build headers object
    const headersObj: Record<string, string> = {};
    for (const h of headers) {
      if (h.key && h.value) {
        headersObj[h.key] = h.value;
      }
    }

    // Parse body
    let body: Record<string, unknown> | string | undefined = undefined;
    if (bodyJson.trim()) {
      try {
        body = JSON.parse(bodyJson);
      } catch {
        // If parse fails, just use as string
        body = bodyJson;
      }
    }

    // Build final config
    const finalConfig: HttpTaskConfig = {
      ...cfg,
      inputParameters: {
        ...cfg.inputParameters,
        http_request: {
          ...cfg.inputParameters.http_request,
          headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
          body: body,
        },
      },
    };

    onSave(finalConfig);
  };

  const httpRequestTab = {
    id: 'http',
    label: 'HTTP Request',
    content: (
      <div className="space-y-4" style={{ '--line-height': '1.5rem' } as React.CSSProperties}>
        <div className="p-6 bg-background border border-border rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-4">HTTP Request Configuration</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground">URI *</Label>
              <Input
                value={config.inputParameters.http_request.uri}
                onChange={(e) => {
                  setConfig({
                    ...config,
                    inputParameters: {
                      ...config.inputParameters,
                      http_request: { ...config.inputParameters.http_request, uri: e.target.value },
                    },
                  });
                }}
                placeholder="https://api.example.com/endpoint"
                className="mt-2 bg-card text-foreground border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Can use dynamic references: ${'{'}workflow.input.param{'}'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Method *</Label>
                <Select
                  value={config.inputParameters.http_request.method}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      inputParameters: {
                        ...config.inputParameters,
                        http_request: {
                          ...config.inputParameters.http_request,
                          method: value as HttpRequest['method'],
                        },
                      },
                    })
                  }
                >
                  <SelectTrigger className="mt-2 bg-card text-foreground border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground border-border">
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                    <SelectItem value="HEAD">HEAD</SelectItem>
                    <SelectItem value="TRACE">TRACE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground">Accept</Label>
                <Select
                  value={config.inputParameters.http_request.accept || 'application/json'}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      inputParameters: {
                        ...config.inputParameters,
                        http_request: { ...config.inputParameters.http_request, accept: value },
                      },
                    })
                  }
                >
                  <SelectTrigger className="mt-2 bg-card text-foreground border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground border-border">
                    <SelectItem value="application/json">application/json</SelectItem>
                    <SelectItem value="application/xml">application/xml</SelectItem>
                    <SelectItem value="application/pdf">application/pdf</SelectItem>
                    <SelectItem value="application/octet-stream">
                      application/octet-stream
                    </SelectItem>
                    <SelectItem value="application/x-www-form-urlencoded">
                      application/x-www-form-urlencoded
                    </SelectItem>
                    <SelectItem value="text/plain">text/plain</SelectItem>
                    <SelectItem value="text/html">text/html</SelectItem>
                    <SelectItem value="text/xml">text/xml</SelectItem>
                    <SelectItem value="image/jpeg">image/jpeg</SelectItem>
                    <SelectItem value="image/png">image/png</SelectItem>
                    <SelectItem value="image/gif">image/gif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-foreground">Content Type</Label>
              <Select
                value={config.inputParameters.http_request.contentType || 'application/json'}
                onValueChange={(value) =>
                  setConfig({
                    ...config,
                    inputParameters: {
                      ...config.inputParameters,
                      http_request: { ...config.inputParameters.http_request, contentType: value },
                    },
                  })
                }
              >
                <SelectTrigger className="mt-2 bg-card text-foreground border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card text-foreground border-border">
                  <SelectItem value="application/json">application/json</SelectItem>
                  <SelectItem value="text/plain">text/plain</SelectItem>
                  <SelectItem value="text/html">text/html</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Connection Timeout (ms)</Label>
                <Input
                  type="number"
                  value={config.inputParameters.http_request.connectionTimeOut}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      inputParameters: {
                        ...config.inputParameters,
                        http_request: {
                          ...config.inputParameters.http_request,
                          connectionTimeOut: Number.parseInt(e.target.value) || 100,
                        },
                      },
                    })
                  }
                  className="mt-2 bg-card text-foreground border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">Default: 100ms, 0 = no timeout</p>
              </div>
              <div>
                <Label className="text-foreground">Read Timeout (ms)</Label>
                <Input
                  type="number"
                  value={config.inputParameters.http_request.readTimeOut}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      inputParameters: {
                        ...config.inputParameters,
                        http_request: {
                          ...config.inputParameters.http_request,
                          readTimeOut: Number.parseInt(e.target.value) || 150,
                        },
                      },
                    })
                  }
                  className="mt-2 bg-card text-foreground border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">Default: 150ms, 0 = no timeout</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-card rounded-lg">
              <div>
                <Label className="text-foreground">Async Complete</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Keep task IN_PROGRESS until external event marks it complete
                </p>
              </div>
              <Switch
                checked={config.inputParameters.http_request.asyncComplete || false}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    inputParameters: {
                      ...config.inputParameters,
                      http_request: {
                        ...config.inputParameters.http_request,
                        asyncComplete: checked,
                      },
                    },
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-background border border-border rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Headers</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Add Authorization header with Bearer token for secure endpoints
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleAddHeader}
              className="bg-cyan-500 text-foreground hover:bg-cyan-600 text-xs"
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
                  placeholder="Header name (e.g., Authorization)"
                  className="flex-1 bg-card text-foreground border-border"
                />
                <Input
                  value={header.value}
                  onChange={(e) => handleHeaderChange(header.id, 'value', e.target.value)}
                  placeholder="Header value"
                  className="flex-1 bg-card text-foreground border-border"
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

        <div className="p-6 bg-background border border-border rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-4">Request Body</h3>
          <p className="text-xs text-muted-foreground mb-2">Required for POST, PUT, and PATCH methods</p>
          <JsonTextarea
            value={bodyJson}
            onChange={(value) => {
              setBodyJson(value);
              // Sync to config
              let body: Record<string, unknown> | string | undefined = undefined;
              if (value.trim()) {
                try {
                  body = JSON.parse(value);
                } catch {
                  body = value;
                }
              }
              setConfig({
                ...config,
                inputParameters: {
                  ...config.inputParameters,
                  http_request: { ...config.inputParameters.http_request, body },
                },
              });
            }}
            className="mt-2 font-mono text-sm bg-card text-foreground min-h-[150px]"
            placeholder='{"key": "value"}'
          />
        </div>
      </div>
    ),
  };

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSaveWithMerge}
      initialConfig={config}
      title="Configure HTTP Task"
      description="Configure an HTTP task to make API calls (OSS Conductor compatible)"
      buttonLabel="Save Configuration"
      customTabs={[httpRequestTab]}
      validateConfig={validateConfig}
    />
  );
}

