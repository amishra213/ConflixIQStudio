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
import { Switch } from '@/components/ui/switch';

export interface EventSystemTaskConfig {
  type: 'EVENT';
  name: string;
  taskReferenceName: string;
  sink: string;
  asyncComplete?: boolean;
}

interface EventSystemTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: EventSystemTaskConfig) => void;
}

export function EventSystemTaskModal({
  open,
  onOpenChange,
  onSave,
}: EventSystemTaskModalProps) {
  const [config, setConfig] = useState<EventSystemTaskConfig>({
    type: 'EVENT',
    name: '',
    taskReferenceName: '',
    sink: '',
    asyncComplete: false,
  });

  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      setConfig({
        type: 'EVENT',
        name: '',
        taskReferenceName: '',
        sink: '',
        asyncComplete: false,
      });
      setJsonError('');
    }
  }, [open]);

  const handleSave = () => {
    if (!config.name || config.name.trim() === '') {
      setJsonError('Name is required');
      return;
    }
    if (!config.taskReferenceName || config.taskReferenceName.trim() === '') {
      setJsonError('Task Reference Name is required');
      return;
    }
    if (!config.sink || config.sink.trim() === '') {
      setJsonError('Sink is required');
      return;
    }

    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1f2e] border-[#2a3142] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create EVENT System Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
            <div className="space-y-3">
              <div>
                <Label className="text-white">Name *</Label>
                <Input
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="EVENT task name"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Task Reference Name *</Label>
                <Input
                  value={config.taskReferenceName}
                  onChange={(e) => setConfig({ ...config, taskReferenceName: e.target.value })}
                  placeholder="e.g., event_1"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Sink *</Label>
                <Input
                  value={config.sink}
                  onChange={(e) => setConfig({ ...config, sink: e.target.value })}
                  placeholder="e.g., sqs, sns, kafka"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.asyncComplete ?? false}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, asyncComplete: checked })
                  }
                />
                <Label className="text-white">Async Complete</Label>
              </div>
            </div>
          </Card>

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
