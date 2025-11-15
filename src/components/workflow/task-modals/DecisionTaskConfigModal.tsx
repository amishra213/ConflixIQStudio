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
  ChevronDownIcon,
  FunctionSquareIcon,
  ClockIcon,
  BellIcon,
  ZapIcon,
  XCircleIcon,
  ArrowRightIcon,
  RepeatIcon
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
import { useTaskDefinitions } from '@/hooks/useConductorTasks';
import TaskConfigurationModal from './TaskConfigurationModal';
import LambdaTaskConfigModal from './LambdaTaskConfigModal';
import MapperTaskConfigModal from './MapperTaskConfigModal';
import ScheduledWaitTaskConfigModal from './ScheduledWaitTaskConfigModal';
import SignalOrScheduledWaitTaskConfigModal from './SignalOrScheduledWaitTaskConfigModal';
import SignalTaskConfigModal from './SignalTaskConfigModal';
import TerminateTaskConfigModal from './TerminateTaskConfigModal';
import PassThroughTaskConfigModal from './PassThroughTaskConfigModal';
import DoWhileTaskConfigModal from './DoWhileTaskConfigModal';
import ForkAndConvergeTaskConfigModal from './ForkAndConvergeTaskConfigModal';
import SignalWaitTaskConfigModal from './SignalWaitTaskConfigModal';
import FallbackJsonTaskModal from './FallbackJsonTaskModal';
interface DecisionCaseTask {
  taskRefId: string;
  taskId: string;
  taskType: string;
  taskListDomain?: string;
  sequenceNo: number;
  taskinputParameters?: Record<string, any>;
  output?: Record<string, any>;
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
  const [isConfiguringGenericTask, setIsConfiguringGenericTask] = useState(false);
  const [isConfiguringLambdaTask, setIsConfiguringLambdaTask] = useState(false);
  const [isConfiguringDecisionTask, setIsConfiguringDecisionTask] = useState(false);
  const [isConfiguringMapperTask, setIsConfiguringMapperTask] = useState(false);
  const [isConfiguringScheduledWaitTask, setIsConfiguringScheduledWaitTask] = useState(false);
  const [isConfiguringSignalOrScheduledWaitTask, setIsConfiguringSignalOrScheduledWaitTask] = useState(false);
  const [isConfiguringSignalTask, setIsConfiguringSignalTask] = useState(false);
  const [isConfiguringSignalWaitTask, setIsConfiguringSignalWaitTask] = useState(false);
  const [isConfiguringTerminateTask, setIsConfiguringTerminateTask] = useState(false);
  const [isConfiguringPassThroughTask, setIsConfiguringPassThroughTask] = useState(false);
  const [isConfiguringDoWhileTask, setIsConfiguringDoWhileTask] = useState(false);
  const [isConfiguringForkAndConvergeTask, setIsConfiguringForkAndConvergeTask] = useState(false);
  const [isConfiguringFallbackTask, setIsConfiguringFallbackTask] = useState(false);

  const [currentCaseKey, setCurrentCaseKey] = useState<string>('');
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(-1);
  const [nestedTaskType, setNestedTaskType] = useState<string>('GENERIC');
  const [nestedTaskName, setNestedTaskName] = useState<string>('Generic Task');
  const [nestedInitialConfig, setNestedInitialConfig] = useState<DecisionCaseTask | undefined>(undefined);

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

  const resetNestedModalStates = () => {
    setIsConfiguringGenericTask(false);
    setIsConfiguringLambdaTask(false);
    setIsConfiguringDecisionTask(false);
    setIsConfiguringMapperTask(false);
    setIsConfiguringScheduledWaitTask(false);
    setIsConfiguringSignalOrScheduledWaitTask(false);
    setIsConfiguringSignalTask(false);
    setIsConfiguringSignalWaitTask(false);
    setIsConfiguringTerminateTask(false);
    setIsConfiguringPassThroughTask(false);
    setIsConfiguringDoWhileTask(false);
    setIsConfiguringForkAndConvergeTask(false);
    setIsConfiguringFallbackTask(false);
    setCurrentCaseKey('');
    setCurrentTaskIndex(-1);
    setNestedTaskType('GENERIC');
    setNestedTaskName('Generic Task');
    setNestedInitialConfig(undefined);
  };

