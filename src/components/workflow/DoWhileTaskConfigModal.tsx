import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  PlusIcon, 
  TrashIcon, 
  AlertCircleIcon, 
  InfoIcon, 
  CopyIcon, 
  CodeIcon, 
  CheckCircle2Icon, 
  RepeatIcon,
  EditIcon,
  BoxIcon,
  ChevronDownIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import TaskConfigurationModal from './TaskConfigurationModal';
import LambdaTaskConfigModal from './LambdaTaskConfigModal';
import { useTaskDefinitions } from '../../hooks/useConductorTasks';

interface LoopTask {
  taskRefId: string;
  taskId: string;
  taskType: string;
  taskListDomain?: string;
  sequenceNo: number;
  taskinputParameters?: Record<string, any>;
  output?: Record<string, any>;
}

interface DoWhileTaskConfiguration {
  taskRefId: string;
  taskId: string;
  taskType: 'DO_WHILE';
  taskListDomain?: string;
  sequenceNo: number;
  taskinputParameters?: Record<string, any>;
  loopIterationDelay?: number;
  loopCondition: string;
  loopOver: LoopTask[];
}

interface DoWhileTaskConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: DoWhileTaskConfiguration) => void;
  taskName: string;
  initialConfig?: DoWhileTaskConfiguration;
  sequenceNo: number;
}

