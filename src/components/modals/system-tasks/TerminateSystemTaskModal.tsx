import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

export interface TerminateSystemTaskConfig {
  type: 'TERMINATE';
  name: string;
  taskReferenceName: string;
  terminationStatus: 'COMPLETED' | 'FAILED';
  workflowOutput?: Record<string, any>;
}

interface TerminateSystemTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: TerminateSystemTaskConfig) => void;
}

export function TerminateSystemTaskModal({
  open,
  onOpenChange,
  onSave,
}: TerminateSystemTaskModalProps) {
  const [config, setConfig] = useState<TerminateSystemTaskConfig>({
    type: 'TERMINATE',
    name: '',
    taskReferenceName: '',
    terminationStatus: 'COMPLETED',
  });

  const [outputText, setOutputText] = useState('');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      setConfig({
        type: 'TERMINATE',
        name: '',
        taskReferenceName: '',
        terminationStatus: 'COMPLETED',
      });
      setOutputText('');
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

    let workflowOutput: Record<string, any> | undefined = undefined;
    if (outputText.trim()) {
      try {
        workflowOutput = JSON.parse(outputText);
      } catch {
        setJsonError('Invalid workflow output JSON');
        return;
      }
    }

    onSave({ ...config, workflowOutput });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1f2e] border-[#2a3142] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create Terminate Task</DialogTitle>
          <DialogDescription className="text-sm text-gray-400">Configure a terminate task to end the workflow execution.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
            <div className="space-y-3">
              <div>
                <Label className="text-white">Name *</Label>
                <Input
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="TERMINATE task name"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Task Reference Name *</Label>
                <Input
                  value={config.taskReferenceName}
                  onChange={(e) => setConfig({ ...config, taskReferenceName: e.target.value })}
                  placeholder="e.g., terminate_1"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Termination Status *</Label>
                <Select
                  value={config.terminationStatus}
                  onValueChange={(val) =>
                    setConfig({
                      ...config,
                      terminationStatus: val as 'COMPLETED' | 'FAILED',
                    })
                  }
                >
                  <SelectTrigger className="bg-[#1a1f2e] text-white border-[#2a3142]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    <SelectItem value="FAILED">FAILED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Workflow Output (JSON)</Label>
                <Textarea
                  value={outputText}
                  onChange={(e) => setOutputText(e.target.value)}
                  placeholder='{"result": "success"}'
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] font-mono text-sm min-h-[100px]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Optional: Output to return when workflow terminates
                </p>
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
