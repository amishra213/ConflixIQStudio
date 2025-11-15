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
import DecisionTaskConfigModal from './DecisionTaskConfigModal';
import ScheduledWaitTaskConfigModal from './ScheduledWaitTaskConfigModal';
import SignalOrScheduledWaitTaskConfigModal from './SignalOrScheduledWaitTaskConfigModal';
import SignalTaskConfigModal from './SignalTaskConfigModal';
import SignalWaitTaskConfigModal from './SignalWaitTaskConfigModal';
import DoWhileTaskConfigModal from './DoWhileTaskConfigModal';
import PassThroughTaskConfigModal from './PassThroughTaskConfigModal';
import TerminateTaskConfigModal from './TerminateTaskConfigModal';
import FallbackJsonTaskModal from './FallbackJsonTaskModal';

// Import task configuration types
interface LambdaTaskConfiguration {
  taskRefId: string;
  taskId: string;
  taskType: 'LAMBDA';
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
  taskinputParameters?: Record<string, any>;
  output?: Record<string, any>;
  caseValues: Record<string, ForkTask[]>;
}

interface ForkTask {
  taskRefId: string;
  taskId: string;
  taskType: string;
  taskListDomain?: string;
  sequenceNo: number;
  taskinputParameters?: Record<string, any>;
  output?: Record<string, any>;
}

interface ForkAndConvergeTaskConfiguration {
  taskRefId: string;
  taskId: string;
  taskType: 'FORK_AND_CONVERGE';
  taskListDomain?: string;
  sequenceNo: number;
  taskinputParameters?: Record<string, any>;
  forkTasks: ForkTask[][]; // Array of arrays for parallel branches
  convergeTasks: ForkTask[]; // Tasks to run after all forks complete
}

interface ForkAndConvergeTaskConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: ForkAndConvergeTaskConfiguration) => void;
  taskName: string;
  initialConfig?: ForkAndConvergeTaskConfiguration;
  sequenceNo: number;
}

