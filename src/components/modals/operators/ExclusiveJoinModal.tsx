import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export interface ExclusiveJoinConfig extends BaseTaskConfig {
  taskRefId: string;
  taskType: 'EXCLUSIVE_JOIN';
  joinOn?: string[];
}

interface ExclusiveJoinModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: ExclusiveJoinConfig) => void;
  readonly initialConfig?: ExclusiveJoinConfig;
}

export function ExclusiveJoinModal({ open, onOpenChange, onSave, initialConfig }: ExclusiveJoinModalProps) {
  const [config, setConfig] = useState<ExclusiveJoinConfig>({
    taskRefId: 'exclusiveJoin-1',
    name: 'Exclusive Join',
    taskType: 'EXCLUSIVE_JOIN',
    joinOn: [],
  });

  const [joinOnItems, setJoinOnItems] = useState<Array<{id: string; value: string}>>([]);

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setConfig(initialConfig);
        // Convert existing joinOn array to items with IDs for editing
        const loadedItems = (initialConfig.joinOn || []).map((value, index) => ({
          id: `join-${index}-${Date.now()}`,
          value: value,
        }));
        setJoinOnItems(loadedItems);
      } else {
        const timestamp = Date.now();
        setConfig({
          taskRefId: `exclusiveJoin-${timestamp}`,
          name: 'Exclusive Join',
          taskType: 'EXCLUSIVE_JOIN',
          joinOn: [],
        });
        setJoinOnItems([]);
      }
    }
  }, [open, initialConfig]);

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

  const handleSaveModal = (finalConfig: ExclusiveJoinConfig) => {
    onSave({ 
      ...finalConfig, 
      joinOn: joinOnItems.map((item) => item.value).filter((value) => value.trim() !== '') 
    });
    onOpenChange(false);
  };

  const customBasicFields = (
    <div>
      <div className="flex justify-between items-center mb-3">
        <Label className="text-white font-semibold">Join On Task Refs</Label>
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
      <p className="text-xs text-gray-400 mt-2">Task references to wait for before completing join</p>
    </div>
  );

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSaveModal}
      initialConfig={config}
      title="Create Exclusive Join Operator"
      description="Wait for one of multiple tasks to complete"
      buttonLabel="Create Operator"
      customBasicFields={customBasicFields}
    />
  );
}