export default function DoWhileTaskConfigModal({
  open,
  onClose,
  onSave,
  taskName,
  initialConfig,
  sequenceNo,
}: DoWhileTaskConfigModalProps) {
  console.log('=== DoWhileTaskConfigModal RENDER ===');
  console.log('Open:', open);
  console.log('Task Name:', taskName);
  console.log('Sequence No:', sequenceNo);
  console.log('DoWhileTaskConfigModal: Initial Config:', initialConfig);
  
  const { toast } = useToast();
  const { taskDefinitions } = useTaskDefinitions();
  
  const [taskRefId, setTaskRefId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [taskListDomain, setTaskListDomain] = useState('');
  const [inputParameters, setInputParameters] = useState<Record<string, string>>({});
  const [loopIterationDelay, setLoopIterationDelay] = useState('60');
  const [loopCondition, setLoopCondition] = useState('');
  const [loopTasks, setLoopTasks] = useState<LoopTask[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [fullJsonInput, setFullJsonInput] = useState('');
  const [fullJsonError, setFullJsonError] = useState('');
  const [useJsonEditor, setUseJsonEditor] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  
  // Nested task configuration states
  const [isConfiguringNestedTask, setIsConfiguringNestedTask] = useState(false);
  const [isConfiguringLambdaTask, setIsConfiguringLambdaTask] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(-1);
  const [nestedTaskType, setNestedTaskType] = useState<string>('GENERIC');
  const [selectedUserDefinedTask, setSelectedUserDefinedTask] = useState<string>('');

  // Auto-sync JSON in real-time whenever form values change
  useEffect(() => {
    if (!open) return;

    const taskinputParameters: Record<string, any> = {};
    Object.entries(inputParameters).forEach(([key, value]) => {
      try {
        const parsed = JSON.parse(value);
        taskinputParameters[key] = parsed;
      } catch {
        taskinputParameters[key] = value;
      }
    });

    const config = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'DO_WHILE' as const,
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters: Object.keys(taskinputParameters).length > 0 ? taskinputParameters : undefined,
      loopIterationDelay: loopIterationDelay ? parseInt(loopIterationDelay) : undefined,
      loopCondition: loopCondition.trim(),
      loopOver: loopTasks,
    };

    setFullJsonInput(JSON.stringify(config, null, 2));
    validateFullJson(JSON.stringify(config, null, 2));
  }, [
    open,
    taskRefId,
    taskId,
    taskListDomain,
    sequenceNo,
    inputParameters,
    loopIterationDelay,
    loopCondition,
    loopTasks
  ]);

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setTaskRefId(initialConfig.taskRefId);
        setTaskId(initialConfig.taskId);
        setTaskListDomain(initialConfig.taskListDomain || '');
        
        if (initialConfig.taskinputParameters) {
          const params: Record<string, string> = {};
          Object.entries(initialConfig.taskinputParameters).forEach(([key, value]) => {
            params[key] = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
          });
          setInputParameters(params);
          setJsonInput(JSON.stringify(initialConfig.taskinputParameters, null, 2));
        }

        setLoopIterationDelay(String(initialConfig.loopIterationDelay || 60));
        setLoopCondition(initialConfig.loopCondition || '');
        setLoopTasks(initialConfig.loopOver || []);
      } else {
        const defaultTaskId = taskName.toLowerCase().replace(/\s+/g, '-');
        const timestamp = Date.now();
        setTaskRefId(`LoopTask-${timestamp}`);
        setTaskId('LoopTask');
        setTaskListDomain('ORDER-TASKLIST');
        
        // Set default input parameters
        const defaultParams = {
          'value': '${workflow.input.loopCount}',
        };
        setInputParameters(defaultParams);
        setJsonInput(JSON.stringify(defaultParams, null, 2));

        setLoopIterationDelay('60');
        setLoopCondition("if ( ($.LoopTask['iteration'] > $.value ) ||($.myHttpTaskref['statusCode'] == 200) ) { false; } else { true; }");
        setLoopTasks([]);
      }
      setActiveTab('basic');
      setFullJsonError('');
      setJsonError('');
      setUseJsonEditor(false);
    }
  }, [initialConfig, taskName, sequenceNo, open]);

  const validateJson = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      setJsonError('');
      return true;
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
      return false;
    }
  };

  const validateFullJson = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      setFullJsonError('');
      return true;
    } catch (error) {
      setFullJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
      return false;
    }
  };

  const handleJsonInputChange = (value: string) => {
    setJsonInput(value);
    validateJson(value);
  };

  const handleSave = () => {
    console.log('DoWhileTaskConfigModal: handleSave triggered. Active tab:', activeTab);
    
    if (activeTab === 'json') {
      if (!validateFullJson(fullJsonInput)) {
        toast({
          title: 'Invalid JSON',
          description: 'Please fix JSON errors before saving.',
          variant: 'destructive',
        });
        return;
      }

      try {
        const taskConfig = JSON.parse(fullJsonInput);
        console.log('Saving from JSON tab:', taskConfig);
        onSave(taskConfig);
        onClose();
        return;
      } catch (error) {
        toast({
          title: 'Save Failed',
          description: 'Failed to parse task JSON.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (!taskRefId.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Task Reference ID is required',
        variant: 'destructive',
      });
      return;
    }

    if (!taskId.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Task ID is required',
        variant: 'destructive',
      });
      return;
    }

    if (!loopCondition.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Loop Condition is required',
        variant: 'destructive',
      });
      return;
    }

    let finalInputParameters = inputParameters;

    if (useJsonEditor) {
      if (!validateJson(jsonInput)) {
        toast({
          title: 'Invalid JSON',
          description: 'Please fix JSON errors before saving',
          variant: 'destructive',
        });
        return;
      }
      try {
        const parsed = JSON.parse(jsonInput);
        finalInputParameters = {};
        Object.entries(parsed).forEach(([key, value]) => {
          finalInputParameters[key] = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
        });
      } catch (error) {
        toast({
          title: 'Invalid JSON',
          description: 'Invalid JSON format in input parameters',
          variant: 'destructive',
        });
        return;
      }
    }

    const taskinputParameters: Record<string, any> = {};
    Object.entries(finalInputParameters).forEach(([key, value]) => {
      try {
        const parsed = JSON.parse(value);
        taskinputParameters[key] = parsed;
      } catch {
        taskinputParameters[key] = value;
      }
    });

    const config: DoWhileTaskConfiguration = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'DO_WHILE',
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters: Object.keys(taskinputParameters).length > 0 ? taskinputParameters : undefined,
      loopIterationDelay: loopIterationDelay ? parseInt(loopIterationDelay) : undefined,
      loopCondition: loopCondition.trim(),
      loopOver: loopTasks,
    };

    console.log('Saving DO_WHILE task config from form:', config);
    onSave(config);
    onClose();
  };

  const handleCopyToJson = () => {
    setActiveTab('json');
    toast({
      title: 'Viewing JSON',
      description: 'JSON is automatically synced with form data in real-time.',
    });
  };

  const handleAddInputParameter = () => {
    const newKey = `param${Object.keys(inputParameters).length + 1}`;
    setInputParameters({
      ...inputParameters,
      [newKey]: '',
    });
  };

  const handleUpdateInputParameterKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    
    const updated = { ...inputParameters };
    updated[newKey] = updated[oldKey];
    delete updated[oldKey];
    setInputParameters(updated);
  };

  const handleUpdateInputParameterValue = (key: string, value: string) => {
    setInputParameters({
      ...inputParameters,
      [key]: value,
    });
  };

  const handleDeleteInputParameter = (key: string) => {
    const updated = { ...inputParameters };
    delete updated[key];
    setInputParameters(updated);
  };

  const handleAddLoopTask = (taskType: string = 'GENERIC', userDefinedTaskId?: string) => {
    setCurrentTaskIndex(-1);
    setNestedTaskType(taskType);
    
    if (userDefinedTaskId) {
      setSelectedUserDefinedTask(userDefinedTaskId);
    }
    
    if (taskType === 'LAMBDA') {
      setIsConfiguringLambdaTask(true);
    } else {
      setIsConfiguringNestedTask(true);
    }
  };

  const handleEditLoopTask = (taskIndex: number) => {
    const task = loopTasks[taskIndex];
    setCurrentTaskIndex(taskIndex);
    setNestedTaskType(task.taskType);
    
    if (task.taskType === 'LAMBDA') {
      setIsConfiguringLambdaTask(true);
    } else {
      setIsConfiguringNestedTask(true);
    }
  };

  const handleDeleteLoopTask = (taskIndex: number) => {
    setLoopTasks(loopTasks.filter((_, idx) => idx !== taskIndex));
  };

  const handleSaveNestedTask = (config: any) => {
    if (currentTaskIndex === -1) {
      setLoopTasks([...loopTasks, config]);
    } else {
      const updated = [...loopTasks];
      updated[currentTaskIndex] = config;
      setLoopTasks(updated);
    }
    
    setIsConfiguringNestedTask(false);
    setIsConfiguringLambdaTask(false);
    setCurrentTaskIndex(-1);
    setSelectedUserDefinedTask('');
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'LAMBDA':
        return '🔧';
      case 'HTTP':
        return '🌐';
      case 'DECISION':
        return '🔀';
      case 'FORK_JOIN':
        return '⑂';
      case 'DO_WHILE':
        return '🔁';
      case 'SUB_WORKFLOW':
        return '📋';
      case 'EVENT':
        return '📡';
      case 'WAIT':
        return '⏱️';
      default:
        return '📦';
    }
  };

  const userDefinedTasks = taskDefinitions.filter(task => 
    !['GENERIC', 'HTTP', 'LAMBDA', 'DECISION', 'FORK_JOIN', 'DO_WHILE', 
      'SUB_WORKFLOW', 'EVENT', 'WAIT', 'TERMINATE', 'SIGNAL'].includes(task.name)
  );

  const DO_WHILE_EXAMPLE = `{
  "taskRefId": "LoopTask",
  "taskId": "LoopTask",
  "taskType": "DO_WHILE",
  "sequenceNo": 1,
  "taskListDomain": "ORDER-TASKLIST",
  "taskinputParameters": {
    "value": "\${workflow.input.loopCount}"
  },
  "loopIterationDelay": 60,
  "loopCondition": "if ( ($.LoopTask['iteration'] > $.value ) ||($.myHttpTaskref['statusCode'] == 200) ) { false; } else { true; }",
  "loopOver": [
    {
      "taskRefId": "myHttpTaskref",
      "taskId": "my-http-request",
      "taskListDomain": "ORDER-TASKLIST",
      "sequenceNo": 2,
      "taskType": "HTTP",
      "taskinputParameters": {
        "HTTP": {
          "connectionTimeOut": "4000",
          "readTimeOut": "4000",
          "uri": "http://localhost:1880/api",
          "method": "POST",
          "accept": "application/json",
          "content-Type": "application/json",
          "body": "\${workflow.input.request}",
          "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        }
      },
      "output": {}
    }
  ]
}`;

  const handleLoadExample = () => {
    setFullJsonInput(DO_WHILE_EXAMPLE);
    validateFullJson(DO_WHILE_EXAMPLE);
    toast({
      title: 'Example Loaded',
      description: 'DO_WHILE task example has been loaded.',
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
    }}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-card text-card-foreground border-border" onPointerDownOutside={(e) => e.preventDefault()}>
        {console.log('DoWhileTaskConfigModal: DialogContent is rendering')}
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-foreground flex items-center gap-2">
              <RepeatIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              Configure Do While Loop Task
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                  DO_WHILE
                </Badge>
                <span className="text-xs">Sequence: {sequenceNo}</span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-4 bg-muted">
              <TabsTrigger 
                value="basic"
                className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Task Configuration
              </TabsTrigger>
              <TabsTrigger 
                value="parameters"
                className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Input Parameters
              </TabsTrigger>
              <TabsTrigger 
                value="loop"
                className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Loop Configuration
              </TabsTrigger>
              <TabsTrigger 
                value="json"
                className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <CodeIcon className="h-3 w-3 mr-1" strokeWidth={1.5} />
                JSON
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="max-h-[calc(90vh-280px)] pr-4">
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">Do While Loop Task Configuration</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        DO_WHILE tasks execute a set of tasks repeatedly until a condition evaluates to false. The loop executes at least once before checking the condition.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskRefId" className="text-foreground">
                    Task Reference ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="taskRefId"
                    value={taskRefId}
                    onChange={(e) => setTaskRefId(e.target.value)}
                    placeholder="e.g., LoopTask"
                    className="bg-background text-foreground border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique reference identifier for this task instance in the workflow
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskId" className="text-foreground">
                    Task ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="taskId"
                    value={taskId}
                    onChange={(e) => setTaskId(e.target.value)}
                    placeholder="e.g., LoopTask"
                    className="bg-background text-foreground border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Task definition identifier
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskListDomain" className="text-foreground">
                    Task List Domain
                  </Label>
                  <Input
                    id="taskListDomain"
                    value={taskListDomain}
                    onChange={(e) => setTaskListDomain(e.target.value)}
                    placeholder="e.g., ORDER-TASKLIST"
                    className="bg-background text-foreground border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Domain for task list organization and routing
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Task Type</Label>
                  <Input
                    value="DO_WHILE"
                    disabled
                    className="bg-muted text-foreground border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Sequence Number</Label>
                  <Input
                    value={sequenceNo}
                    disabled
                    className="bg-muted text-foreground border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-assigned based on task order in workflow
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="parameters" className="space-y-4 mt-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">Loop Input Parameters</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Define parameters that will be available within the loop. These can be referenced in the loop condition and by tasks within the loop.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Task Input Parameters</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!useJsonEditor) {
                            const paramsObj: Record<string, any> = {};
                            Object.entries(inputParameters).forEach(([key, value]) => {
                              try {
                                paramsObj[key] = JSON.parse(value);
                              } catch {
                                paramsObj[key] = value;
                              }
                            });
                            setJsonInput(JSON.stringify(paramsObj, null, 2));
                          } else {
                            if (validateJson(jsonInput)) {
                              try {
                                const parsed = JSON.parse(jsonInput);
                                const params: Record<string, string> = {};
                                Object.entries(parsed).forEach(([key, value]) => {
                                  params[key] = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
                                });
                                setInputParameters(params);
                              } catch (error) {
                                toast({
                                  title: 'Invalid JSON',
                                  description: 'Please fix errors before switching to form editor.',
                                  variant: 'destructive',
                                });
                                return;
                              }
                            } else {
                              toast({
                                title: 'Invalid JSON',
                                description: 'Please fix errors before switching to form editor.',
                                variant: 'destructive',
                              });
                              return;
                            }
                          }
                          setUseJsonEditor(!useJsonEditor);
                        }}
                        className="text-xs bg-transparent text-foreground border-border hover:bg-accent"
                      >
                        {useJsonEditor ? 'Switch to Form Editor' : 'Switch to JSON Editor'}
                      </Button>
                    </div>
                  </div>

                  {useJsonEditor ? (
                    <div className="space-y-2">
                      <Textarea
                        value={jsonInput}
                        onChange={(e) => handleJsonInputChange(e.target.value)}
                        placeholder={`{
  "value": "\${workflow.input.loopCount}"
}`}
                        className="bg-background text-foreground border-border font-mono text-xs min-h-[250px] resize-y"
                      />
                      {jsonError && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <AlertCircleIcon className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-destructive">JSON Error</p>
                            <p className="text-xs text-destructive/80 mt-1">{jsonError}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <ScrollArea className="h-[250px] pr-4">
                        <div className="space-y-3">
                          {Object.entries(inputParameters).map(([key, value]) => (
                            <div key={key} className="space-y-2 p-3 rounded-lg bg-background border border-border">
                              <div className="flex gap-2 items-start">
                                <div className="flex-1 space-y-2">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Parameter Name</Label>
                                    <Input
                                      value={key}
                                      onChange={(e) => handleUpdateInputParameterKey(key, e.target.value)}
                                      placeholder="Parameter name (e.g., value)"
                                      className="bg-background text-foreground border-border mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Parameter Value</Label>
                                    <Input
                                      value={value}
                                      onChange={(e) => handleUpdateInputParameterValue(key, e.target.value)}
                                      placeholder='${workflow.input.loopCount}'
                                      className="bg-background text-foreground border-border font-mono text-xs mt-1"
                                    />
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDeleteInputParameter(key)}
                                  className="flex-shrink-0 bg-transparent text-destructive border-border hover:bg-destructive/10 mt-6"
                                >
                                  <TrashIcon className="h-4 w-4" strokeWidth={1.5} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddInputParameter}
                        className="w-full bg-transparent text-foreground border-border hover:bg-accent"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                        Add Input Parameter
                      </Button>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-xs font-medium text-foreground mb-2">Parameter Tips:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Use <code className="bg-background px-1 rounded">{'${workflow.input.fieldName}'}</code> to reference workflow inputs</li>
                    <li>Parameters can be referenced in loop condition using <code className="bg-background px-1 rounded">$.parameterName</code></li>
                    <li>Loop iteration count is available as <code className="bg-background px-1 rounded">$.taskRefId['iteration']</code></li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="loop" className="space-y-4 mt-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">Loop Configuration</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Configure the loop condition and tasks that will be executed in each iteration. The loop continues while the condition evaluates to true.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loopIterationDelay" className="text-foreground">
                    Loop Iteration Delay (seconds)
                  </Label>
                  <Input
                    id="loopIterationDelay"
                    type="number"
                    value={loopIterationDelay}
                    onChange={(e) => setLoopIterationDelay(e.target.value)}
                    placeholder="60"
                    className="bg-background text-foreground border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Delay in seconds between loop iterations (optional)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loopCondition" className="text-foreground">
                    Loop Condition <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="loopCondition"
                    value={loopCondition}
                    onChange={(e) => setLoopCondition(e.target.value)}
                    placeholder="if ( ($.LoopTask['iteration'] > $.value ) ||($.myHttpTaskref['statusCode'] == 200) ) { false; } else { true; }"
                    className="bg-background text-foreground border-border font-mono text-xs min-h-[120px] resize-y"
                  />
                  <p className="text-xs text-muted-foreground">
                    JavaScript expression that evaluates to true to continue looping or false to exit
                  </p>
                </div>

                <Separator className="bg-border" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Loop Tasks</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="bg-transparent text-foreground border-border hover:bg-accent"
                        >
                          <PlusIcon className="h-3 w-3 mr-2" strokeWidth={1.5} />
                          Add Task
                          <ChevronDownIcon className="h-3 w-3 ml-2" strokeWidth={1.5} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-popover text-popover-foreground border-border">
                        <DropdownMenuLabel className="text-foreground">System Tasks</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem 
                          onClick={() => handleAddLoopTask('GENERIC')}
                          className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        >
                          <BoxIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                          Generic Task
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleAddLoopTask('HTTP')}
                          className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        >
                          <span className="mr-2">🌐</span>
                          HTTP Task
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleAddLoopTask('LAMBDA')}
                          className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        >
                          <CodeIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                          Lambda Task
                        </DropdownMenuItem>
                        
                        {userDefinedTasks.length > 0 && (
                          <>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuLabel className="text-foreground">User Defined Tasks</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border" />
                            {userDefinedTasks.slice(0, 5).map((task) => (
                              <DropdownMenuItem 
                                key={task.name}
                                onClick={() => handleAddLoopTask('GENERIC', task.name)}
                                className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                              >
                                <span className="mr-2">📦</span>
                                {task.name}
                              </DropdownMenuItem>
                            ))}
                            {userDefinedTasks.length > 5 && (
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
                                  <span className="mr-2">📦</span>
                                  More Tasks...
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="bg-popover text-popover-foreground border-border max-h-[300px] overflow-y-auto">
                                  {userDefinedTasks.slice(5).map((task) => (
                                    <DropdownMenuItem 
                                      key={task.name}
                                      onClick={() => handleAddLoopTask('GENERIC', task.name)}
                                      className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                    >
                                      {task.name}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {loopTasks.map((task, taskIndex) => (
                        <div
                          key={taskIndex}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 flex-shrink-0 text-lg">
                            {getTaskIcon(task.taskType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {task.taskId}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {task.taskType}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              Ref: {task.taskRefId}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditLoopTask(taskIndex)}
                              className="h-7 w-7 bg-transparent text-foreground border-border hover:bg-accent"
                            >
                              <EditIcon className="h-3 w-3" strokeWidth={1.5} />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteLoopTask(taskIndex)}
                              className="h-7 w-7 bg-transparent text-destructive border-border hover:bg-destructive/10"
                            >
                              <TrashIcon className="h-3 w-3" strokeWidth={1.5} />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {loopTasks.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-3">
                            No loop tasks defined yet
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Add tasks that will be executed in each loop iteration
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-xs font-medium text-foreground mb-2">Loop Condition Tips:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Use <code className="bg-background px-1 rounded">$.taskRefId['iteration']</code> to access current iteration count</li>
                    <li>Use <code className="bg-background px-1 rounded">$.taskRefId['output']</code> to access task outputs from loop</li>
                    <li>Return <code className="bg-background px-1 rounded">true</code> to continue looping, <code className="bg-background px-1 rounded">false</code> to exit</li>
                    <li>Condition is evaluated after each iteration</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="json" className="space-y-4 mt-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">JSON Editor Mode</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        View or edit the complete DO_WHILE task configuration in JSON format. Changes are synced in real-time.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {fullJsonError ? (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircleIcon className="h-4 w-4" strokeWidth={1.5} />
                        <span className="text-sm font-medium">Invalid JSON</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle2Icon className="h-4 w-4" strokeWidth={1.5} />
                        <span className="text-sm font-medium">Valid JSON</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyToJson}
                      className="bg-transparent text-foreground border-border hover:bg-accent"
                    >
                      <CopyIcon className="h-3 w-3 mr-2" strokeWidth={1.5} />
                      View JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadExample}
                      className="bg-transparent text-foreground border-border hover:bg-accent"
                    >
                      Load Example
                    </Button>
                  </div>
                </div>

                {fullJsonError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-start gap-2">
                      <AlertCircleIcon className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-destructive">JSON Syntax Error</p>
                        <p className="text-xs text-destructive/80 mt-1">{fullJsonError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-border overflow-hidden">
                  <Textarea
                    value={fullJsonInput}
                    onChange={(e) => {
                      setFullJsonInput(e.target.value);
                      validateFullJson(e.target.value);
                    }}
                    className="h-[400px] w-full font-mono text-xs bg-background text-foreground border-0 focus-visible:ring-0 resize-none overflow-auto"
                    placeholder="Enter complete DO_WHILE task JSON configuration..."
                  />
                </div>

                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-xs font-medium text-foreground mb-2">DO_WHILE Task Example:</p>
                  <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{DO_WHILE_EXAMPLE}
                  </pre>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-transparent text-foreground border-border hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={activeTab === 'json' && !!fullJsonError}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isConfiguringNestedTask && (
        <TaskConfigurationModal
          open={isConfiguringNestedTask}
          onClose={() => {
            setIsConfiguringNestedTask(false);
            setCurrentTaskIndex(-1);
          }}
          onSave={handleSaveNestedTask}
          taskType={nestedTaskType}
          taskName={nestedTaskType === 'HTTP' ? 'HTTP Task' : 'Generic Task'}
          initialConfig={currentTaskIndex >= 0 ? loopTasks[currentTaskIndex] : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : loopTasks.length + 1}
        />
      )}

      {isConfiguringLambdaTask && (
        <LambdaTaskConfigModal
          open={isConfiguringLambdaTask}
          onClose={() => {
            setIsConfiguringLambdaTask(false);
            setCurrentTaskIndex(-1);
          }}
          onSave={handleSaveNestedTask}
          taskName="Lambda Task"
          initialConfig={currentTaskIndex >= 0 ? loopTasks[currentTaskIndex] : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : loopTasks.length + 1}
        />
      )}
    </>
  );
}
