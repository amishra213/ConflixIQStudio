import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusIcon, Trash2Icon } from 'lucide-react';

interface TaskConfig {
  taskRefId: string;
  taskId: string;
  taskType: string;
  taskListDomain: string;
  sequenceNo: number;
  taskinputParameters: Record<string, any>;
}

interface DecisionTaskConfig {
  taskRefId: string;
  taskId: string;
  taskType: string;
  taskListDomain: string;
  sequenceNo: number;
  taskinputParameters: Record<string, any>;
  caseValues: Record<string, TaskConfig[]>;
}

interface DecisionTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: DecisionTaskConfig) => void;
  initialConfig?: DecisionTaskConfig | null;
}

export function DecisionTaskModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: DecisionTaskModalProps) {
  const [config, setConfig] = useState<DecisionTaskConfig>({
    taskRefId: '',
    taskId: '',
    taskType: 'DECISION',
    taskListDomain: '',
    sequenceNo: 1,
    taskinputParameters: {},
    caseValues: {},
  });

  const [switchParam, setSwitchParam] = useState('');
  const [cases, setCases] = useState<string[]>([]);
  const [selectedCase, setSelectedCase] = useState<string>('');

  useEffect(() => {
    if (open && initialConfig) {
      setConfig(initialConfig);
      const caseKeys = Object.keys(initialConfig.caseValues || {});
      setCases(caseKeys);
      if (caseKeys.length > 0) {
        setSelectedCase(caseKeys[0]);
      }
      const param = initialConfig.taskinputParameters?.yosSwitchCaseParam || '';
      setSwitchParam(param);
    } else if (open) {
      setConfig({
        taskRefId: '',
        taskId: '',
        taskType: 'DECISION',
        taskListDomain: '',
        sequenceNo: 1,
        taskinputParameters: {},
        caseValues: {},
      });
      setSwitchParam('');
      setCases([]);
      setSelectedCase('');
    }
  }, [open, initialConfig]);

  const handleAddCase = () => {
    const caseName = prompt('Enter case name:');
    if (caseName && !cases.includes(caseName)) {
      const newCases = [...cases, caseName];
      setCases(newCases);
      setConfig({
        ...config,
        caseValues: {
          ...config.caseValues,
          [caseName]: [],
        },
      });
      setSelectedCase(caseName);
    }
  };

  const handleRemoveCase = (caseName: string) => {
    const newCases = cases.filter((c) => c !== caseName);
    setCases(newCases);
    const newCaseValues = { ...config.caseValues };
    delete newCaseValues[caseName];
    setConfig({
      ...config,
      caseValues: newCaseValues,
    });
    if (selectedCase === caseName && newCases.length > 0) {
      setSelectedCase(newCases[0]);
    }
  };

  const handleAddTaskToCase = (caseName: string) => {
    const newTask: TaskConfig = {
      taskRefId: '',
      taskId: '',
      taskType: 'GENERIC',
      taskListDomain: config.taskListDomain,
      sequenceNo: 1,
      taskinputParameters: {},
    };

    setConfig({
      ...config,
      caseValues: {
        ...config.caseValues,
        [caseName]: [...(config.caseValues[caseName] || []), newTask],
      },
    });
  };

  const handleUpdateCaseTask = (
    caseName: string,
    taskIndex: number,
    updatedTask: Partial<TaskConfig>
  ) => {
    const caseTasks = [...(config.caseValues[caseName] || [])];
    caseTasks[taskIndex] = { ...caseTasks[taskIndex], ...updatedTask };
    setConfig({
      ...config,
      caseValues: {
        ...config.caseValues,
        [caseName]: caseTasks,
      },
    });
  };

  const handleRemoveTaskFromCase = (caseName: string, taskIndex: number) => {
    const caseTasks = [...(config.caseValues[caseName] || [])];
    caseTasks.splice(taskIndex, 1);
    setConfig({
      ...config,
      caseValues: {
        ...config.caseValues,
        [caseName]: caseTasks,
      },
    });
  };

  const handleSave = () => {
    if (!config.taskRefId || !config.taskId || !config.taskListDomain) {
      alert('Please fill in all required fields');
      return;
    }

    onSave({
      ...config,
      taskinputParameters: {
        yosSwitchCaseParam: switchParam,
      },
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-white">
            Configure Decision Task
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6 py-4">
            {/* Basic Configuration */}
            <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
              <h3 className="text-lg font-semibold text-white mb-4">Basic Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taskRefId" className="text-white font-medium">
                    Task Reference ID *
                  </Label>
                  <Input
                    id="taskRefId"
                    value={config.taskRefId}
                    onChange={(e) => setConfig({ ...config, taskRefId: e.target.value })}
                    placeholder="e.g., sample-decision-task-taskref"
                    className="mt-2 h-10 bg-[#1a1f2e] text-white border-[#2a3142] focus-visible:ring-cyan-500"
                  />
                </div>

                <div>
                  <Label htmlFor="taskId" className="text-white font-medium">
                    Task ID *
                  </Label>
                  <Input
                    id="taskId"
                    value={config.taskId}
                    onChange={(e) => setConfig({ ...config, taskId: e.target.value })}
                    placeholder="e.g., sample-decision-task"
                    className="mt-2 h-10 bg-[#1a1f2e] text-white border-[#2a3142] focus-visible:ring-cyan-500"
                  />
                </div>

                <div>
                  <Label htmlFor="taskListDomain" className="text-white font-medium">
                    Task List Domain *
                  </Label>
                  <Input
                    id="taskListDomain"
                    value={config.taskListDomain}
                    onChange={(e) => setConfig({ ...config, taskListDomain: e.target.value })}
                    placeholder="e.g., BOPUS-TASKLIST"
                    className="mt-2 h-10 bg-[#1a1f2e] text-white border-[#2a3142] focus-visible:ring-cyan-500"
                  />
                </div>

                <div>
                  <Label htmlFor="sequenceNo" className="text-white font-medium">
                    Sequence Number
                  </Label>
                  <Input
                    id="sequenceNo"
                    type="number"
                    value={config.sequenceNo}
                    onChange={(e) =>
                      setConfig({ ...config, sequenceNo: parseInt(e.target.value) || 1 })
                    }
                    className="mt-2 h-10 bg-[#1a1f2e] text-white border-[#2a3142] focus-visible:ring-cyan-500"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="switchParam" className="text-white font-medium">
                    Switch Case Parameter
                  </Label>
                  <Input
                    id="switchParam"
                    value={switchParam}
                    onChange={(e) => setSwitchParam(e.target.value)}
                    placeholder="e.g., ${workflow.input.orderType}"
                    className="mt-2 h-10 bg-[#1a1f2e] text-white border-[#2a3142] focus-visible:ring-cyan-500"
                  />
                </div>
              </div>
            </Card>

            {/* Case Values Configuration */}
            <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Case Values</h3>
                <Button
                  onClick={handleAddCase}
                  className="bg-cyan-500 text-white hover:bg-cyan-600"
                  size="sm"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Case
                </Button>
              </div>

              {cases.length > 0 ? (
                <Tabs value={selectedCase} onValueChange={setSelectedCase}>
                  <TabsList className="bg-[#1a1f2e] mb-4">
                    {cases.map((caseName) => (
                      <TabsTrigger
                        key={caseName}
                        value={caseName}
                        className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
                      >
                        {caseName}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {cases.map((caseName) => (
                    <TabsContent key={caseName} value={caseName} className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-medium text-white">
                          Tasks for case: {caseName}
                        </h4>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAddTaskToCase(caseName)}
                            className="bg-green-500 text-white hover:bg-green-600"
                            size="sm"
                          >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Add Task
                          </Button>
                          <Button
                            onClick={() => handleRemoveCase(caseName)}
                            variant="outline"
                            className="text-red-500 border-red-500 hover:bg-red-500/10"
                            size="sm"
                          >
                            <Trash2Icon className="w-4 h-4 mr-2" />
                            Remove Case
                          </Button>
                        </div>
                      </div>

                      {(config.caseValues[caseName] || []).map((task, taskIndex) => (
                        <Card
                          key={taskIndex}
                          className="p-4 bg-[#1a1f2e] border-[#2a3142] space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <h5 className="text-sm font-medium text-cyan-400">
                              Task {taskIndex + 1}
                            </h5>
                            <Button
                              onClick={() => handleRemoveTaskFromCase(caseName, taskIndex)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-500/10"
                            >
                              <Trash2Icon className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-white text-xs">Task Ref ID</Label>
                              <Input
                                value={task.taskRefId}
                                onChange={(e) =>
                                  handleUpdateCaseTask(caseName, taskIndex, {
                                    taskRefId: e.target.value,
                                  })
                                }
                                className="mt-1 h-8 text-sm bg-[#0f1419] text-white border-[#2a3142]"
                              />
                            </div>
                            <div>
                              <Label className="text-white text-xs">Task ID</Label>
                              <Input
                                value={task.taskId}
                                onChange={(e) =>
                                  handleUpdateCaseTask(caseName, taskIndex, {
                                    taskId: e.target.value,
                                  })
                                }
                                className="mt-1 h-8 text-sm bg-[#0f1419] text-white border-[#2a3142]"
                              />
                            </div>
                            <div>
                              <Label className="text-white text-xs">Task Type</Label>
                              <Input
                                value={task.taskType}
                                onChange={(e) =>
                                  handleUpdateCaseTask(caseName, taskIndex, {
                                    taskType: e.target.value,
                                  })
                                }
                                className="mt-1 h-8 text-sm bg-[#0f1419] text-white border-[#2a3142]"
                              />
                            </div>
                            <div>
                              <Label className="text-white text-xs">Sequence No</Label>
                              <Input
                                type="number"
                                value={task.sequenceNo}
                                onChange={(e) =>
                                  handleUpdateCaseTask(caseName, taskIndex, {
                                    sequenceNo: parseInt(e.target.value) || 1,
                                  })
                                }
                                className="mt-1 h-8 text-sm bg-[#0f1419] text-white border-[#2a3142]"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-white text-xs">
                                Input Parameters (JSON)
                              </Label>
                              <Textarea
                                value={JSON.stringify(task.taskinputParameters, null, 2)}
                                onChange={(e) => {
                                  try {
                                    const params = JSON.parse(e.target.value);
                                    handleUpdateCaseTask(caseName, taskIndex, {
                                      taskinputParameters: params,
                                    });
                                  } catch (err) {
                                    // Invalid JSON, ignore
                                  }
                                }}
                                className="mt-1 text-xs font-mono bg-[#0f1419] text-white border-[#2a3142]"
                                rows={4}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}

                      {(config.caseValues[caseName] || []).length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <p>No tasks added for this case</p>
                          <Button
                            onClick={() => handleAddTaskToCase(caseName)}
                            className="mt-4 bg-cyan-500 text-white hover:bg-cyan-600"
                            size="sm"
                          >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Add First Task
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>No cases defined yet</p>
                  <Button
                    onClick={handleAddCase}
                    className="mt-4 bg-cyan-500 text-white hover:bg-cyan-600"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add First Case
                  </Button>
                </div>
              )}
            </Card>

            {/* JSON Preview */}
            <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
              <h3 className="text-lg font-semibold text-white mb-4">JSON Preview</h3>
              <pre className="text-xs text-gray-300 font-mono bg-[#1a1f2e] p-4 rounded-lg border border-[#2a3142] overflow-x-auto max-h-96">
                {JSON.stringify(
                  {
                    ...config,
                    taskinputParameters: {
                      yosSwitchCaseParam: switchParam,
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </Card>
          </div>
        </div>

        <DialogFooter className="border-t border-[#2a3142] px-6 py-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleCancel}
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
