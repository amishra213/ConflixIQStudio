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

export interface ForkJoinDynamicConfig {
  taskRefId: string;
  name?: string;
  taskType: 'FORK_JOIN_DYNAMIC';
  dynamicForkTasksParam: string;
  dynamicForkTasksInputParamName?: string;
  forkTaskType?: string;
  description?: string;
}

interface ForkJoinDynamicModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: ForkJoinDynamicConfig) => void;
}

export function ForkJoinDynamicModal({ open, onOpenChange, onSave }: ForkJoinDynamicModalProps) {
  const [config, setConfig] = useState<ForkJoinDynamicConfig>({
    taskRefId: 'fork-join-dynamic-1',
    name: 'Fork Join Dynamic',
    taskType: 'FORK_JOIN_DYNAMIC',
    dynamicForkTasksParam: 'forkedTasks',
  });

  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        taskRefId: `fork-join-dynamic-${timestamp}`,
        name: 'Fork Join Dynamic',
        taskType: 'FORK_JOIN_DYNAMIC',
        dynamicForkTasksParam: 'forkedTasks',
      });
      setJsonError('');
    }
  }, [open]);

  const handleSave = () => {
    if (!config.taskRefId || config.taskRefId.trim() === '') {
      setJsonError('Task Reference ID is required');
      return;
    }
    if (!config.dynamicForkTasksParam || config.dynamicForkTasksParam.trim() === '') {
      setJsonError('Dynamic Fork Tasks Parameter is required');
      return;
    }

    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1f2e] border-[#2a3142] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create Fork Join Dynamic Operator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
            <div className="space-y-3">
              <div>
                <Label className="text-white">Task Ref ID *</Label>
                <Input
                  value={config.taskRefId}
                  onChange={(e) => setConfig({ ...config, taskRefId: e.target.value })}
                  placeholder="e.g., fork-join-dynamic-1"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Name</Label>
                <Input
                  value={config.name || ''}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="e.g., Fork Join Dynamic"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Dynamic Fork Tasks Parameter *</Label>
                <Input
                  value={config.dynamicForkTasksParam}
                  onChange={(e) => setConfig({ ...config, dynamicForkTasksParam: e.target.value })}
                  placeholder="e.g., forkedTasks"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Dynamic Fork Tasks Input Param Name</Label>
                <Input
                  value={config.dynamicForkTasksInputParamName || ''}
                  onChange={(e) => setConfig({ ...config, dynamicForkTasksInputParamName: e.target.value })}
                  placeholder="e.g., taskList"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Fork Task Type</Label>
                <Input
                  value={config.forkTaskType || ''}
                  onChange={(e) => setConfig({ ...config, forkTaskType: e.target.value })}
                  placeholder="e.g., SIMPLE"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
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
