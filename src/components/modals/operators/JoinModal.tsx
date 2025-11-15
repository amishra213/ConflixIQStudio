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

export interface JoinConfig {
  taskRefId: string;
  name?: string;
  taskType: 'JOIN';
  joinOn?: string[];
  description?: string;
}

interface JoinModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: JoinConfig) => void;
}

export function JoinModal({ open, onOpenChange, onSave }: JoinModalProps) {
  const [config, setConfig] = useState<JoinConfig>({
    taskRefId: 'join-1',
    name: 'Join',
    taskType: 'JOIN',
    joinOn: [],
  });

  const [joinOnInput, setJoinOnInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        taskRefId: `join-${timestamp}`,
        name: 'Join',
        taskType: 'JOIN',
        joinOn: [],
      });
      setJoinOnInput('');
      setJsonError('');
    }
  }, [open]);

  const handleAddJoinOn = () => {
    if (joinOnInput.trim()) {
      setConfig({
        ...config,
        joinOn: [...(config.joinOn || []), joinOnInput.trim()]
      });
      setJoinOnInput('');
    }
  };

  const handleRemoveJoinOn = (index: number) => {
    setConfig({
      ...config,
      joinOn: config.joinOn?.filter((_, i) => i !== index)
    });
  };

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
          <DialogTitle className="text-2xl font-semibold">Create Join Operator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
            <div className="space-y-3">
              <div>
                <Label className="text-white">Task Ref ID *</Label>
                <Input
                  value={config.taskRefId}
                  onChange={(e) => setConfig({ ...config, taskRefId: e.target.value })}
                  placeholder="e.g., join-1"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Name</Label>
                <Input
                  value={config.name || ''}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="e.g., Join"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Join On (Task Ref IDs)</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    value={joinOnInput}
                    onChange={(e) => setJoinOnInput(e.target.value)}
                    placeholder="e.g., task-ref-1"
                    className="flex-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                  />
                  <Button
                    onClick={handleAddJoinOn}
                    size="sm"
                    className="bg-cyan-500 text-white hover:bg-cyan-600"
                  >
                    Add
                  </Button>
                </div>
                <div className="mt-2 space-y-2">
                  {config.joinOn?.map((joinRef, index) => (
                    <div key={joinRef} className="flex items-center justify-between bg-[#1a1f2e] p-2 rounded border border-[#2a3142]">
                      <span className="text-sm text-white">{joinRef}</span>
                      <Button
                        onClick={() => handleRemoveJoinOn(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-500/10"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
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
