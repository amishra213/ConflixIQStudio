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

export interface JsonJqTransformTaskConfig {
  type: 'JSON_JQ_TRANSFORM';
  name: string;
  taskReferenceName: string;
  queryExpression: string;
}

interface JsonJqTransformTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: JsonJqTransformTaskConfig) => void;
}

export function JsonJqTransformTaskModal({
  open,
  onOpenChange,
  onSave,
}: JsonJqTransformTaskModalProps) {
  const [config, setConfig] = useState<JsonJqTransformTaskConfig>({
    type: 'JSON_JQ_TRANSFORM',
    name: '',
    taskReferenceName: '',
    queryExpression: '',
  });

  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      setConfig({
        type: 'JSON_JQ_TRANSFORM',
        name: '',
        taskReferenceName: '',
        queryExpression: '',
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
    if (!config.queryExpression || config.queryExpression.trim() === '') {
      setJsonError('Query Expression is required');
      return;
    }

    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1f2e] border-[#2a3142] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create JSON JQ Transform Task</DialogTitle>
          <DialogDescription className="text-sm text-gray-400">Configure a JSON JQ transform task to manipulate JSON data using JQ expressions.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
            <div className="space-y-3">
              <div>
                <Label className="text-white">Name *</Label>
                <Input
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="JSON JQ Transform task name"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Task Reference Name *</Label>
                <Input
                  value={config.taskReferenceName}
                  onChange={(e) => setConfig({ ...config, taskReferenceName: e.target.value })}
                  placeholder="e.g., jq_transform_1"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Query Expression *</Label>
                <Textarea
                  value={config.queryExpression}
                  onChange={(e) => setConfig({ ...config, queryExpression: e.target.value })}
                  placeholder=".field | select(.value > 10)"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142] font-mono text-sm min-h-[120px]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter a valid jq query expression
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
