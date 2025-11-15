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

export interface SubWorkflowConfig {
  taskRefId: string;
  name?: string;
  taskType: 'SUB_WORKFLOW';
  subWorkflowName?: string;
  subWorkflowVersion?: number;
  description?: string;
}

interface SubWorkflowModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: SubWorkflowConfig) => void;
}

export function SubWorkflowModal({ open, onOpenChange, onSave }: SubWorkflowModalProps) {
  const [config, setConfig] = useState<SubWorkflowConfig>({
    taskRefId: 'subWorkflow-1',
    name: 'Sub Workflow',
    taskType: 'SUB_WORKFLOW',
    subWorkflowVersion: 1,
  });

  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setConfig({
        taskRefId: `subWorkflow-${timestamp}`,
        name: 'Sub Workflow',
        taskType: 'SUB_WORKFLOW',
        subWorkflowVersion: 1,
      });
      setJsonError('');
    }
  }, [open]);

  const handleSave = () => {
    if (!config.taskRefId || config.taskRefId.trim() === '') {
      setJsonError('Task Reference ID is required');
      return;
    }

    if (!config.subWorkflowName || config.subWorkflowName.trim() === '') {
      setJsonError('Sub Workflow Name is required');
      return;
    }

    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1f2e] border-[#2a3142] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create Sub Workflow Operator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-[#0f1419] border-[#2a3142]">
            <div className="space-y-3">
              <div>
                <Label className="text-white">Task Ref ID *</Label>
                <Input
                  value={config.taskRefId}
                  onChange={(e) => setConfig({ ...config, taskRefId: e.target.value })}
                  placeholder="e.g., subWorkflow-1"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Name</Label>
                <Input
                  value={config.name || ''}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="e.g., Sub Workflow"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Sub Workflow Name *</Label>
                <Input
                  value={config.subWorkflowName || ''}
                  onChange={(e) => setConfig({ ...config, subWorkflowName: e.target.value })}
                  placeholder="Name of the sub-workflow to execute"
                  className="mt-1 bg-[#1a1f2e] text-white border-[#2a3142]"
                />
              </div>
              <div>
                <Label className="text-white">Sub Workflow Version</Label>
                <Input
                  type="number"
                  value={config.subWorkflowVersion || ''}
                  onChange={(e) => setConfig({ ...config, subWorkflowVersion: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Version number"
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
