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
import { PlusIcon, Trash2Icon } from 'lucide-react';

interface MapperTaskConfig {
  orgId: string;
  taskRefId: string;
  taskId: string;
  taskType: string;
  taskListDomain: string;
  sequenceNo: number;
  taskinputParameters: {
    MAPPER: Record<string, string>;
  };
}

interface MapperTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: MapperTaskConfig) => void;
  initialConfig?: MapperTaskConfig | null;
}

interface NameValuePair {
  id: string;
  name: string;
  value: string;
}

export function MapperTaskModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: MapperTaskModalProps) {
  const [config, setConfig] = useState<MapperTaskConfig>({
    orgId: 'TEST_ORG001',
    taskRefId: '',
    taskId: '',
    taskType: 'MAPPER',
    taskListDomain: 'ORDER-TASKLIST',
    sequenceNo: 1,
    executionNamespace: 'ORDER',
    executionReferences: {
      genericTaskName: 'codeExecuter_generic_task',
    },
    retryPolicy: {
      retryInterval: 60,
      retryCount: 3,
    },
    timeoutPolicy: {
      timeoutAction: 'RETRY',
      responseTimeoutSeconds: 600,
      timeoutInterval: 1200,
      pollTimeoutSeconds: 600,
    },
    taskinputParameters: {
      MAPPER: {}
    },
  });

  const [mapperPairs, setMapperPairs] = useState<NameValuePair[]>([
    { id: '1', name: '', value: '' }
  ]);
  const [executionRefs, setExecutionRefs] = useState<NameValuePair[]>([
    { id: '1', name: 'genericTaskName', value: 'codeExecuter_generic_task' }
  ]);

  useEffect(() => {
    if (open && initialConfig) {
      setConfig(initialConfig);
      
      // Convert MAPPER object to name-value pairs
      const pairs = Object.entries(initialConfig.taskinputParameters.MAPPER).map(([name, value], index) => ({
        id: `${Date.now()}-${index}`,
        name,
        value
      }));
      
      setMapperPairs(pairs.length > 0 ? pairs : [{ id: '1', name: '', value: '' }]);
    } else if (open) {
      const defaultConfig = {
        orgId: 'TEST_ORG001',
        taskRefId: '',
        taskId: '',
        taskType: 'MAPPER',
        taskListDomain: 'ORDER-TASKLIST',
        sequenceNo: 1,
        taskinputParameters: {
          MAPPER: {}
        },
      };
      setConfig(defaultConfig);
      setMapperPairs([
        { id: '1', name: 'orderWrapperRequest', value: '${workflow.input.orderWrapperRequest}' }
      ]);
    }
  }, [open, initialConfig]);

  const handleAddPair = () => {
    setMapperPairs([
      ...mapperPairs,
      { id: `${Date.now()}`, name: '', value: '' }
    ]);
  };

  const handleRemovePair = (id: string) => {
    if (mapperPairs.length > 1) {
      setMapperPairs(mapperPairs.filter(pair => pair.id !== id));
    }
  };

  const handlePairChange = (id: string, field: 'name' | 'value', newValue: string) => {
    setMapperPairs(mapperPairs.map(pair => 
      pair.id === id ? { ...pair, [field]: newValue } : pair
    ));
  };

  const handleSave = () => {
    if (!config.orgId || !config.taskRefId || !config.taskId || !config.taskListDomain) {
      alert('Please fill in all required fields (Organization ID, Task Reference ID, Task ID, Task List Domain)');
      return;
    }

    // Validate that all pairs have both name and value
    const invalidPairs = mapperPairs.filter(pair => pair.name.trim() === '' || pair.value.trim() === '');
    if (invalidPairs.length > 0) {
      alert('Please fill in all mapper parameter names and values, or remove empty pairs');
      return;
    }

    const invalidRefs = executionRefs.filter(ref => ref.name.trim() === '' || ref.value.trim() === '');
    if (invalidRefs.length > 0) {
      alert('Please fill in all execution reference names and values, or remove empty references');
      return;
    }

    // Convert pairs to MAPPER object
    const mapperObject: Record<string, string> = {};
    mapperPairs.forEach(pair => {
      if (pair.name.trim() && pair.value.trim()) {
        mapperObject[pair.name.trim()] = pair.value.trim();
      }
    });

    // Convert execution references to object
    const executionReferences: Record<string, string> = {};
    executionRefs.forEach(ref => {
      if (ref.name.trim() && ref.value.trim()) {
        executionReferences[ref.name.trim()] = ref.value.trim();
      }
    });

    const finalConfig: MapperTaskConfig = {
      orgId: config.orgId,
      taskRefId: config.taskRefId,
      taskId: config.taskId,
      taskType: config.taskType,
      taskListDomain: config.taskListDomain,
      sequenceNo: config.sequenceNo,
      executionNamespace: config.executionNamespace,
      executionReferences,
      retryPolicy: config.retryPolicy,
      timeoutPolicy: config.timeoutPolicy,
      taskinputParameters: {
        MAPPER: mapperObject
      },
    };

    onSave(finalConfig);
    onOpenChange(false);
  };

  // Generate JSON preview
  const getJsonPreview = () => {
    const mapperObject: Record<string, string> = {};
    mapperPairs.forEach(pair => {
      if (pair.name.trim() && pair.value.trim()) {
        mapperObject[pair.name.trim()] = pair.value.trim();
      }
    });

    return {
      orgId: config.orgId,
      taskRefId: config.taskRefId,
      taskId: config.taskId,
      taskType: config.taskType,
      taskListDomain: config.taskListDomain,
      sequenceNo: config.sequenceNo,
      taskinputParameters: {
        MAPPER: mapperObject
      }
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-white">
            Configure Mapper Task
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs defaultValue="basic" className="space-y-4 py-4">
            <TabsList className="bg-[#0f1419]">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="execution">Execution</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
              <TabsTrigger value="mapping">Mapper Parameters</TabsTrigger>
              <TabsTrigger value="json">JSON Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Basic Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Organization ID *</Label>
                    <Input
                      value={config.orgId}
                      onChange={(e) => setConfig({ ...config, orgId: e.target.value })}
                      placeholder="e.g., TEST_ORG001"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task Reference ID *</Label>
                    <Input
                      value={config.taskRefId}
                      onChange={(e) => setConfig({ ...config, taskRefId: e.target.value })}
                      placeholder="e.g., order2customer"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task ID *</Label>
                    <Input
                      value={config.taskId}
                      onChange={(e) => setConfig({ ...config, taskId: e.target.value })}
                      placeholder="e.g., order2customer-mapper-1"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task Type</Label>
                    <Input
                      value={config.taskType}
                      disabled
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142] opacity-60"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task List Domain *</Label>
                    <Input
                      value={config.taskListDomain}
                      onChange={(e) => setConfig({ ...config, taskListDomain: e.target.value })}
                      placeholder="e.g., ORDER-TASKLIST"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Sequence Number</Label>
                    <Input
                      type="number"
                      value={config.sequenceNo}
                      onChange={(e) => setConfig({ ...config, sequenceNo: parseInt(e.target.value) || 1 })}
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="mapping" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Mapper Parameters (Name-Value Pairs)</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Define mapping parameters as key-value pairs
                    </p>
                  </div>
                  <Button
                    onClick={handleAddPair}
                    className="bg-cyan-500 text-white hover:bg-cyan-600"
                    size="sm"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Parameter
                  </Button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {mapperPairs.map((pair, index) => (
                    <Card key={pair.id} className="p-4 bg-[#1a1f2e] border-[#2a3142]">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-white text-xs mb-2 block">
                              Parameter Name *
                            </Label>
                            <Input
                              value={pair.name}
                              onChange={(e) => handlePairChange(pair.id, 'name', e.target.value)}
                              placeholder="e.g., orderWrapperRequest"
                              className="bg-[#0f1419] text-white border-[#2a3142] h-9 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-xs mb-2 block">
                              Parameter Value *
                            </Label>
                            <Input
                              value={pair.value}
                              onChange={(e) => handlePairChange(pair.id, 'value', e.target.value)}
                              placeholder="e.g., ${workflow.input.orderWrapperRequest}"
                              className="bg-[#0f1419] text-white border-[#2a3142] h-9 text-sm font-mono"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRemovePair(pair.id)}
                          variant="ghost"
                          size="sm"
                          disabled={mapperPairs.length === 1}
                          className="text-red-500 hover:bg-red-500/10 hover:text-red-400 mt-6 h-9 w-9 p-0"
                          title="Delete parameter"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">💡 Mapper Tips</h4>
                  <ul className="text-xs text-blue-300 space-y-1 list-disc list-inside">
                    <li>Use <code className="text-cyan-400 bg-cyan-500/10 px-1 rounded">${'${workflow.input.field}'}</code> to reference workflow inputs</li>
                    <li>Use <code className="text-cyan-400 bg-cyan-500/10 px-1 rounded">${'${taskName.output.field}'}</code> to reference previous task outputs</li>
                    <li>Each parameter maps input data to the format expected by downstream tasks</li>
                    <li>The mapper task transforms data without executing custom code</li>
                  </ul>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Complete Configuration JSON</h3>
                <pre className="text-xs text-gray-300 font-mono bg-[#1a1f2e] p-4 rounded-lg border border-[#2a3142] overflow-x-auto max-h-[500px] overflow-y-auto">
                  {JSON.stringify(getJsonPreview(), null, 2)}
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