  const openNestedTaskModal = (caseKey: string, taskType: string, taskName: string, initialConfig?: DecisionCaseTask, taskIndex: number = -1) => {
    setCurrentCaseKey(caseKey);
    setCurrentTaskIndex(taskIndex);
    setNestedTaskType(taskType);
    setNestedTaskName(taskName);
    setNestedInitialConfig(initialConfig);

    switch (taskType) {
      case 'GENERIC':
      case 'HTTP':
        setIsConfiguringGenericTask(true);
        break;
      case 'LAMBDA':
        setIsConfiguringLambdaTask(true);
        break;
      case 'DECISION':
        setIsConfiguringDecisionTask(true);
        break;
      case 'MAPPER':
        setIsConfiguringMapperTask(true);
        break;
      case 'SCHEDULED_WAIT':
        setIsConfiguringScheduledWaitTask(true);
        break;
      case 'SIGNAL_OR_SCHEDULED_WAIT':
        setIsConfiguringSignalOrScheduledWaitTask(true);
        break;
      case 'SIGNAL':
        setIsConfiguringSignalTask(true);
        break;
      case 'SIGNAL_WAIT':
        setIsConfiguringSignalWaitTask(true);
        break;
      case 'TERMINATE':
        setIsConfiguringTerminateTask(true);
        break;
      case 'PASS_THROUGH':
        setIsConfiguringPassThroughTask(true);
        break;
      case 'DO_WHILE':
        setIsConfiguringDoWhileTask(true);
        break;
      case 'FORK_AND_CONVERGE':
        setIsConfiguringForkAndConvergeTask(true);
        break;
      case 'JSON_TASK':
        setIsConfiguringFallbackTask(true);
        break;
      default:
        setIsConfiguringFallbackTask(true);
        break;
    }
  };

  const handleAddTaskToCase = (caseKey: string, taskType: string, taskName: string) => {
    openNestedTaskModal(caseKey, taskType, taskName);
  };

  const handleEditTaskInCase = (caseKey: string, taskIndex: number) => {
    const task = caseValues[caseKey][taskIndex];
    openNestedTaskModal(caseKey, task.taskType, task.taskId, task, taskIndex);
  };

  const handleDeleteTaskFromCase = (caseKey: string, taskIndex: number) => {
    const updated = { ...caseValues };
    updated[caseKey] = updated[caseKey].filter((_, idx) => idx !== taskIndex);
    setCaseValues(updated);
  };

