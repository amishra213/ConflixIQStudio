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
import { Switch } from '@/components/ui/switch';
import { 
  PlusIcon, 
  TrashIcon, 
  AlertCircleIcon, 
  InfoIcon, 
  CopyIcon, 
  CodeIcon, 
  CheckCircle2Icon, 
  BellIcon,
  ZapIcon
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';


interface SignalAction {
  actionType: string;
  actionInputParameters: {
    workflowExecutionId?: string;
    taskRefId?: string;
    failTask?: boolean;
    output?: Record<string, any>;
    [key: string]: any;
  };
}

interface SignalTaskConfiguration {
  taskRefId: string;
  taskId: string;
  taskType: 'SIGNAL';
  taskListDomain?: string;
  sequenceNo: number;
  taskinputParameters?: Record<string, any>;
  actions?: SignalAction[];
}

interface SignalTaskConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: SignalTaskConfiguration) => void;
  taskName: string;
  initialConfig?: SignalTaskConfiguration;
  sequenceNo: number;
}

export default function SignalTaskConfigModal({
  open,
  onClose,
  onSave,
  taskName,
  initialConfig,
  sequenceNo,
}: SignalTaskConfigModalProps) {
  console.log('=== SignalTaskConfigModal RENDER ===');
  console.log('Open prop:', open);
  console.log('Task Name:', taskName);
  console.log('Sequence No:', sequenceNo);
  console.log('Initial Config:', initialConfig);
  
  const { toast } = useToast();
  
  const [taskRefId, setTaskRefId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [taskListDomain, setTaskListDomain] = useState('');
  const [inputParameters, setInputParameters] = useState<Record<string, string>>({});
  const [actions, setActions] = useState<SignalAction[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [fullJsonInput, setFullJsonInput] = useState('');
  const [fullJsonError, setFullJsonError] = useState('');
  const [useJsonEditor, setUseJsonEditor] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  if (!open) {
    console.log('Modal not open, returning null');
    return null;
  }
  
  console.log('✓ SignalTaskConfigModal will render Dialog component');

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
      taskType: 'SIGNAL' as const,
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters: Object.keys(taskinputParameters).length > 0 ? taskinputParameters : undefined,
      actions: actions.length > 0 ? actions : undefined,
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
    actions
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

        if (initialConfig.actions) {
          setActions(initialConfig.actions);
        }
      } else {
        const timestamp = Date.now();
        setTaskRefId(`send-schedule-order-status-signal-taskref-${timestamp}`);
        setTaskId('send-schedule-order-status-signal');
        setTaskListDomain('BOPUS-TASKLIST');
        
        // Set default input parameters
        const defaultParams = {
          'sourceWorkflowExecutionId-1': '${workflow.input.sourceWorkflowExecutionId}',
        };
        setInputParameters(defaultParams);
        setJsonInput(JSON.stringify(defaultParams, null, 2));

        // Set default action
        const defaultAction: SignalAction = {
          actionType: 'unblock_wait_task',
          actionInputParameters: {
            workflowExecutionId: '${sourceWorkflowExecutionId-1}',
            taskRefId: 'wait-for-schedule-status-signal-taskref',
            failTask: false,
            output: {
              response: '${result}',
            },
          },
        };
        setActions([defaultAction]);
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
    console.log('=== SignalTaskConfigModal handleSave ===');
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

    const config: SignalTaskConfiguration = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'SIGNAL',
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters: Object.keys(taskinputParameters).length > 0 ? taskinputParameters : undefined,
      actions: actions.length > 0 ? actions : undefined,
    };

    console.log('Saving Signal task config from form:', config);
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

  const handleAddAction = () => {
    const newAction: SignalAction = {
      actionType: 'unblock_wait_task',
      actionInputParameters: {
        workflowExecutionId: '',
        taskRefId: '',
        failTask: false,
        output: {},
      },
    };
    setActions([...actions, newAction]);
  };

  const handleUpdateAction = (index: number, updatedAction: SignalAction) => {
    const updated = [...actions];
    updated[index] = updatedAction;
    setActions(updated);
  };

  const handleDeleteAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const SIGNAL_EXAMPLE = `{
  "taskRefId": "send-schedule-order-status-signal-taskref",
  "taskId": "send-schedule-order-status-signal",
  "taskListDomain": "BOPUS-TASKLIST",
  "sequenceNo": 1,
  "taskType": "SIGNAL",
  "taskinputParameters": {
    "sourceWorkflowExecutionId-1": "\${workflow.input.sourceWorkflowExecutionId}"
  },
  "actions": [
    {
      "actionType": "unblock_wait_task",
      "actionInputParameters": {
        "workflowExecutionId": "\${sourceWorkflowExecutionId-1}",
        "taskRefId": "wait-for-schedule-status-signal-taskref",
        "failTask": false,
        "output": {
          "response": "\${result}"
        }
      }
    }
  ]
}`;

  const handleLoadExample = () => {
    setFullJsonInput(SIGNAL_EXAMPLE);
    validateFullJson(SIGNAL_EXAMPLE);
    toast({
      title: 'Example Loaded',
      description: 'Signal task example has been loaded.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      console.log('=== SignalTaskConfigModal Dialog onOpenChange ===');
      console.log('New open state:', isOpen);
      if (!isOpen) {
        console.log('Calling onClose');
        onClose();
      }
    }}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-card text-card-foreground border-border" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-foreground flex items-center gap-2">
            <BellIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
            Configure Signal Task
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Signal tasks send notifications to waiting tasks in other workflows or the same workflow
          </DialogDescription>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              SIGNAL
            </Badge>
            <span className="text-xs text-muted-foreground">Sequence: {sequenceNo}</span>
          </div>
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
              value="actions"
              className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Actions
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
                    <p className="text-xs font-medium text-foreground">Signal Task Configuration</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Signal tasks send notifications to waiting tasks in other workflows or the same workflow. They can unblock wait tasks and pass data between workflow executions.
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
                  placeholder="e.g., send-schedule-order-status-signal-taskref"
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
                  placeholder="e.g., send-schedule-order-status-signal"
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

              <div className="space-y-2">
                <Label className="text-foreground">Task Type</Label>
                <Input
                  value="SIGNAL"
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
                    <p className="text-xs font-medium text-foreground">Signal Input Parameters</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Define parameters that will be available to signal actions. These can reference workflow inputs or previous task outputs.
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
  "sourceWorkflowExecutionId-1": "\${workflow.input.sourceWorkflowExecutionId}"
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
                                    placeholder="Parameter name (e.g., sourceWorkflowExecutionId-1)"
                                    className="bg-background text-foreground border-border mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Parameter Value</Label>
                                  <Input
                                    value={value}
                                    onChange={(e) => handleUpdateInputParameterValue(key, e.target.value)}
                                    placeholder='${workflow.input.sourceWorkflowExecutionId}'
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
                  <li>Use <code className="bg-background px-1 rounded">{'${taskRef.output.fieldName}'}</code> to reference previous task outputs</li>
                  <li>Parameters can be referenced in actions using <code className="bg-background px-1 rounded">{'${parameterName}'}</code></li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">Signal Actions</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Define actions that will be executed when this signal is sent. Actions can unblock waiting tasks in other workflows.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-foreground">Actions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAction}
                  className="bg-transparent text-foreground border-border hover:bg-accent"
                >
                  <PlusIcon className="h-3 w-3 mr-2" strokeWidth={1.5} />
                  Add Action
                </Button>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {actions.map((action, index) => (
                    <Card key={index} className="border-border bg-background">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ZapIcon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                            <p className="text-sm font-medium text-foreground">Action {index + 1}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteAction(index)}
                            className="h-7 w-7 bg-transparent text-destructive border-border hover:bg-destructive/10"
                          >
                            <TrashIcon className="h-3 w-3" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Action Type</Label>
                          <Input
                            value={action.actionType}
                            onChange={(e) => {
                              const updated = { ...action, actionType: e.target.value };
                              handleUpdateAction(index, updated);
                            }}
                            placeholder="e.g., unblock_wait_task"
                            className="bg-card text-foreground border-border"
                          />
                        </div>

                        <Separator className="bg-border" />

                        <div className="space-y-3">
                          <Label className="text-xs font-medium text-foreground">Action Input Parameters</Label>
                          
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Workflow Execution ID</Label>
                            <Input
                              value={action.actionInputParameters.workflowExecutionId || ''}
                              onChange={(e) => {
                                const updated = {
                                  ...action,
                                  actionInputParameters: {
                                    ...action.actionInputParameters,
                                    workflowExecutionId: e.target.value,
                                  },
                                };
                                handleUpdateAction(index, updated);
                              }}
                              placeholder="${sourceWorkflowExecutionId-1}"
                              className="bg-card text-foreground border-border font-mono text-xs"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Task Reference ID</Label>
                            <Input
                              value={action.actionInputParameters.taskRefId || ''}
                              onChange={(e) => {
                                const updated = {
                                  ...action,
                                  actionInputParameters: {
                                    ...action.actionInputParameters,
                                    taskRefId: e.target.value,
                                  },
                                };
                                handleUpdateAction(index, updated);
                              }}
                              placeholder="wait-for-schedule-status-signal-taskref"
                              className="bg-card text-foreground border-border"
                            />
                          </div>

                          <div className="flex items-center justify-between p-2 rounded bg-card border border-border">
                            <div>
                              <Label className="text-xs text-foreground">Fail Task</Label>
                              <p className="text-xs text-muted-foreground">Mark the waiting task as failed</p>
                            </div>
                            <Switch
                              checked={action.actionInputParameters.failTask || false}
                              onCheckedChange={(checked) => {
                                const updated = {
                                  ...action,
                                  actionInputParameters: {
                                    ...action.actionInputParameters,
                                    failTask: checked,
                                  },
                                };
                                handleUpdateAction(index, updated);
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Output (JSON)</Label>
                            <Textarea
                              value={JSON.stringify(action.actionInputParameters.output || {}, null, 2)}
                              onChange={(e) => {
                                try {
                                  const output = JSON.parse(e.target.value);
                                  const updated = {
                                    ...action,
                                    actionInputParameters: {
                                      ...action.actionInputParameters,
                                      output,
                                    },
                                  };
                                  handleUpdateAction(index, updated);
                                } catch {
                                  // Invalid JSON, don't update
                                }
                              }}
                              placeholder='{"response": "${result}"}'
                              className="bg-card text-foreground border-border font-mono text-xs min-h-[80px] resize-y"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {actions.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-3">
                        No actions defined yet
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddAction}
                        className="bg-transparent text-foreground border-border hover:bg-accent"
                      >
                        <PlusIcon className="h-3 w-3 mr-2" strokeWidth={1.5} />
                        Add First Action
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-xs font-medium text-foreground mb-2">Action Types:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li><code className="bg-background px-1 rounded">unblock_wait_task</code> - Unblock a waiting task in another workflow</li>
                  <li><code className="bg-background px-1 rounded">complete_task</code> - Complete a task with provided output</li>
                  <li><code className="bg-background px-1 rounded">fail_task</code> - Fail a task with error details</li>
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
                      View or edit the complete Signal task configuration in JSON format. Changes are synced in real-time.
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
                    placeholder="Enter complete Signal task JSON configuration..."
                  />
                </div>

                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-xs font-medium text-foreground mb-2">Signal Task Example:</p>
                  <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{SIGNAL_EXAMPLE}
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
    );
  }
