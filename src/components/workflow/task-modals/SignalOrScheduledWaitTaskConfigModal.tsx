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
import { AlertCircleIcon, InfoIcon, CopyIcon, CodeIcon, CheckCircle2Icon, ClockIcon, BellIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SignalOrScheduledWaitTaskConfiguration {
  taskRefId: string;
  taskId: string;
  taskType: 'SIGNAL_OR_SCHEDULED_WAIT';
  taskListDomain?: string;
  sequenceNo: number;
  taskinputParameters?: {
    pauseDuration?: string;
    pauseDurationUnits?: string;
    [key: string]: any;
  };
}

interface SignalOrScheduledWaitTaskConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: SignalOrScheduledWaitTaskConfiguration) => void;
  taskName: string;
  initialConfig?: SignalOrScheduledWaitTaskConfiguration;
  sequenceNo: number;
}

export default function SignalOrScheduledWaitTaskConfigModal({
  open,
  onClose,
  onSave,
  taskName,
  initialConfig,
  sequenceNo,
}: SignalOrScheduledWaitTaskConfigModalProps) {
  console.log('=== SignalOrScheduledWaitTaskConfigModal RENDER ===');
  console.log('Open:', open);
  console.log('Task Name:', taskName);
  console.log('Sequence No:', sequenceNo);
  console.log('Initial Config:', initialConfig);
  
  const { toast } = useToast();
  
  const [taskRefId, setTaskRefId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [taskListDomain, setTaskListDomain] = useState('');
  const [pauseDuration, setPauseDuration] = useState('');
  const [pauseDurationUnits, setPauseDurationUnits] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [fullJsonInput, setFullJsonInput] = useState('');
  const [fullJsonError, setFullJsonError] = useState('');

  // Auto-sync JSON in real-time whenever form values change
  useEffect(() => {
    if (!open) return;

    const taskinputParameters: any = {};

    if (pauseDuration.trim()) {
      taskinputParameters.pauseDuration = pauseDuration.trim();
    }

    if (pauseDurationUnits.trim()) {
      taskinputParameters.pauseDurationUnits = pauseDurationUnits.trim();
    }

    const config = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'SIGNAL_OR_SCHEDULED_WAIT' as const,
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters: Object.keys(taskinputParameters).length > 0 ? taskinputParameters : undefined,
    };

    setFullJsonInput(JSON.stringify(config, null, 2));
    validateFullJson(JSON.stringify(config, null, 2));
  }, [
    open,
    taskRefId,
    taskId,
    taskListDomain,
    sequenceNo,
    pauseDuration,
    pauseDurationUnits
  ]);

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setTaskRefId(initialConfig.taskRefId);
        setTaskId(initialConfig.taskId);
        setTaskListDomain(initialConfig.taskListDomain || '');
        setPauseDuration(initialConfig.taskinputParameters?.pauseDuration || '');
        setPauseDurationUnits(initialConfig.taskinputParameters?.pauseDurationUnits || '');
      } else {
        const timestamp = Date.now();
        setTaskRefId(`advancedremorsehold-${timestamp}`);
        setTaskId('advanced-remorse-hold-1');
        setTaskListDomain('BOPUS-TASKLIST');
        setPauseDuration('${workflow.input.pauseDuration}');
        setPauseDurationUnits('${workflow.input.pauseDurationUnits}');
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
    console.log('=== SignalOrScheduledWaitTaskConfigModal handleSave ===');
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

    const taskinputParameters: any = {};

    if (pauseDuration.trim()) {
      taskinputParameters.pauseDuration = pauseDuration.trim();
    }

    if (pauseDurationUnits.trim()) {
      taskinputParameters.pauseDurationUnits = pauseDurationUnits.trim();
    }

    const config: SignalOrScheduledWaitTaskConfiguration = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'SIGNAL_OR_SCHEDULED_WAIT',
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters: Object.keys(taskinputParameters).length > 0 ? taskinputParameters : undefined,
    };

    console.log('Saving Signal or Scheduled Wait task config from form:', config);
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

  const SIGNAL_OR_SCHEDULED_WAIT_EXAMPLE = `{
  "taskRefId": "advancedremorsehold",
  "taskId": "advanced-remorse-hold-1",
  "taskListDomain": "BOPUS-TASKLIST",
  "sequenceNo": 1,
  "taskType": "SIGNAL_OR_SCHEDULED_WAIT",
  "taskinputParameters": {
    "pauseDuration": "\${workflow.input.pauseDuration}",
    "pauseDurationUnits": "\${workflow.input.pauseDurationUnits}"
  }
}`;

  const handleLoadExample = () => {
    setFullJsonInput(SIGNAL_OR_SCHEDULED_WAIT_EXAMPLE);
    validateFullJson(SIGNAL_OR_SCHEDULED_WAIT_EXAMPLE);
    toast({
      title: 'Example Loaded',
      description: 'Signal or Scheduled Wait task example has been loaded.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-card text-card-foreground border-border" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-foreground flex items-center gap-2">
            <div className="flex items-center gap-1">
              <BellIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <ClockIcon className="h-5 w-5 text-tertiary" strokeWidth={1.5} />
            </div>
            Configure Signal or Scheduled Wait Task
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                SIGNAL_OR_SCHEDULED_WAIT
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
              value="wait"
              className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Wait Configuration
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
              <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-tertiary/10 border border-primary/20">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">Signal or Scheduled Wait Task</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This task waits for either a signal to be received OR a scheduled timeout to occur - whichever happens first. 
                      It combines the functionality of both SIGNAL_WAIT and SCHEDULED_WAIT tasks.
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
                  placeholder="e.g., advancedremorsehold"
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
                  placeholder="e.g., advanced-remorse-hold-1"
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
                  value="SIGNAL_OR_SCHEDULED_WAIT"
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

            <TabsContent value="wait" className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">Dual Wait Mechanism</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Configure the scheduled timeout duration. The task will complete when either:
                    </p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>A signal is received (via external trigger)</li>
                      <li>The scheduled timeout expires (configured below)</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      Whichever condition is met first will cause the task to complete and the workflow to proceed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pauseDuration" className="text-foreground">
                  Pause Duration
                </Label>
                <Input
                  id="pauseDuration"
                  value={pauseDuration}
                  onChange={(e) => setPauseDuration(e.target.value)}
                  placeholder="${workflow.input.pauseDuration} or static value like 5"
                  className="bg-background text-foreground border-border font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum duration to wait before timeout. Use <code className="bg-background px-1 rounded">{'${workflow.input.pauseDuration}'}</code> for dynamic values or specify a number.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pauseDurationUnits" className="text-foreground">
                  Pause Duration Units
                </Label>
                <div className="space-y-2">
                  <Input
                    id="pauseDurationUnits"
                    value={pauseDurationUnits}
                    onChange={(e) => setPauseDurationUnits(e.target.value)}
                    placeholder="${workflow.input.pauseDurationUnits} or SECONDS, MINUTES, HOURS, DAYS"
                    className="bg-background text-foreground border-border font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Time unit for the duration. Use <code className="bg-background px-1 rounded">{'${workflow.input.pauseDurationUnits}'}</code> for dynamic values.
                  </p>
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <BellIcon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    <p className="text-xs font-medium text-foreground">Signal Trigger</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Task completes immediately when a signal is received from an external source or another workflow task.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-tertiary/10 border border-tertiary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="h-4 w-4 text-tertiary" strokeWidth={1.5} />
                    <p className="text-xs font-medium text-foreground">Scheduled Timeout</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Task completes automatically after the configured duration expires if no signal is received.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs font-medium text-foreground mb-2">Supported Time Units:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li><code className="bg-background px-1 rounded">SECONDS</code> - Wait for specified seconds</li>
                  <li><code className="bg-background px-1 rounded">MINUTES</code> - Wait for specified minutes</li>
                  <li><code className="bg-background px-1 rounded">HOURS</code> - Wait for specified hours</li>
                  <li><code className="bg-background px-1 rounded">DAYS</code> - Wait for specified days</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-xs font-medium text-foreground mb-2">Use Cases:</p>
                <ul className="text-xs text-muted-foreground space-y-2">
                  <li>
                    <strong className="text-foreground">Order Cancellation Window:</strong> Wait for customer cancellation signal or proceed after grace period
                  </li>
                  <li>
                    <strong className="text-foreground">Approval Workflows:</strong> Wait for manual approval or auto-approve after timeout
                  </li>
                  <li>
                    <strong className="text-foreground">Payment Processing:</strong> Wait for payment confirmation or timeout and retry
                  </li>
                  <li>
                    <strong className="text-foreground">Inventory Hold:</strong> Hold inventory until signal received or reservation expires
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs font-medium text-foreground mb-2">Example Configurations:</p>
                <div className="space-y-2 text-xs text-muted-foreground font-mono">
                  <div className="bg-background p-2 rounded">
                    <p className="text-foreground mb-1">Dynamic from workflow input:</p>
                    <p>pauseDuration: <span className="text-primary">{'${workflow.input.pauseDuration}'}</span></p>
                    <p>pauseDurationUnits: <span className="text-primary">{'${workflow.input.pauseDurationUnits}'}</span></p>
                  </div>
                  <div className="bg-background p-2 rounded">
                    <p className="text-foreground mb-1">30 minute cancellation window:</p>
                    <p>pauseDuration: <span className="text-primary">30</span></p>
                    <p>pauseDurationUnits: <span className="text-primary">MINUTES</span></p>
                  </div>
                  <div className="bg-background p-2 rounded">
                    <p className="text-foreground mb-1">24 hour approval timeout:</p>
                    <p>pauseDuration: <span className="text-primary">24</span></p>
                    <p>pauseDurationUnits: <span className="text-primary">HOURS</span></p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="json" className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">JSON Editor Mode</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      View or edit the complete Signal or Scheduled Wait task configuration in JSON format. Changes are synced in real-time.
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
                  placeholder="Enter complete Signal or Scheduled Wait task JSON configuration..."
                />
              </div>

              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs font-medium text-foreground mb-2">Signal or Scheduled Wait Task Example:</p>
                <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{SIGNAL_OR_SCHEDULED_WAIT_EXAMPLE}
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs font-medium text-foreground mb-2">Key Features:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Combines signal waiting and scheduled timeout in a single task</li>
                  <li>Completes on whichever condition is met first (signal OR timeout)</li>
                  <li>Useful for implementing grace periods with manual override capability</li>
                  <li>Supports dynamic duration values from workflow input</li>
                  <li>Can be used for approval workflows with automatic fallback</li>
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
  );
}
