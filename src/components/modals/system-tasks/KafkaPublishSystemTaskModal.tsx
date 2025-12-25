import { useState, useEffect, useMemo, useCallback } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { JsonTextarea } from '@/components/ui/json-textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export interface KafkaRequest {
  topic: string;
  key?: string;
  value: string | Record<string, unknown>;
  headers?: Record<string, string>;
  bootStrapServers?: string;
  keySerializer?: string;
}

export interface KafkaPublishTaskConfig extends BaseTaskConfig {
  type: 'KAFKA_PUBLISH';
  inputParameters?: {
    kafka_request: KafkaRequest;
    [key: string]: unknown;
  };
  kafka_request?: KafkaRequest; // Legacy support during transition
}

interface KafkaPublishTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: KafkaPublishTaskConfig) => void;
  readonly initialConfig?: KafkaPublishTaskConfig | null;
}

export function KafkaPublishTaskModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: KafkaPublishTaskModalProps) {
  // Use state for kafka-specific fields to ensure they persist across tab changes
  const [topic, setTopic] = useState('userTopic');
  const [key, setKey] = useState('');
  const [bootStrapServers, setBootStrapServers] = useState('localhost:9092');
  const [keySerializer, setKeySerializer] = useState('');
  const [headers, setHeaders] = useState<Array<{ id: string; key: string; value: string }>>([]);
  const [valueText, setValueText] = useState('Message to publish');

  // Reset local state when modal opens
  useEffect(() => {
    if (open) {
      // Get kafka_request from either inputParameters or legacy kafka_request field
      const kafkaReq =
        initialConfig?.inputParameters?.kafka_request || initialConfig?.kafka_request;

      if (kafkaReq) {
        // Load configuration from initialConfig
        setTopic(kafkaReq.topic || 'userTopic');
        setKey(kafkaReq.key || '');
        setBootStrapServers(kafkaReq.bootStrapServers || 'localhost:9092');
        setKeySerializer(kafkaReq.keySerializer || '');

        const headerEntries = Object.entries(kafkaReq.headers || {});
        const headerList = headerEntries.map(([key, value], index) => ({
          id: `header-${Date.now()}-${index}`,
          key,
          value: String(value),
        }));
        setHeaders(headerList);

        setValueText(
          typeof kafkaReq.value === 'object'
            ? JSON.stringify(kafkaReq.value, null, 2)
            : String(kafkaReq.value || 'Message to publish')
        );

        console.log('KafkaPublishTaskModal loaded with config:', initialConfig);
      } else {
        // Default configuration
        setTopic('userTopic');
        setKey('');
        setBootStrapServers('localhost:9092');
        setKeySerializer('');
        setHeaders([]);
        setValueText('Message to publish');

        if (initialConfig) {
          console.log(
            'KafkaPublishTaskModal: initialConfig missing kafka_request property:',
            initialConfig
          );
        }
      }
    }
  }, [open, initialConfig]);

  const handleAddHeader = useCallback(() => {
    const newId = `header-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setHeaders((prev) => [...prev, { id: newId, key: '', value: '' }]);
  }, []);

  const handleRemoveHeader = useCallback((id: string) => {
    setHeaders((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const handleHeaderChange = useCallback((id: string, field: 'key' | 'value', val: string) => {
    setHeaders((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: val } : h)));
  }, []);

  const validateConfig = (): string | null => {
    // Validate using the state values
    if (!topic || topic.trim() === '') {
      return 'Topic is required';
    }
    return null;
  };

  // Before saving, merge headers and value into kafka_request
  const handleSaveWithMerge = useCallback(
    (cfg: KafkaPublishTaskConfig) => {
      const timestamp = Date.now();
      const headersObj: Record<string, string> = {};
      for (const h of headers) {
        if (h.key && h.value) {
          headersObj[h.key] = h.value;
        }
      }

      let value: string | Record<string, unknown> = {};
      if (valueText.trim()) {
        try {
          value = JSON.parse(valueText);
        } catch {
          value = valueText;
        }
      }

      const kafkaRequest: KafkaRequest = {
        topic: topic,
        value: value,
      };

      // Add optional fields if they have values
      if (key) kafkaRequest.key = key;
      if (bootStrapServers && bootStrapServers !== 'localhost:9092')
        kafkaRequest.bootStrapServers = bootStrapServers;
      if (keySerializer) kafkaRequest.keySerializer = keySerializer;
      if (Object.keys(headersObj).length > 0) kafkaRequest.headers = headersObj;

      const updatedConfig: KafkaPublishTaskConfig = {
        name: cfg.name || `kafka_${timestamp}`,
        taskReferenceName: cfg.taskReferenceName || `kafka_ref_${timestamp}`,
        description: cfg.description,
        type: 'KAFKA_PUBLISH',
        inputParameters: {
          kafka_request: kafkaRequest,
        },
      };

      onSave(updatedConfig);
    },
    [topic, key, bootStrapServers, keySerializer, valueText, headers, onSave]
  );

  // Build current config with current kafka fields for JSON preview
  // This will update when kafka fields change, showing them in JSON tab
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentConfig = useMemo<KafkaPublishTaskConfig>(() => {
    const headersObj: Record<string, string> = {};
    for (const h of headers) {
      if (h.key && h.value) {
        headersObj[h.key] = h.value;
      }
    }

    let value: unknown = {};
    if (valueText.trim()) {
      try {
        value = JSON.parse(valueText);
      } catch {
        value = valueText;
      }
    }

    const kafkaRequest: KafkaRequest = {
      topic: topic,
      value: value as string | Record<string, unknown>,
    };

    // Add optional fields if they have values
    if (key) kafkaRequest.key = key;
    if (bootStrapServers && bootStrapServers !== 'localhost:9092')
      kafkaRequest.bootStrapServers = bootStrapServers;
    if (keySerializer) kafkaRequest.keySerializer = keySerializer;
    if (Object.keys(headersObj).length > 0) kafkaRequest.headers = headersObj;

    return {
      type: 'KAFKA_PUBLISH',
      name: initialConfig?.name || 'kafka',
      taskReferenceName: initialConfig?.taskReferenceName || 'kafka_ref',
      description: initialConfig?.description,
      inputParameters: {
        kafka_request: kafkaRequest,
      },
    };
  }, [topic, key, bootStrapServers, keySerializer, valueText, headers, initialConfig]);

  // Create kafka tab content dynamically so it updates with state changes
  const kafkaTab = useMemo(
    () => ({
      id: 'kafka',
      label: 'Kafka Config',
      content: (
        <div className="space-y-3" style={{ '--line-height': '1.5rem' } as React.CSSProperties}>
          <div>
            <Label className="text-foreground">Topic *</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Kafka topic name"
              className="mt-1 bg-card text-foreground border-border"
            />
          </div>

          <div>
            <Label className="text-foreground">Key</Label>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Optional message key"
              className="mt-1 bg-card text-foreground border-border"
            />
          </div>

          <div>
            <Label className="text-foreground">Value *</Label>
            <JsonTextarea
              value={valueText}
              onChange={(value) => {
                setValueText(value);
              }}
              placeholder="Message to publish"
              className="mt-1 bg-card text-foreground font-mono text-sm min-h-[100px]"
            />
          </div>

          <div>
            <Label className="text-foreground">Bootstrap Servers</Label>
            <Input
              value={bootStrapServers}
              onChange={(e) => setBootStrapServers(e.target.value)}
              placeholder="localhost:9092"
              className="mt-1 bg-card text-foreground border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">Kafka broker addresses (comma-separated)</p>
          </div>

          <div>
            <Label className="text-foreground">Key Serializer</Label>
            <Input
              value={keySerializer}
              onChange={(e) => setKeySerializer(e.target.value)}
              placeholder="org.apache.kafka.common.serialization.IntegerSerializer"
              className="mt-1 bg-card text-foreground border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">Serializer class for message key</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-foreground">Headers</Label>
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
                    placeholder="Header name"
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
        </div>
      ),
    }),
    [
      topic,
      key,
      bootStrapServers,
      keySerializer,
      valueText,
      headers,
      handleAddHeader,
      handleHeaderChange,
      handleRemoveHeader,
    ]
  );

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSaveWithMerge}
      initialConfig={currentConfig}
      title="Create Kafka Publish Task"
      description="Configure a Kafka publish task to send messages to Kafka topics."
      buttonLabel="Save Configuration"
      customTabs={[kafkaTab]}
      validateConfig={validateConfig}
    />
  );
}

