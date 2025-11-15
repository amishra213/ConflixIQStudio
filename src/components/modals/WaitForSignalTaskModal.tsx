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
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WaitForSignalTaskConfig {
  taskRefId: string;
  taskId: string;
  taskType: string;
  taskListDomain: string;
  sequenceNo: number;
  signalName: string;
  timeout: number;
  taskinputParameters: any;
}

interface WaitForSignalTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: WaitForSignalTaskConfig) => void;
  initialConfig?: WaitForSignalTaskConfig | null;
}

export function WaitForSignalTaskModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: WaitForSignalTaskModalProps) {
  const [config, setConfig] = useState<WaitForSignalTaskConfig>({
    taskRefId: '',
    taskId: '',
    taskType: 'WAIT_FOR_SIGNAL',
    taskListDomain: 'DEFAULT-TASKLIST',
    sequenceNo: 1,
    signalName: '',
    timeout: 3600,
    taskinputParameters: {},
  });

  useEffect(() => {
    if (open && initialConfig) {
      setConfig(initialConfig);
    } else if (open) {
      setConfig({
        taskRefId: '',
        taskId: '',
        taskType: 'WAIT_FOR_SIGNAL',
        taskListDomain: 'DEFAULT-TASKLIST',
        sequenceNo: 1,
        signalName: '',
        timeout: 3600,
        taskinputParameters: {},
      });
    }
  }, [open, initialConfig]);

  const handleSave = () => {
    if (!config.taskRefId || !config.taskId || !config.signalName) {
      alert('Please fill in all required fields');
      return;
    }

    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-white">
            Configure Wait For Signal Task
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs defaultValue="basic" className="space-y-4 py-4">
            <TabsList className="bg-[#0f1419]">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="signal">Signal Config</TabsTrigger>
              <TabsTrigger value="json">JSON Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Basic Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Task Reference ID</Label>
                    <Input
                      value={config.taskRefId}
                      onChange={(e) => setConfig({ ...config, taskRefId: e.target.value })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task ID</Label>
                    <Input
                      value={config.taskId}
                      onChange={(e) => setConfig({ ...config, taskId: e.target.value })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-white">Task List Domain</Label>
                    <Input
                      value={config.taskListDomain}
                      onChange={(e) => setConfig({ ...config, taskListDomain: e.target.value })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="signal" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Signal Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Signal Name</Label>
                    <Input
                      value={config.signalName}
                      onChange={(e) => setConfig({ ...config, signalName: e.target.value })}
                      placeholder="e.g., order_confirmed"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Timeout (seconds)</Label>
                    <Input
                      type="number"
                      value={config.timeout}
                      onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) || 3600 })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Maximum time to wait for signal before timing out
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Complete Configuration JSON</h3>
                <pre className="text-xs text-gray-300 font-mono bg-[#1a1f2e] p-4 rounded-lg border border-[#2a3142] overflow-x-auto max-h-[500px] overflow-y-auto">
                  {JSON.stringify(config, null, 2)}
                </pre>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="border-t border-[#2a3142] px-6 py-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-cyan-500 text-white hover:bg-cyan-600 font-medium"
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
