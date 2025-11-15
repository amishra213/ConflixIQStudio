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

export interface SetVariableConfig {
  taskRefId: string;
  name?: string;
  taskType: 'SET_VARIABLE';
  variablesToSet?: Record<string, any>;
  description?: string;
}

interface SetVariableModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: SetVariableConfig) => void;
}

export function SetVariableModal({ open, onOpenChange, onSave }: SetVariableModalProps) {
  const [config, setConfig] = useState<SetVariableConfig>({
    taskRefId: 'setVariable-1',
    name: 'Set Variable',
    taskType: 'SET_VARIABLE',
    variablesToSet: {},
  });

  const [variables, setVariables] = useState<Array<{ id: string; key: string; value: string }>>([]);
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        taskRefId: `setVariable-${timestamp}`,
        name: 'Set Variable',
        taskType: 'SET_VARIABLE',
        variablesToSet: {},
      });
      setVariables([]);
      setJsonError('');
    }
  }, [open]);

  const handleAddVariable = () => {
    const newId = `var-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setVariables([...variables, { id: newId, key: '', value: '' }]);
  };

  const handleRemoveVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id));
  };

  const handleVariableChange = (id: string, field: 'key' | 'value', val: string) => {
    setVariables(variables.map((v) => 
      v.id === id ? { ...v, [field]: val } : v
    ));
  };

  const handleSave = () => {
    if (!config.taskRefId || config.taskRefId.trim() === '') {
      setJsonError('Task Reference ID is required');
      return;
    }

    const variablesToSet: Record<string, any> = {};
    for (const v of variables) {
      if (v.key && v.value) {
        try {
          variablesToSet[v.key] = JSON.parse(v.value);
        } catch {
          variablesToSet[v.key] = v.value;
        }
      }
    }

    onSave({ ...config, variablesToSet });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1f2e] border-[#2a3142] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create Set Variable Operator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
            <div className="space-y-3">
              <div>
                <Label className="text-white">Task Ref ID *</Label>
                <Input
                  value={config.taskRefId}
                  onChange={(e) => setConfig({ ...config, taskRefId: e.target.value })}
                  placeholder="e.g., setVariable-1"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Name</Label>
                <Input
                  value={config.name || ''}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="e.g., Set Variable"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-white">Variables</Label>
                  <Button
                    size="sm"
                    onClick={handleAddVariable}
                    className="bg-cyan-500 text-white hover:bg-cyan-600 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Variable
                  </Button>
                </div>
                <div className="space-y-2">
                  {variables.map((variable) => (
                    <div key={variable.id} className="flex gap-2">
                      <Input
                        value={variable.key}
                        onChange={(e) => handleVariableChange(variable.id, 'key', e.target.value)}
                        placeholder="Variable name"
                        className="flex-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                      <Input
                        value={variable.value}
                        onChange={(e) => handleVariableChange(variable.id, 'value', e.target.value)}
                        placeholder="Value (JSON or string)"
                        className="flex-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveVariable(variable.id)}
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
