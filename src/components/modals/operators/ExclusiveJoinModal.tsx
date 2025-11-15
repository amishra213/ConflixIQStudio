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
import { Plus, Trash2 } from 'lucide-react';

export interface ExclusiveJoinConfig {
  taskRefId: string;
  name?: string;
  taskType: 'EXCLUSIVE_JOIN';
  joinOn?: string[];
  description?: string;
}

interface ExclusiveJoinModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: ExclusiveJoinConfig) => void;
}

export function ExclusiveJoinModal({ open, onOpenChange, onSave }: ExclusiveJoinModalProps) {
  const [config, setConfig] = useState<ExclusiveJoinConfig>({
    taskRefId: 'exclusiveJoin-1',
    name: 'Exclusive Join',
    taskType: 'EXCLUSIVE_JOIN',
    joinOn: [],
  });

  const [joinOnItems, setJoinOnItems] = useState<Array<{id: string; value: string}>>([]);
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        taskRefId: `exclusiveJoin-${timestamp}`,
        name: 'Exclusive Join',
        taskType: 'EXCLUSIVE_JOIN',
        joinOn: [],
      });
      setJoinOnItems([]);
      setJsonError('');
    }
  }, [open]);

  const handleAddJoinOn = () => {
    const newId = `join-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setJoinOnItems([...joinOnItems, { id: newId, value: '' }]);
  };

  const handleRemoveJoinOn = (id: string) => {
    setJoinOnItems(joinOnItems.filter((item) => item.id !== id));
  };

  const handleJoinOnChange = (id: string, value: string) => {
    setJoinOnItems(joinOnItems.map((item) => 
      item.id === id ? { ...item, value } : item
    ));
  };

  const handleSave = () => {
    if (!config.taskRefId || config.taskRefId.trim() === '') {
      setJsonError('Task Reference ID is required');
      return;
    }

    onSave({ ...config, joinOn: joinOnItems.map((item) => item.value).filter((value) => value.trim() !== '') });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1f2e] border-[#2a3142] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create Exclusive Join Operator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
            <div className="space-y-3">
              <div>
                <Label className="text-white">Task Ref ID *</Label>
                <Input
                  value={config.taskRefId}
                  onChange={(e) => setConfig({ ...config, taskRefId: e.target.value })}
                  placeholder="e.g., exclusiveJoin-1"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Name</Label>
                <Input
                  value={config.name || ''}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="e.g., Exclusive Join"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-white">Join On Task Refs</Label>
                  <Button
                    size="sm"
                    onClick={handleAddJoinOn}
                    className="bg-cyan-500 text-white hover:bg-cyan-600 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Task
                  </Button>
                </div>
                <div className="space-y-2">
                  {joinOnItems.map((item) => (
                    <div key={item.id} className="flex gap-2">
                      <Input
                        value={item.value}
                        onChange={(e) => handleJoinOnChange(item.id, e.target.value)}
                        placeholder="Task reference ID"
                        className="flex-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveJoinOn(item.id)}
                        className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        <Trash2 className="w-3 h-3" />
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
