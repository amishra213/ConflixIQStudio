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

export interface WaitConfig {
  taskRefId: string;
  name?: string;
  taskType: 'WAIT';
  duration?: number;
  timeUnit?: string;
  description?: string;
}

interface WaitModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: WaitConfig) => void;
}

export function WaitModal({ open, onOpenChange, onSave }: WaitModalProps) {
  const [config, setConfig] = useState<WaitConfig>({
    taskRefId: 'wait-1',
    name: 'Wait',
    taskType: 'WAIT',
    timeUnit: 'SECONDS',
  });

  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        taskRefId: `wait-${timestamp}`,
        name: 'Wait',
        taskType: 'WAIT',
        timeUnit: 'SECONDS',
      });
      setJsonError('');
    }
  }, [open]);

  const handleSave = () => {
    if (!config.taskRefId || config.taskRefId.trim() === '') {
      setJsonError('Task Reference ID is required');
      return;
    }

    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1f2e] border-[#2a3142] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create Wait Operator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
            <div className="space-y-3">
              <div>
                <Label className="text-white">Task Ref ID *</Label>
                <Input
                  value={config.taskRefId}
                  onChange={(e) => setConfig({ ...config, taskRefId: e.target.value })}
                  placeholder="e.g., wait-1"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Name</Label>
                <Input
                  value={config.name || ''}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="e.g., Wait"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white">Duration</Label>
                  <Input
                    type="number"
                    value={config.duration || ''}
                    onChange={(e) => setConfig({ ...config, duration: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Duration value"
                    className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                  />
                </div>
                <div>
                  <Label className="text-white">Time Unit</Label>
                  <Input
                    value={config.timeUnit || ''}
                    onChange={(e) => setConfig({ ...config, timeUnit: e.target.value })}
                    placeholder="e.g., SECONDS, MINUTES, HOURS"
                    className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                  />
                </div>
              </div>
              <div>
                <Label className="text-white">Description</Label>
                <Textarea
                  value={config.description || ''}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  placeholder="Describe this operator"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] min-h-[80px]"
                />
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
            disabled={!!jsonError}
            className="bg-cyan-500 text-white hover:bg-cyan-600"
          >
            Create Operator
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
