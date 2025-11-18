import { useState, useEffect } from 'react';
import { BaseTaskModal, BaseTaskConfig } from '../BaseTaskModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface JoinConfig extends BaseTaskConfig {
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
  readonly initialConfig?: JoinConfig;
}

export function JoinModal({ open, onOpenChange, onSave, initialConfig }: JoinModalProps) {
  const [config, setConfig] = useState<JoinConfig>({
    taskRefId: 'join-1',
    name: 'Join',
    taskType: 'JOIN',
    joinOn: [],
  });

  const [joinOnInput, setJoinOnInput] = useState('');

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setConfig({ ...initialConfig });
        setJoinOnInput('');
      } else {
        const timestamp = Date.now();
        setConfig({
          taskRefId: `join-${timestamp}`,
          name: 'Join',
          taskType: 'JOIN',
          joinOn: [],
        });
        setJoinOnInput('');
      }
    }
  }, [open, initialConfig]);

  const handleAddJoinOn = () => {
    if (joinOnInput.trim()) {
      setConfig({
        ...config,
        joinOn: [...(config.joinOn || []), joinOnInput.trim()],
      });
      setJoinOnInput('');
    }
  };

  const handleRemoveJoinOn = (index: number) => {
    setConfig({
      ...config,
      joinOn: config.joinOn?.filter((_, i) => i !== index),
    });
  };

  const customBasicFields = (
    <div>
      <Label className="text-white">Join On (Task Ref IDs)</Label>
      <div className="mt-1 flex gap-2">
        <Input
          value={joinOnInput}
          onChange={(e) => setJoinOnInput(e.target.value)}
          placeholder="e.g., task-ref-1"
          className="flex-1 bg-[#1a1f2e] text-white border-[#2a3142]"
        />
        <Button onClick={handleAddJoinOn} size="sm" className="bg-cyan-500 text-white hover:bg-cyan-600">
          Add
        </Button>
      </div>
      <div className="mt-2 space-y-2">
        {config.joinOn?.map((joinRef, index) => (
          <div
            key={joinRef}
            className="flex items-center justify-between bg-[#1a1f2e] p-2 rounded border border-[#2a3142]"
          >
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
  );

  return (
    <BaseTaskModal
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      initialConfig={config}
      title="Create Join Operator"
      buttonLabel="Save Operator"
      customBasicFields={customBasicFields}
    />
  );
}
