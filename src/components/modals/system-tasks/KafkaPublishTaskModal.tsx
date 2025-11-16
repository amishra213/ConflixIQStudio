import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export interface KafkaRequest {
  topic: string;
  key?: string;
  value: any;
  headers?: Record<string, string>;
}

export interface KafkaPublishTaskConfig extends BaseTaskConfig {
  type: 'KAFKA_PUBLISH';
  kafka_request: KafkaRequest;
}

interface KafkaPublishTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: KafkaPublishTaskConfig) => void;
}

export function KafkaPublishTaskModal({ open, onOpenChange, onSave }: KafkaPublishTaskModalProps) {
  const [config, setConfig] = useState<KafkaPublishTaskConfig>({
    type: 'KAFKA_PUBLISH',
    name: '',
    taskReferenceName: '',
    kafka_request: {
      topic: '',
      value: {},
    },
  });

  const [headers, setHeaders] = useState<Array<{id: string; key: string; value: string}>>([]);
  const [valueText, setValueText] = useState('');

  useEffect(() => {
    if (open) {
      setConfig({
        type: 'KAFKA_PUBLISH',
        name: '',
        taskReferenceName: '',
        kafka_request: {
          topic: '',
          value: {},
        },
      });
      setHeaders([]);
      setValueText('');
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
      kafka_request: { ...config.kafka_request, headers: Object.keys(headersObj).length > 0 ? headersObj : undefined },
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
      kafka_request: { ...config.kafka_request, headers: Object.keys(headersObj).length > 0 ? headersObj : undefined },
    });
  };

  const validateConfig = (cfg: KafkaPublishTaskConfig): string | null => {
    if (!cfg.kafka_request.topic || cfg.kafka_request.topic.trim() === '') {
      return 'Topic is required';
    }
    return null;
  };

  // Before saving, merge headers and value into kafka_request
  const handleSaveWithMerge = (cfg: KafkaPublishTaskConfig) => {
    const headersObj: Record<string, string> = {};
    for (const h of headers) {
      if (h.key && h.value) {
        headersObj[h.key] = h.value;
      }
    }

    let value: any = {};
    if (valueText.trim()) {
      try {
        value = JSON.parse(valueText);
      } catch {
        value = valueText;
      }
    }

    const updatedConfig: KafkaPublishTaskConfig = {
      ...cfg,
      kafka_request: {
        ...cfg.kafka_request,
        value: value,
        headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
      },
    };

    onSave(updatedConfig);
  };

  const kafkaTab = {
    id: 'kafka',
    label: 'Kafka Config',
    content: (
      <div className="space-y-3">
        <div>
          <Label className="text-white">Topic *</Label>
          <Input
            value={config.kafka_request.topic}
            onChange={(e) =>
              setConfig({
                ...config,
                kafka_request: { ...config.kafka_request, topic: e.target.value },
              })
            }
            placeholder="Kafka topic name"
            className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
          />
        </div>

        <div>
          <Label className="text-white">Key</Label>
          <Input
            value={config.kafka_request.key || ''}
            onChange={(e) =>
              setConfig({
                ...config,
                kafka_request: { ...config.kafka_request, key: e.target.value },
              })
            }
            placeholder="Optional message key"
            className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
          />
        </div>

        <div>
          <Label className="text-white">Value (JSON) *</Label>
          <Textarea
            value={valueText}
            onChange={(e) => {
              setValueText(e.target.value);
              // Sync to config
              let value: any = {};
              if (e.target.value.trim()) {
                try {
                  value = JSON.parse(e.target.value);
                } catch {
                  value = e.target.value;
                }
              }
              setConfig({
                ...config,
                kafka_request: { ...config.kafka_request, value },
              });
            }}
            placeholder='{"message": "hello"}'
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
      title="Create Kafka Publish Task"
      description="Configure a Kafka publish task to send messages to Kafka topics."
      buttonLabel="Save Configuration"
      customTabs={[kafkaTab]}
      validateConfig={validateConfig}
    />
  );
}