  const handleSaveNestedTask = (config: DecisionCaseTask) => {
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
    resetNestedModalStates();
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'LAMBDA':
        return '🔧';
      case 'HTTP':
        return '🌐';
      case 'DECISION':
        return '🔀';
      case 'FORK_AND_CONVERGE':
        return '⑂';
      case 'DO_WHILE':
        return '🔁';
      case 'SUB_WORKFLOW':
        return '📋';
      case 'EVENT':
        return '📡';
      case 'WAIT':
        return '⏱️';
      case 'JSON_TASK':
        return '📝';
      default:
        return '📦';
    }
  };

  const systemTaskTypes = [
    { id: 'GENERIC', name: 'Generic Task', icon: BoxIcon },
    { id: 'HTTP', name: 'HTTP Task', icon: '🌐' },
    { id: 'LAMBDA', name: 'Lambda Task', icon: CodeIcon },
    { id: 'DECISION', name: 'Decision Task', icon: GitBranchIcon },
    { id: 'MAPPER', name: 'Mapper Task', icon: FunctionSquareIcon },
    { id: 'SCHEDULED_WAIT', name: 'Scheduled Wait Task', icon: ClockIcon },
    { id: 'SIGNAL_OR_SCHEDULED_WAIT', name: 'Signal or Scheduled Wait Task', icon: BellIcon },
    { id: 'SIGNAL', name: 'Signal Task', icon: ZapIcon },
    { id: 'SIGNAL_WAIT', name: 'Signal Wait Task', icon: BellIcon },
    { id: 'TERMINATE', name: 'Terminate Task', icon: XCircleIcon },
    { id: 'PASS_THROUGH', name: 'Pass Through Task', icon: ArrowRightIcon },
    { id: 'DO_WHILE', name: 'Do While Task', icon: RepeatIcon },
    { id: 'FORK_AND_CONVERGE', name: 'Fork and Converge Task', icon: GitBranchIcon },
  ];

  const userDefinedTasks = taskDefinitions.filter((task: { name: string; }) =>
    !systemTaskTypes.some(sysTask => sysTask.id === task.name || sysTask.name === task.name)
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
              Decision tasks evaluate conditions and route workflow execution based on the result
            </DialogDescription>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                DECISION
              </Badge>
              <span className="text-xs text-muted-foreground">Sequence: {sequenceNo}</span>
            </div>
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
                                  {systemTaskTypes.map((task) => {
                                    const Icon = typeof task.icon === 'string' ? null : task.icon as React.ComponentType<{ className?: string; strokeWidth?: number }>;
                                    return (
                                      <DropdownMenuItem
                                        key={task.id}
                                        onClick={() => handleAddTaskToCase(caseKey, task.id, task.name)}
                                        className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                      >
                                        {Icon ? <Icon className="h-4 w-4 mr-2" strokeWidth={1.5} /> : <span className="mr-2">{typeof task.icon === 'string' ? task.icon : ''}</span>}
                                        {task.name}
                                      </DropdownMenuItem>
                                    );
                                  })}

                                  {userDefinedTasks.length > 0 && (
                                    <>
                                      <DropdownMenuSeparator className="bg-border" />
                                      <DropdownMenuLabel className="text-foreground">User Defined Tasks</DropdownMenuLabel>
                                      <DropdownMenuSeparator className="bg-border" />
                                      {userDefinedTasks.slice(0, 5).map((task: { name: string; }) => (
                                        <DropdownMenuItem
                                          key={task.name}
                                          onClick={() => handleAddTaskToCase(caseKey, task.name, task.name)}
                                          className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                        >
                                          <BoxIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                                          {task.name}
                                        </DropdownMenuItem>
                                      ))}
                                      {userDefinedTasks.length > 5 && (
                                        <DropdownMenuSub>
                                          <DropdownMenuSubTrigger className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
                                            <BoxIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                                            More Tasks...
                                          </DropdownMenuSubTrigger>
                                          <DropdownMenuSubContent className="bg-popover text-popover-foreground border-border max-h-[300px] overflow-y-auto">
                                            {userDefinedTasks.slice(5).map((task: { name: string; }) => (
                                              <DropdownMenuItem
                                                key={task.name}
                                                onClick={() => handleAddTaskToCase(caseKey, task.name, task.name)}
                                                className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                              >
                                                {task.name}
                                              </DropdownMenuItem>
                                            ))}
                                          </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                      )}
                                      <DropdownMenuSeparator className="bg-border" />
                                      <DropdownMenuItem
                                        onClick={() => handleAddTaskToCase(caseKey, 'JSON_TASK', 'Custom JSON Task')}
                                        className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                      >
                                        <CodeIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                                        Custom JSON Task
                                      </DropdownMenuItem>
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
                                    {systemTaskTypes.map((task) => {
                                      const Icon = typeof task.icon === 'string' ? null : task.icon as React.ComponentType<{ className?: string; strokeWidth?: number }>;
                                      return (
                                        <DropdownMenuItem
                                          key={task.id}
                                          onClick={() => handleAddTaskToCase(caseKey, task.id, task.name)}
                                          className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                        >
                                          {Icon ? <Icon className="h-4 w-4 mr-2" strokeWidth={1.5} /> : <span className="mr-2">{typeof task.icon === 'string' ? task.icon : ''}</span>}
                                          {task.name}
                                        </DropdownMenuItem>
                                      );
                                    })}

                                    {userDefinedTasks.length > 0 && (
                                      <>
                                        <DropdownMenuSeparator className="bg-border" />
                                        <DropdownMenuLabel className="text-foreground">User Defined Tasks</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-border" />
                                        {userDefinedTasks.slice(0, 5).map((task: { name: string }) => (
                                          <DropdownMenuItem
                                            key={task.name}
                                            onClick={() => handleAddTaskToCase(caseKey, task.name, task.name)}
                                            className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                          >
                                            <BoxIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                                            {task.name}
                                          </DropdownMenuItem>
                                        ))}
                                        {userDefinedTasks.length > 5 && (
                                          <DropdownMenuSub>
                                            <DropdownMenuSubTrigger className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
                                              <BoxIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                                              More Tasks...
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent className="bg-popover text-popover-foreground border-border max-h-[300px] overflow-y-auto">
                                              {userDefinedTasks.slice(5).map((task: { name: string }) => (
                                                <DropdownMenuItem
                                                  key={task.name}
                                                  onClick={() => handleAddTaskToCase(caseKey, task.name, task.name)}
                                                  className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                >
                                                  {task.name}
                                                </DropdownMenuItem>
                                              ))}
                                            </DropdownMenuSubContent>
                                          </DropdownMenuSub>
                                        )}
                                        <DropdownMenuSeparator className="bg-border" />
                                        <DropdownMenuItem
                                          onClick={() => handleAddTaskToCase(caseKey, 'JSON_TASK', 'Custom JSON Task')}
                                          className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                        >
                                          <CodeIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                                          Custom JSON Task
                                        </DropdownMenuItem>
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

      {/* Generic Task Modal */}
      {isConfiguringGenericTask && (
        <TaskConfigurationModal
          open={isConfiguringGenericTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskType={nestedTaskType}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}

      {/* Lambda Task Modal */}
      {isConfiguringLambdaTask && (
        <LambdaTaskConfigModal
          open={isConfiguringLambdaTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig?.taskType === 'LAMBDA' ? nestedInitialConfig as any : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}

      {/* Nested Decision Task Modal */}
      {isConfiguringDecisionTask && (
        <DecisionTaskConfigModal
          open={isConfiguringDecisionTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig as DecisionTaskConfiguration}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}

      {/* Mapper Task Modal */}
      {isConfiguringMapperTask && (
        <MapperTaskConfigModal
          open={isConfiguringMapperTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig?.taskType === 'MAPPER' ? nestedInitialConfig as any : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}

      {/* Scheduled Wait Task Modal */}
      {isConfiguringScheduledWaitTask && (
        <ScheduledWaitTaskConfigModal
          open={isConfiguringScheduledWaitTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig as any}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}

      {/* Signal or Scheduled Wait Task Modal */}
      {isConfiguringSignalOrScheduledWaitTask && (
        <SignalOrScheduledWaitTaskConfigModal
          open={isConfiguringSignalOrScheduledWaitTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig?.taskType === 'SIGNAL_OR_SCHEDULED_WAIT' ? nestedInitialConfig as any : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}

      {/* Signal Task Modal */}
      {isConfiguringSignalTask && (
        <SignalTaskConfigModal
          open={isConfiguringSignalTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig?.taskType === 'SIGNAL' ? nestedInitialConfig as any : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}

      {/* Signal Wait Task Modal */}
      {isConfiguringSignalWaitTask && (
        <SignalWaitTaskConfigModal
          open={isConfiguringSignalWaitTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig?.taskType === 'SIGNAL_WAIT' ? nestedInitialConfig as any : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}

      {/* Terminate Task Modal */}
      {isConfiguringTerminateTask && (
        <TerminateTaskConfigModal
          open={isConfiguringTerminateTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig?.taskType === 'TERMINATE' ? nestedInitialConfig as any : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}

      {/* Pass Through Task Modal */}
      {isConfiguringPassThroughTask && (
        <PassThroughTaskConfigModal
          open={isConfiguringPassThroughTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig?.taskType === 'PASS_THROUGH' ? nestedInitialConfig as any : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}

      {/* Do While Task Modal */}
      {isConfiguringDoWhileTask && (
        <DoWhileTaskConfigModal
          open={isConfiguringDoWhileTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig?.taskType === 'DO_WHILE' ? nestedInitialConfig as any : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}

      {/* Fork and Converge Task Modal */}
      {isConfiguringForkAndConvergeTask && (
        <ForkAndConvergeTaskConfigModal
          open={isConfiguringForkAndConvergeTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig?.taskType === 'FORK_AND_CONVERGE' ? nestedInitialConfig as any : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}

      {/* Fallback JSON Task Modal */}
      {isConfiguringFallbackTask && (
        <FallbackJsonTaskModal
          open={isConfiguringFallbackTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskType={nestedTaskType}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (caseValues[currentCaseKey]?.length || 0) + 1}
        />
      )}
    </>
  );
}
