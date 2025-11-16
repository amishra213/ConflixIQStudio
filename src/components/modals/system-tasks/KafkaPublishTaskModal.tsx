import { useState, useEffect, useMemo, useCallback } from 'react';
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
  // Use state for kafka-specific fields to ensure they persist across tab changes
  const [topic, setTopic] = useState('');
  const [key, setKey] = useState('');
  const [headers, setHeaders] = useState<Array<{id: string; key: string; value: string}>>([]);
  const [valueText, setValueText] = useState('');

  // Reset local state when modal opens
  useEffect(() => {
    if (open) {
      setTopic('');
      setKey('');
      setHeaders([]);
      setValueText('');
    }
  }, [open]);

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

  const validateConfig = (): string | null => {
    // Validate using the state values
    if (!topic || topic.trim() === '') {
      return 'Topic is required';
    }
    return null;
  };

  // Before saving, merge headers and value into kafka_request
  const handleSaveWithMerge = useCallback((cfg: KafkaPublishTaskConfig) => {
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
        topic: topic,
        key: key || undefined,
        value: value,
        headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
      },
    };

    onSave(updatedConfig);
  }, [topic, key, valueText, headers, onSave]);

  // Build initial config with current kafka fields for JSON preview
  // This will update when kafka fields change, showing them in JSON tab
  const initialConfig = useMemo<KafkaPublishTaskConfig>(() => {
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

    return {
      type: 'KAFKA_PUBLISH',
      name: '',
      taskReferenceName: '',
      kafka_request: {
        topic: topic,
        key: key || undefined,
        value: value,
        headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
      },
    };
  }, [topic, key, valueText, headers]);

  // Create kafka tab content dynamically so it updates with state changes
  const kafkaTab = useMemo(() => ({
    id: 'kafka',
    label: 'Kafka Config',
    content: (
      <div className="space-y-3">
        <div>
          <Label className="text-white">Topic *</Label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Kafka topic name"
            className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
          />
        </div>

        <div>
          <Label className="text-white">Key</Label>
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
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
  }), [topic, key, valueText, headers]);

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSaveWithMerge}
      initialConfig={initialConfig}
      title="Create Kafka Publish Task"
      description="Configure a Kafka publish task to send messages to Kafka topics."
      buttonLabel="Save Configuration"
      customTabs={[kafkaTab]}
      validateConfig={validateConfig}
    />
  );
}