export default function ForkAndConvergeTaskConfigModal({
  open,
  onClose,
  onSave,
  taskName,
  initialConfig,
  sequenceNo,
}: ForkAndConvergeTaskConfigModalProps) {
  console.log('=== ForkAndConvergeTaskConfigModal RENDER ===');
  console.log('Open:', open);
  console.log('Task Name:', taskName);
  console.log('Sequence No:', sequenceNo);
  console.log('Initial Config:', initialConfig);
  
  const { toast } = useToast();
  const { taskDefinitions } = useTaskDefinitions();
  
  const [taskRefId, setTaskRefId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [taskListDomain, setTaskListDomain] = useState('');
  const [inputParameters, setInputParameters] = useState<Record<string, string>>({});
  const [forkTasks, setForkTasks] = useState<ForkTask[][]>([]);
  const [convergeTasks, setConvergeTasks] = useState<ForkTask[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [fullJsonInput, setFullJsonInput] = useState('');
  const [fullJsonError, setFullJsonError] = useState('');
  const [useJsonEditor, setUseJsonEditor] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

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

  const [currentBranchIndex, setCurrentBranchIndex] = useState<number>(-1); // -1 for converge, >=0 for fork branch
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(-1);
  const [nestedTaskType, setNestedTaskType] = useState<string>('GENERIC');
  const [nestedTaskName, setNestedTaskName] = useState<string>('Generic Task');
  const [nestedInitialConfig, setNestedInitialConfig] = useState<ForkTask | undefined>(undefined);
  const [, setSelectedUserDefinedTask] = useState<string>('');

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
      taskType: 'FORK_AND_CONVERGE' as const,
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters: Object.keys(taskinputParameters).length > 0 ? taskinputParameters : undefined,
      forkTasks,
      convergeTasks,
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
    forkTasks,
    convergeTasks
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

        setForkTasks(initialConfig.forkTasks || []);
        setConvergeTasks(initialConfig.convergeTasks || []);
      } else {
        const defaultTaskId = taskName.toLowerCase().replace(/\s+/g, '-');
        const timestamp = Date.now();
        setTaskRefId(`${defaultTaskId}-${sequenceNo}-taskref-${timestamp}`);
        setTaskId(`${defaultTaskId}-task`);
        setTaskListDomain('DEFAULT-TASKLIST');
        setInputParameters({});
        setJsonInput('{}');
        setForkTasks([[]]); // Start with one empty branch
        setConvergeTasks([]);
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
    console.log('=== ForkAndConvergeTaskConfigModal handleSave ===');
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

    if (forkTasks.length === 0 || forkTasks.some(branch => branch.length === 0)) {
      toast({
        title: 'Validation Error',
        description: 'At least one task is required in each fork branch.',
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

    const config: ForkAndConvergeTaskConfiguration = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'FORK_AND_CONVERGE',
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters: Object.keys(taskinputParameters).length > 0 ? taskinputParameters : undefined,
      forkTasks,
      convergeTasks,
    };

    console.log('Saving Fork and Converge task config from form:', config);
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

  const handleAddForkBranch = () => {
    setForkTasks([...forkTasks, []]);
  };

  const handleDeleteForkBranch = (branchIndex: number) => {
    setForkTasks(forkTasks.filter((_, idx) => idx !== branchIndex));
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
    setIsConfiguringFallbackTask(false);
    setCurrentBranchIndex(-1);
    setCurrentTaskIndex(-1);
    setNestedTaskType('GENERIC');
    setNestedTaskName('Generic Task');
    setNestedInitialConfig(undefined);
  };

  const openNestedTaskModal = (
    branchIndex: number, // -1 for converge, >=0 for fork branch
    taskType: string, 
    taskName: string, 
    initialConfig?: ForkTask, 
    taskIndex: number = -1
  ) => {
    setCurrentBranchIndex(branchIndex);
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
      default:
        setIsConfiguringFallbackTask(true);
        break;
    }
  };

  const handleAddTaskToBranch = (branchIndex: number, taskType: string, taskName: string) => {
    openNestedTaskModal(branchIndex, taskType, taskName);
  };

  const handleEditTaskInBranch = (branchIndex: number, taskIndex: number) => {
    const task = branchIndex === -1 ? convergeTasks[taskIndex] : forkTasks[branchIndex][taskIndex];
    openNestedTaskModal(branchIndex, task.taskType, task.taskId, task, taskIndex);
  };

  const handleDeleteTaskFromBranch = (branchIndex: number, taskIndex: number) => {
    if (branchIndex === -1) {
      setConvergeTasks(convergeTasks.filter((_, idx) => idx !== taskIndex));
    } else {
      const updatedForks = [...forkTasks];
      updatedForks[branchIndex] = updatedForks[branchIndex].filter((_, idx) => idx !== taskIndex);
      setForkTasks(updatedForks);
    }
  };

  const handleSaveNestedTask = (config: ForkTask) => {
    if (currentBranchIndex === -1) { // Converge tasks
      const updated = [...convergeTasks];
      if (currentTaskIndex === -1) {
        updated.push(config);
      } else {
        updated[currentTaskIndex] = config;
      }
      setConvergeTasks(updated);
    } else { // Fork branches
      const updatedForks = [...forkTasks];
      if (currentTaskIndex === -1) {
        updatedForks[currentBranchIndex].push(config);
      } else {
        updatedForks[currentBranchIndex][currentTaskIndex] = config;
      }
      setForkTasks(updatedForks);
    }
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

  const FORK_AND_CONVERGE_EXAMPLE = `{
  "taskRefId": "fork_and_converge_example",
  "taskId": "fork_and_converge_task",
  "taskType": "FORK_AND_CONVERGE",
  "taskListDomain": "DEFAULT-TASKLIST",
  "sequenceNo": 1,
  "taskinputParameters": {
    "inputData": "\${workflow.input.data}"
  },
  "forkTasks": [
    [
      {
        "taskRefId": "parallel_task_1_ref",
        "taskId": "process_data_task",
        "taskType": "GENERIC",
        "taskListDomain": "DEFAULT-TASKLIST",
        "sequenceNo": 1,
        "taskinputParameters": {
          "data": "\${inputData}"
        }
      },
      {
        "taskRefId": "parallel_task_1_sub_ref",
        "taskId": "notify_user_task",
        "taskType": "HTTP",
        "taskListDomain": "DEFAULT-TASKLIST",
        "sequenceNo": 2,
        "taskinputParameters": {
          "HTTP": {
            "uri": "http://example.com/notify",
            "method": "POST",
            "body": { "message": "Task 1 completed" }
          }
        }
      }
    ],
    [
      {
        "taskRefId": "parallel_task_2_ref",
        "taskId": "audit_log_task",
        "taskType": "GENERIC",
        "taskListDomain": "DEFAULT-TASKLIST",
        "sequenceNo": 1,
        "taskinputParameters": {
          "log": "Audit entry for \${inputData}"
        }
      }
    ]
  ],
  "convergeTasks": [
    {
      "taskRefId": "final_merge_task_ref",
      "taskId": "merge_results_task",
      "taskType": "MAPPER",
      "taskListDomain": "DEFAULT-TASKLIST",
      "sequenceNo": 1,
      "taskinputParameters": {
        "MAPPER": {
          "result1": "\${parallel_task_1_sub_ref.output}",
          "result2": "\${parallel_task_2_ref.output}"
        }
      }
    }
  ]
}`;

  const handleLoadExample = () => {
    setFullJsonInput(FORK_AND_CONVERGE_EXAMPLE);
    validateFullJson(FORK_AND_CONVERGE_EXAMPLE);
    toast({
      title: 'Example Loaded',
      description: 'Fork and Converge task example has been loaded.',
    });
  };

  const renderTaskDropdown = (branchIndex: number) => (
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
          const Icon = typeof task.icon === 'string' ? null : task.icon;
          return (
            <DropdownMenuItem 
              key={task.id}
              onClick={() => handleAddTaskToBranch(branchIndex, task.id, task.name)}
              className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              {typeof task.icon === 'string' ? <span className="mr-2">{task.icon}</span> : <task.icon className="h-4 w-4 mr-2" strokeWidth={1.5} />}
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
              onClick={() => handleAddTaskToBranch(branchIndex, task.name, task.name)}
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
                      onClick={() => handleAddTaskToBranch(branchIndex, task.name, task.name)}
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
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem 
          onClick={() => handleAddTaskToBranch(branchIndex, 'JSON_TASK', 'Custom JSON Task')}
          className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
        >
          <CodeIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
          Custom JSON Task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-card text-card-foreground border-border" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-foreground flex items-center gap-2">
              <GitBranchIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              Configure Fork and Converge Task
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                  FORK_AND_CONVERGE
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
                value="forks"
                className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Fork Branches
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
                      <p className="text-xs font-medium text-foreground">Fork and Converge Task Configuration</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fork and Converge tasks allow you to execute multiple branches of tasks in parallel. The workflow will only proceed after all parallel branches have completed.
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
                    placeholder="e.g., fork_and_converge_example"
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
                    placeholder="e.g., fork_and_converge_task"
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
                    placeholder="e.g., DEFAULT-TASKLIST"
                    className="bg-background text-foreground border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Domain for task list organization and routing
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Task Type</Label>
                  <Input
                    value="FORK_AND_CONVERGE"
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

              <TabsContent value="forks" className="space-y-4 mt-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">Fork Branches & Converge Tasks</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Define multiple independent branches of tasks that will execute in parallel. Once all fork branches complete, the converge tasks will execute sequentially.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-foreground">Fork Branches</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddForkBranch}
                    className="bg-transparent text-foreground border-border hover:bg-accent"
                  >
                    <PlusIcon className="h-3 w-3 mr-2" strokeWidth={1.5} />
                    Add Branch
                  </Button>
                </div>

                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {forkTasks.map((branch, branchIndex) => (
                      <Card key={branchIndex} className="border-border bg-background">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">Branch {branchIndex + 1}</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteForkBranch(branchIndex)}
                              className="flex-shrink-0 bg-transparent text-destructive border-border hover:bg-destructive/10"
                            >
                              <TrashIcon className="h-4 w-4" strokeWidth={1.5} />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {branch.length === 0 ? (
                            <div className="text-center py-4 border-2 border-dashed border-border rounded-lg">
                              <p className="text-xs text-muted-foreground mb-3">
                                No tasks in this branch
                              </p>
                              {renderTaskDropdown(branchIndex)}
                            </div>
                          ) : (
                            <>
                              {branch.map((task, taskIndex) => (
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
                                      onClick={() => handleEditTaskInBranch(branchIndex, taskIndex)}
                                      className="h-7 w-7 bg-transparent text-foreground border-border hover:bg-accent"
                                    >
                                      <EditIcon className="h-3 w-3" strokeWidth={1.5} />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleDeleteTaskFromBranch(branchIndex, taskIndex)}
                                      className="h-7 w-7 bg-transparent text-destructive border-border hover:bg-destructive/10"
                                    >
                                      <TrashIcon className="h-3 w-3" strokeWidth={1.5} />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <div className="flex items-center justify-center gap-2 pt-2">
                                {renderTaskDropdown(branchIndex)}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {forkTasks.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-3">
                          No fork branches defined yet
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddForkBranch}
                          className="bg-transparent text-foreground border-border hover:bg-accent"
                        >
                          <PlusIcon className="h-3 w-3 mr-2" strokeWidth={1.5} />
                          Add First Branch
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <Separator className="bg-border" />

                <div className="flex items-center justify-between">
                  <Label className="text-foreground">Converge Tasks</Label>
                  {renderTaskDropdown(-1)} {/* -1 indicates converge tasks */}
                </div>

                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-3">
                    {convergeTasks.map((task, taskIndex) => (
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
                            onClick={() => handleEditTaskInBranch(-1, taskIndex)}
                            className="h-7 w-7 bg-transparent text-foreground border-border hover:bg-accent"
                          >
                            <EditIcon className="h-3 w-3" strokeWidth={1.5} />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteTaskFromBranch(-1, taskIndex)}
                            className="h-7 w-7 bg-transparent text-destructive border-border hover:bg-destructive/10"
                          >
                            <TrashIcon className="h-3 w-3" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {convergeTasks.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-3">
                          No converge tasks defined yet
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Add tasks that will execute after all fork branches complete
                        </p>
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
                        View or edit the complete Fork and Converge task configuration in JSON format. Changes are synced in real-time.
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
                    placeholder="Enter complete Fork and Converge task JSON configuration..."
                  />
                </div>

                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-xs font-medium text-foreground mb-2">Fork and Converge Task Example:</p>
                  <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{FORK_AND_CONVERGE_EXAMPLE}
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

      {/* Generic Task Modal */}
      {isConfiguringGenericTask && (
        <TaskConfigurationModal
          open={isConfiguringGenericTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskType={nestedTaskType}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (currentBranchIndex === -1 ? convergeTasks.length : forkTasks[currentBranchIndex].length) + 1}
        />
      )}

      {/* Lambda Task Modal */}
      {isConfiguringLambdaTask && (
        <LambdaTaskConfigModal
          open={isConfiguringLambdaTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig?.taskType === 'LAMBDA' ? nestedInitialConfig as LambdaTaskConfiguration : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (currentBranchIndex === -1 ? convergeTasks.length : forkTasks[currentBranchIndex].length) + 1}
        />
      )}

      {/* Nested Decision Task Modal */}
      {isConfiguringDecisionTask && (
        <DecisionTaskConfigModal
          open={isConfiguringDecisionTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig?.taskType === 'DECISION' ? nestedInitialConfig as DecisionTaskConfiguration : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (currentBranchIndex === -1 ? convergeTasks.length : forkTasks[currentBranchIndex].length) + 1}
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
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (currentBranchIndex === -1 ? convergeTasks.length : forkTasks[currentBranchIndex].length) + 1}
        />
      )}

      {/* Scheduled Wait Task Modal */}
      {isConfiguringScheduledWaitTask && (
        <ScheduledWaitTaskConfigModal
          open={isConfiguringScheduledWaitTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig?.taskType === 'SCHEDULED_WAIT' ? nestedInitialConfig as any : undefined}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (currentBranchIndex === -1 ? convergeTasks.length : forkTasks[currentBranchIndex].length) + 1}
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
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (currentBranchIndex === -1 ? convergeTasks.length : forkTasks[currentBranchIndex].length) + 1}
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
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (currentBranchIndex === -1 ? convergeTasks.length : forkTasks[currentBranchIndex].length) + 1}
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
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (currentBranchIndex === -1 ? convergeTasks.length : forkTasks[currentBranchIndex].length) + 1}
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
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (currentBranchIndex === -1 ? convergeTasks.length : forkTasks[currentBranchIndex].length) + 1}
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
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (currentBranchIndex === -1 ? convergeTasks.length : forkTasks[currentBranchIndex].length) + 1}
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
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (currentBranchIndex === -1 ? convergeTasks.length : forkTasks[currentBranchIndex].length) + 1}
        />
      )}

      {/* Fork and Converge Task Modal */}
      {isConfiguringForkAndConvergeTask && (
        <ForkAndConvergeTaskConfigModal
          open={isConfiguringForkAndConvergeTask}
          onClose={resetNestedModalStates}
          onSave={handleSaveNestedTask}
          taskName={nestedTaskName}
          initialConfig={nestedInitialConfig as ForkAndConvergeTaskConfiguration}
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (currentBranchIndex === -1 ? convergeTasks.length : forkTasks[currentBranchIndex]?.length || 0) + 1}
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
          sequenceNo={currentTaskIndex >= 0 ? currentTaskIndex + 1 : (currentBranchIndex === -1 ? convergeTasks.length : forkTasks[currentBranchIndex]?.length || 0) + 1}
        />
      )}
    </>
  );
}
