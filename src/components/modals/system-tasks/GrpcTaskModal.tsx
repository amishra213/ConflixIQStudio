import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export interface GrpcRequest {
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface GrpcTaskConfig extends BaseTaskConfig {
  type: 'GRPC';
  grpc_request: GrpcRequest;
}

interface GrpcTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: GrpcTaskConfig) => void;
}

export function GrpcTaskModal({ open, onOpenChange, onSave }: GrpcTaskModalProps) {
  const [config, setConfig] = useState<GrpcTaskConfig>({
    type: 'GRPC',
    name: '',
    taskReferenceName: '',
    grpc_request: {
      endpoint: '',
      method: '',
      headers: {},
    },
  });

  const [headers, setHeaders] = useState<Array<{id: string; key: string; value: string}>>([]);
  const [bodyText, setBodyText] = useState('');

  useEffect(() => {
    if (open) {
      setConfig({
        type: 'GRPC',
        name: '',
        taskReferenceName: '',
        grpc_request: {
          endpoint: '',
          method: '',
          headers: {},
        },
      });
      setHeaders([]);
      setBodyText('');
    }
  }, [open]);

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
      grpc_request: { ...config.grpc_request, headers: Object.keys(headersObj).length > 0 ? headersObj : undefined },
    });
  };

  const handleHeaderChange = (id: string, field: 'key' | 'value', val: string) => {
    const updated = headers.map((h) => 
      h.id === id ? { ...h, [field]: val } : h
    );
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
      grpc_request: { ...config.grpc_request, headers: Object.keys(headersObj).length > 0 ? headersObj : undefined },
    });
  };

  const validateConfig = (cfg: GrpcTaskConfig): string | null => {
    if (!cfg.grpc_request.endpoint || cfg.grpc_request.endpoint.trim() === '') {
      return 'Endpoint is required';
    }
    if (!cfg.grpc_request.method || cfg.grpc_request.method.trim() === '') {
      return 'Method is required';
    }
    return null;
  };

  // Before saving, merge headers and body into grpc_request
  const handleSaveWithMerge = (cfg: GrpcTaskConfig) => {
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

    const updatedConfig: GrpcTaskConfig = {
      ...cfg,
      grpc_request: {
        ...cfg.grpc_request,
        headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
        body: body,
      },
    };

    onSave(updatedConfig);
  };

  const grpcTab = {
    id: 'grpc',
    label: 'GRPC Config',
    content: (
      <div className="space-y-3">
        <div>
          <Label className="text-white">Endpoint *</Label>
          <Input
            value={config.grpc_request.endpoint}
            onChange={(e) =>
              setConfig({
                ...config,
                grpc_request: { ...config.grpc_request, endpoint: e.target.value },
              })
            }
            placeholder="localhost:50051"
            className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
          />
        </div>

        <div>
          <Label className="text-white">Method *</Label>
          <Input
            value={config.grpc_request.method}
            onChange={(e) =>
              setConfig({
                ...config,
                grpc_request: { ...config.grpc_request, method: e.target.value },
              })
            }
            placeholder="package.ServiceName/MethodName"
            className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
          />
        </div>

        <div>
          <Label className="text-white">Body (JSON)</Label>
          <Textarea
            value={bodyText}
            onChange={(e) => {
              setBodyText(e.target.value);
              // Sync to config
              let body: any = undefined;
              if (e.target.value.trim()) {
                try {
                  body = JSON.parse(e.target.value);
                } catch {
                  body = e.target.value;
                }
              }
              setConfig({
                ...config,
                grpc_request: { ...config.grpc_request, body },
              });
            }}
            placeholder='{"field": "value"}'
            className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] font-mono text-sm min-h-[100px]"
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
      </div>
    ),
  };

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSaveWithMerge}
      initialConfig={config}
      title="Create GRPC System Task"
      buttonLabel="Save Configuration"
      customTabs={[grpcTab]}
      validateConfig={validateConfig}
    />
  );
}
