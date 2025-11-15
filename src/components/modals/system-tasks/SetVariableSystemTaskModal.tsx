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

export interface SetVariableSystemTaskConfig {
  type: 'SET_VARIABLE';
  name: string;
  taskReferenceName: string;
  variableName: string;
  value: any;
}

interface SetVariableSystemTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: SetVariableSystemTaskConfig) => void;
}

export function SetVariableSystemTaskModal({
  open,
  onOpenChange,
  onSave,
}: SetVariableSystemTaskModalProps) {
  const [config, setConfig] = useState<SetVariableSystemTaskConfig>({
    type: 'SET_VARIABLE',
    name: '',
    taskReferenceName: '',
    variableName: '',
    value: {},
  });

  const [valueText, setValueText] = useState('');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      setConfig({
        type: 'SET_VARIABLE',
        name: '',
        taskReferenceName: '',
        variableName: '',
        value: {},
      });
      setValueText('');
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
    if (!config.variableName || config.variableName.trim() === '') {
      setJsonError('Variable Name is required');
      return;
    }

    let value: any = {};
    if (valueText.trim()) {
      try {
        value = JSON.parse(valueText);
      } catch {
        value = valueText;
      }
    }

    onSave({ ...config, value });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1f2e] border-[#2a3142] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create SET_VARIABLE System Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
            <div className="space-y-3">
              <div>
                <Label className="text-white">Name *</Label>
                <Input
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="SET_VARIABLE task name"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Task Reference Name *</Label>
                <Input
                  value={config.taskReferenceName}
                  onChange={(e) => setConfig({ ...config, taskReferenceName: e.target.value })}
                  placeholder="e.g., set_var_1"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Variable Name *</Label>
                <Input
                  value={config.variableName}
                  onChange={(e) => setConfig({ ...config, variableName: e.target.value })}
                  placeholder="e.g., myVariable"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Value (JSON or text)</Label>
                <Textarea
                  value={valueText}
                  onChange={(e) => setValueText(e.target.value)}
                  placeholder='{"key": "value"} or simple text'
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] font-mono text-sm min-h-[100px]"
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
            className="bg-cyan-500 text-white hover:bg-cyan-600"
          >
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
