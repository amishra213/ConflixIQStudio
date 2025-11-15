import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus, Trash2 } from 'lucide-react';

export interface KafkaRequest {
  topic: string;
  key?: string;
  value: any;
  headers?: Record<string, string>;
}

export interface KafkaPublishTaskConfig {
  type: 'KAFKA_PUBLISH';
  name: string;
  taskReferenceName: string;
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
  const [jsonError, setJsonError] = useState('');

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
      setJsonError('');
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

  const handleSave = () => {
    if (!config.name || config.name.trim() === '') {
      setJsonError('Name is required');
      return;
    }
    if (!config.taskReferenceName || config.taskReferenceName.trim() === '') {
      setJsonError('Task Reference Name is required');
      return;
    }
    if (!config.kafka_request.topic || config.kafka_request.topic.trim() === '') {
      setJsonError('Topic is required');
      return;
    }

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
      ...config,
      kafka_request: {
        ...config.kafka_request,
        value: value,
        headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
      },
    };

    onSave(updatedConfig);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1f2e] border-[#2a3142] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create Kafka Publish Task</DialogTitle>
          <DialogDescription className="text-sm text-gray-400">Configure a Kafka publish task to send messages to Kafka topics.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#0f1419] border-[#2a3142]">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="kafka">Kafka Config</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-3">
              <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
                <div className="space-y-3">
                  <div>
                    <Label className="text-white">Name *</Label>
                    <Input
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      placeholder="Kafka Publish task name"
                      className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task Reference Name *</Label>
                    <Input
                      value={config.taskReferenceName}
                      onChange={(e) => setConfig({ ...config, taskReferenceName: e.target.value })}
                      placeholder="e.g., kafka_publish_1"
                      className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="kafka" className="space-y-3">
              <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
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
                      onChange={(e) => setValueText(e.target.value)}
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
              </Card>
            </TabsContent>
          </Tabs>

          {jsonError && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{jsonError}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-cyan-500 text-white hover:bg-cyan-600"
          >
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
