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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface InlineSystemTaskConfig {
  type: 'INLINE';
  name: string;
  taskReferenceName: string;
  evaluatorType: 'javascript' | 'graaljs';
  expression: string;
}

interface InlineSystemTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: InlineSystemTaskConfig) => void;
}

export function InlineSystemTaskModal({
  open,
  onOpenChange,
  onSave,
}: InlineSystemTaskModalProps) {
  const [config, setConfig] = useState<InlineSystemTaskConfig>({
    type: 'INLINE',
    name: '',
    taskReferenceName: '',
    evaluatorType: 'javascript',
    expression: '',
  });

  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      setConfig({
        type: 'INLINE',
        name: '',
        taskReferenceName: '',
        evaluatorType: 'javascript',
        expression: '',
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
    if (!config.expression || config.expression.trim() === '') {
      setJsonError('Expression is required');
      return;
    }

    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1f2e] border-[#2a3142] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create INLINE System Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
            <div className="space-y-3">
              <div>
                <Label className="text-white">Name *</Label>
                <Input
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="INLINE task name"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Task Reference Name *</Label>
                <Input
                  value={config.taskReferenceName}
                  onChange={(e) => setConfig({ ...config, taskReferenceName: e.target.value })}
                  placeholder="e.g., inline_1"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Evaluator Type *</Label>
                <Select
                  value={config.evaluatorType}
                  onValueChange={(val) =>
                    setConfig({
                      ...config,
                      evaluatorType: val as 'javascript' | 'graaljs',
                    })
                  }
                >
                  <SelectTrigger className="bg-[#1a1f2e] text-white border-[#2a3142]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="graaljs">GraalJS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Expression *</Label>
                <Textarea
                  value={config.expression}
                  onChange={(e) => setConfig({ ...config, expression: e.target.value })}
                  placeholder='function() { return { result: $.input + 1 }; }'
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] font-mono text-sm min-h-[120px]"
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
