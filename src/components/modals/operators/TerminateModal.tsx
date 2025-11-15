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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

export interface TerminateConfig {
  taskRefId: string;
  name?: string;
  taskType: 'TERMINATE';
  terminationStatus?: 'COMPLETED' | 'FAILED' | 'TIMED_OUT';
  terminationReason?: string;
  description?: string;
}

interface TerminateModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: TerminateConfig) => void;
}

export function TerminateModal({ open, onOpenChange, onSave }: TerminateModalProps) {
  const [config, setConfig] = useState<TerminateConfig>({
    taskRefId: 'terminate-1',
    name: 'Terminate',
    taskType: 'TERMINATE',
    terminationStatus: 'COMPLETED',
  });

  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        taskRefId: `terminate-${timestamp}`,
        name: 'Terminate',
        taskType: 'TERMINATE',
        terminationStatus: 'COMPLETED',
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
          <DialogTitle className="text-2xl font-semibold">Create Terminate Operator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
            <div className="space-y-3">
              <div>
                <Label className="text-white">Task Ref ID *</Label>
                <Input
                  value={config.taskRefId}
                  onChange={(e) => setConfig({ ...config, taskRefId: e.target.value })}
                  placeholder="e.g., terminate-1"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Name</Label>
                <Input
                  value={config.name || ''}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="e.g., Terminate"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Termination Status</Label>
                <Select
                  value={config.terminationStatus}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      terminationStatus: value as 'COMPLETED' | 'FAILED' | 'TIMED_OUT',
                    })
                  }
                >
                  <SelectTrigger className="bg-[#1a1f2e] text-white border-[#2a3142]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    <SelectItem value="FAILED">FAILED</SelectItem>
                    <SelectItem value="TIMED_OUT">TIMED_OUT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Termination Reason</Label>
                <Textarea
                  value={config.terminationReason || ''}
                  onChange={(e) => setConfig({ ...config, terminationReason: e.target.value })}
                  placeholder="Reason for termination"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] min-h-[80px]"
                />
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
