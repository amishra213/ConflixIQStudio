import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  PlusIcon, 
  TrashIcon, 
  AlertCircleIcon, 
  InfoIcon, 
  CopyIcon, 
  CodeIcon, 
  CheckCircle2Icon, 
  GitBranchIcon, 
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

interface DecisionCaseTask {
  taskRefId: string;
  taskId: string;
  taskType: string;
  taskListDomain?: string;
  sequenceNo: number;
  taskinputParameters?: Record<string, any>;
}

interface DecisionTaskConfiguration {
  taskRefId: string;
  taskId: string;
  taskType: 'DECISION';
  taskListDomain?: string;
  sequenceNo: number;
  taskinputParameters?: {
    yosSwitchCaseParam?: string;
    [key: string]: any;
  };
  caseValues: Record<string, DecisionCaseTask[]>;
  output?: Record<string, any>;
}

interface DecisionTaskConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: DecisionTaskConfiguration) => void;
  taskName: string;
  initialConfig?: DecisionTaskConfiguration;
  sequenceNo: number;
}

export default function DecisionTaskConfigModal({
  open,
  onClose,
  onSave,
  taskName,
  initialConfig,
  sequenceNo,
}: DecisionTaskConfigModalProps) {
  console.log('=== DecisionTaskConfigModal render ===');
  console.log('Open:', open);
  console.log('Task Name:', taskName);
  console.log('Sequence No:', sequenceNo);
  console.log('Initial Config:', initialConfig);
  
  const { toast } = useToast();
  const { taskDefinitions } = useTaskDefinitions();
  
  const [taskRefId, setTaskRefId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [taskListDomain, setTaskListDomain] = useState('');
  const [switchCaseParam, setSwitchCaseParam] = useState('');
  const [caseValues, setCaseValues] = useState<Record<string, DecisionCaseTask[]>>({});
  const [activeTab, setActiveTab] = useState('basic');
  const [fullJsonInput, setFullJsonInput] = useState('');
  const [fullJsonError, setFullJsonError] = useState('');
  
  // Nested task configuration states
  const [isConfiguringNestedTask, setIsConfiguringNestedTask] = useState(false);
  const [isConfiguringLambdaTask, setIsConfiguringLambdaTask] = useState(false);
  const [isConfiguringNestedDecision, setIsConfiguringNestedDecision] = useState(false);
  const [currentCaseKey, setCurrentCaseKey] = useState<string>('');
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(-1);
  const [nestedTaskType, setNestedTaskType] = useState<string>('GENERIC');
  const [selectedUserDefinedTask, setSelectedUserDefinedTask] = useState<string>('');

  // Auto-sync JSON in real-time whenever form values change
  useEffect(() => {
    if (!open) return;

    const config = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'DECISION',
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters: {
        yosSwitchCaseParam: switchCaseParam.trim(),
      },
      caseValues,
      output: {},
    };

    setFullJsonInput(JSON.stringify(config, null, 2));
    validateFullJson(JSON.stringify(config, null, 2));
  }, [
    open,
    taskRefId,
    taskId,
    taskListDomain,
    sequenceNo,
    switchCaseParam,
    caseValues
  ]);

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setTaskRefId(initialConfig.taskRefId);
        setTaskId(initialConfig.taskId);
        setTaskListDomain(initialConfig.taskListDomain || '');
        setSwitchCaseParam(initialConfig.taskinputParameters?.yosSwitchCaseParam || '');
        setCaseValues(initialConfig.caseValues || {});
      } else {
        const defaultTaskId = taskName.toLowerCase().replace(/\s+/g, '-');
        const timestamp = Date.now();
        setTaskRefId(`${defaultTaskId}-${sequenceNo}-taskref-${timestamp}`);
        setTaskId(`${defaultTaskId}-task`);
        setTaskListDomain('BOPUS-TASKLIST');
        setSwitchCaseParam('${workflow.input.orderType}');
        setCaseValues({
          'BOPIS': [],
          'SFS': [],
          'Default value': [],
        });
      }
      setActiveTab('basic');
      setFullJsonError('');
    }
  }, [initialConfig, taskName, sequenceNo, open]);

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

  const handleSave = () => {
    console.log('=== DecisionTaskConfigModal handleSave ===');
    console.log('Active tab:', activeTab);
    
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

    if (!switchCaseParam.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Switch Case Parameter is required',
        variant: 'destructive',
      });
      return;
    }

    if (Object.keys(caseValues).length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one case value is required',
        variant: 'destructive',
      });
      return;
    }

    const config: DecisionTaskConfiguration = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'DECISION',
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters: {
        yosSwitchCaseParam: switchCaseParam.trim(),
      },
      caseValues,
      output: {},
    };

    console.log('Saving Decision task config from form:', config);
    console.log('Case values:', caseValues);
    onSave(config);
    onClose();
  };

  const handleCopyToJson = () => {
    // JSON is already synced in real-time, just switch to JSON tab
    setActiveTab('json');
    toast({
      title: 'Viewing JSON',
      description: 'JSON is automatically synced with form data in real-time.',
    });
  };

  const handleAddCase = () => {
    const newCaseName = `Case ${Object.keys(caseValues).length + 1}`;
    setCaseValues({
      ...caseValues,
      [newCaseName]: [],
    });
  };

  const handleDeleteCase = (caseKey: string) => {
    const updated = { ...caseValues };
    delete updated[caseKey];
    setCaseValues(updated);
  };

  const handleRenameCaseKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey || !newKey.trim()) return;
    
    const updated: Record<string, DecisionCaseTask[]> = {};
    Object.keys(caseValues).forEach(key => {
      if (key === oldKey) {
        updated[newKey] = caseValues[key];
      } else {
        updated[key] = caseValues[key];
      }
    });
    setCaseValues(updated);
  };

  const handleAddTaskToCase = (caseKey: string, taskType: string = 'GENERIC', userDefinedTaskId?: string) => {
    setCurrentCaseKey(caseKey);
    setCurrentTaskIndex(-1);
    setNestedTaskType(taskType);
    
    if (userDefinedTaskId) {
      setSelectedUserDefinedTask(userDefinedTaskId);
    }
    
    if (taskType === 'LAMBDA') {
      setIsConfiguringLambdaTask(true);
    } else if (taskType === 'DECISION') {
      setIsConfiguringNestedDecision(true);
    } else {
      setIsConfiguringNestedTask(true);
    }
  };

  const handleEditTaskInCase = (caseKey: string, taskIndex: number) => {
    const task = caseValues[caseKey][taskIndex];
    setCurrentCaseKey(caseKey);
    setCurrentTaskIndex(taskIndex);
    setNestedTaskType(task.taskType);
    
    if (task.taskType === 'LAMBDA') {
      setIsConfiguringLambdaTask(true);
    } else if (task.taskType === 'DECISION') {
      setIsConfiguringNestedDecision(true);
    } else {
      setIsConfiguringNestedTask(true);
    }
  };

  const handleDeleteTaskFromCase = (caseKey: string, taskIndex: number) => {
    const updated = { ...caseValues };
    updated[caseKey] = updated[caseKey].filter((_, idx) => idx !== taskIndex);
    setCaseValues(updated);
  };

  const handleSaveNestedTask = (config: any) => {
    const updated = { ...caseValues };
    
    if (currentTaskIndex === -1) {
      if (!updated[currentCaseKey]) {
        updated[currentCaseKey] = [];
      }
      updated[currentCaseKey].push(config);
    } else {
      updated[currentCaseKey][currentTaskIndex] = config;
    }
    
    setCaseValues(updated);
    setIsConfiguringNestedTask(false);
    setIsConfiguringLambdaTask(false);
    setIsConfiguringNestedDecision(false);
    setCurrentCaseKey('');
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

  const DECISION_EXAMPLE = `{
  "taskRefId": "sample-decision-task-taskref",
  "taskId": "sample-decision-task",
  "taskType": "DECISION",
  "taskListDomain": "BOPUS-TASKLIST",
  "sequenceNo": 1,
  "taskinputParameters": {
    "yosSwitchCaseParam": "\${workflow.input.orderType}"
  },
  "caseValues": {
    "BOPIS": [
      {
        "taskRefId": "sample-generic-bopis-task-taskref",
        "taskId": "sample-generic-bopis-task",
        "taskType": "GENERIC",
        "taskListDomain": "BOPUS-TASKLIST",
        "sequenceNo": 1,
        "taskinputParameters": {
          "order": {
            "orderType": "\${workflow.input.orderType}",
            "hasReservation": "Y",
            "shipNode": "\${workflow.input.shipNode}"
          }
        }
      }
    ],
    "SFS": [
      {
        "taskRefId": "sample-generic-sfs-task-taskref",
        "taskId": "sample-generic-sfs-task",
        "taskType": "GENERIC",
        "taskListDomain": "BOPUS-TASKLIST",
        "sequenceNo": 1,
        "taskinputParameters": {
          "order": {
            "orderType": "\${workflow.input.orderType}",
            "hasReservation": "N"
          }
        }
      }
    ],
    "Default value": [
      {
        "taskRefId": "sample-generic-default-task-taskref",
        "taskId": "sample-generic-default-task",
        "taskType": "GENERIC",
        "taskListDomain": "BOPUS-TASKLIST",
        "sequenceNo": 1,
        "taskinputParameters": {
          "order": {
            "orderType": "\${workflow.input.orderType}",
            "hasReservation": "N"
          }
        }
      }
    ]
  },
  "output": {}
}`;

  const handleLoadExample = () => {
    setFullJsonInput(DECISION_EXAMPLE);
    validateFullJson(DECISION_EXAMPLE);
    toast({
      title: 'Example Loaded',
      description: 'Decision task example has been loaded.',
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] bg-card text-card-foreground border-border" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-foreground flex items-center gap-2">
              <GitBranchIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              Configure Decision Task
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                  DECISION
                </Badge>
                <span className="text-xs">Sequence: {sequenceNo}</span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger 
                value="basic"
                className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Task Configuration
              </TabsTrigger>
              <TabsTrigger 
                value="cases"
                className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Decision Cases
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
                      <p className="text-xs font-medium text-foreground">Decision Task Configuration</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Decision tasks enable conditional branching based on input parameters. Define cases and their corresponding task sequences.
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
                    placeholder="e.g., sample-decision-task-taskref"
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
                    placeholder="e.g., sample-decision-task"
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
                    placeholder="e.g., BOPUS-TASKLIST"
                    className="bg-background text-foreground border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Domain for task list organization and routing
                  </p>
                </div>

                <Separator className="bg-border" />

                <div className="space-y-2">
                  <Label htmlFor="switchCaseParam" className="text-foreground">
                    Switch Case Parameter <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="switchCaseParam"
                    value={switchCaseParam}
                    onChange={(e) => setSwitchCaseParam(e.target.value)}
                    placeholder="${workflow.input.orderType}"
                    className="bg-background text-foreground border-border font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Parameter to evaluate for decision branching. Use {'${workflow.input.fieldName}'} for dynamic values.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Task Type</Label>
                  <Input
                    value="DECISION"
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

              <TabsContent value="cases" className="space-y-4 mt-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">Decision Cases</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Define case values and their corresponding task sequences. Each case can contain multiple tasks that execute when the case matches.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-foreground">Case Values</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCase}
                    className="bg-transparent text-foreground border-border hover:bg-accent"
                  >
                    <PlusIcon className="h-3 w-3 mr-2" strokeWidth={1.5} />
                    Add Case
                  </Button>
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {Object.entries(caseValues).map(([caseKey, tasks]) => (
                      <Card key={caseKey} className="border-border bg-background">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1">
                              <Input
                                value={caseKey}
                                onChange={(e) => handleRenameCaseKey(caseKey, e.target.value)}
                                className="bg-card text-foreground border-border font-medium"
                                placeholder="Case name (e.g., BOPIS, SFS, Default value)"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteCase(caseKey)}
                              className="flex-shrink-0 bg-transparent text-destructive border-border hover:bg-destructive/10"
                            >
                              <TrashIcon className="h-4 w-4" strokeWidth={1.5} />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {tasks.length === 0 ? (
                            <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
                              <p className="text-xs text-muted-foreground mb-3">
                                No tasks defined for this case
                              </p>
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
                                <DropdownMenuContent align="center" className="w-56 bg-popover text-popover-foreground border-border">
                                  <DropdownMenuLabel className="text-foreground">System Tasks</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-border" />
                                  <DropdownMenuItem 
                                    onClick={() => handleAddTaskToCase(caseKey, 'GENERIC')}
                                    className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                  >
                                    <BoxIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                                    Generic Task
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleAddTaskToCase(caseKey, 'HTTP')}
                                    className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                  >
                                    <span className="mr-2">🌐</span>
                                    HTTP Task
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleAddTaskToCase(caseKey, 'LAMBDA')}
                                    className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                  >
                                    <CodeIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                                    Lambda Task
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleAddTaskToCase(caseKey, 'DECISION')}
                                    className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                  >
                                    <GitBranchIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                                    Decision Task (Nested)
                                  </DropdownMenuItem>
                                  
                                  {userDefinedTasks.length > 0 && (
                                    <>
                                      <DropdownMenuSeparator className="bg-border" />
                                      <DropdownMenuLabel className="text-foreground">User Defined Tasks</DropdownMenuLabel>
                                      <DropdownMenuSeparator className="bg-border" />
                                      {userDefinedTasks.slice(0, 5).map((task) => (
                                        <DropdownMenuItem 
                                          key={task.name}
                                          onClick={() => handleAddTaskToCase(caseKey, 'GENERIC', task.name)}
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
                                                onClick={() => handleAddTaskToCase(caseKey, 'GENERIC', task.name)}
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
                          ) : (
                            <>
                              {tasks.map((task, taskIndex) => (
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
                                      onClick={() => handleEditTaskInCase(caseKey, taskIndex)}
                                      className="h-7 w-7 bg-transparent text-foreground border-border hover:bg-accent"
                                    >
                                      <EditIcon className="h-3 w-3" strokeWidth={1.5} />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleDeleteTaskFromCase(caseKey, taskIndex)}
                                      className="h-7 w-7 bg-transparent text-destructive border-border hover:bg-destructive/10"
                                    >
                                      <TrashIcon className="h-3 w-3" strokeWidth={1.5} />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <div className="flex items-center justify-center gap-2 pt-2">
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
                                  <DropdownMenuContent align="center" className="w-56 bg-popover text-popover-foreground border-border">
                                    <DropdownMenuLabel className="text-foreground">System Tasks</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-border" />
                                    <DropdownMenuItem 
                                      onClick={() => handleAddTaskToCase(caseKey, 'GENERIC')}
                                      className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                    >
                                      <BoxIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                                      Generic Task
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleAddTaskToCase(caseKey, 'HTTP')}
                                      className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                    >
                                      <span className="mr-2">🌐</span>
                                      HTTP Task
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleAddTaskToCase(caseKey, 'LAMBDA')}
                                      className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                    >
                                      <CodeIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                                      Lambda Task
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleAddTaskToCase(caseKey, 'DECISION')}
                                      className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                    >
                                      <GitBranchIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                                      Decision Task (Nested)
                                    </DropdownMenuItem>
                                    
                                    {userDefinedTasks.length > 0 && (
                                      <>
                                        <DropdownMenuSeparator className="bg-border" />
                                        <DropdownMenuLabel className="text-foreground">User Defined Tasks</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-border" />
                                        {userDefinedTasks.slice(0, 5).map((task) => (
                                          <DropdownMenuItem 
                                            key={task.name}
                                            onClick={() => handleAddTaskToCase(caseKey, 'GENERIC', task.name)}
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
                                                  onClick={() => handleAddTaskToCase(caseKey, 'GENERIC', task.name)}
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
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {Object.keys(caseValues).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground mb-3">
                          No cases defined yet
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddCase}
                          className="bg-transparent text-foreground border-border hover:bg-accent"
                        >
                          <PlusIcon className="h-3 w-3 mr-2" strokeWidth={1.5} />
                          Add First Case
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="json" className="space-y-4 mt-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">JSON Editor Mode</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        View or edit the complete Decision task configuration in JSON format.
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
                      Copy from Form
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
                    className="h-[350px] w-full font-mono text-xs bg-background text-foreground border-0 focus-visible:ring-0 resize-none overflow-auto"
                    placeholder="Enter complete Decision task JSON configuration..."
                  />
                </div>

                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-xs font-medium text-foreground mb-2">Decision Task Tips:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Use <code className="bg-background px-1 rounded">yosSwitchCaseParam</code> to define the parameter to evaluate</li>
                    <li>Each case can contain multiple tasks that execute sequentially</li>
                    <li>Include a "Default value" case for unmatched conditions</li>
                    <li>Tasks within cases can be of any type (GENERIC, HTTP, LAMBDA, etc.)</li>
                  </ul>
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
            setCurrentCaseKey('');
            setCurrentTaskIndex(-1);
          }}
          onSave={handleSaveNestedTask}
          taskType={nestedTaskType}
          taskName={nestedTaskType === 'HTTP' ? 'HTTP Task' : 'Generic Task'}
          initialConfig={currentTaskIndex >= 0 ? caseValues[currentCaseKey]?.[currentTaskIndex] : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}

      {isConfiguringLambdaTask && (
        <LambdaTaskConfigModal
          open={isConfiguringLambdaTask}
          onClose={() => {
            setIsConfiguringLambdaTask(false);
            setCurrentCaseKey('');
            setCurrentTaskIndex(-1);
          }}
          onSave={handleSaveNestedTask}
          taskName="Lambda Task"
          initialConfig={currentTaskIndex >= 0 ? caseValues[currentCaseKey]?.[currentTaskIndex] : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}

      {isConfiguringNestedDecision && (
        <DecisionTaskConfigModal
          open={isConfiguringNestedDecision}
          onClose={() => {
            setIsConfiguringNestedDecision(false);
            setCurrentCaseKey('');
            setCurrentTaskIndex(-1);
          }}
          onSave={handleSaveNestedTask}
          taskName="Nested Decision Task"
          initialConfig={currentTaskIndex >= 0 ? caseValues[currentCaseKey]?.[currentTaskIndex] : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}
    </>
  );
}
