import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircleIcon, InfoIcon, CopyIcon, CodeIcon, CheckCircle2Icon, BellIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SignalWaitTaskConfiguration {
  taskRefId: string;
  taskId: string;
  taskType: 'SIGNAL_WAIT';
  taskListDomain?: string;
  sequenceNo: number;
  output?: Record<string, any>;
}

interface SignalWaitTaskConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: SignalWaitTaskConfiguration) => void;
  taskName: string;
  initialConfig?: SignalWaitTaskConfiguration;
  sequenceNo: number;
}

export default function SignalWaitTaskConfigModal({
  open,
  onClose,
  onSave,
  taskName,
  initialConfig,
  sequenceNo,
}: SignalWaitTaskConfigModalProps) {
  console.log('=== SignalWaitTaskConfigModal RENDER ===');
  console.log('Open:', open);
  console.log('Task Name:', taskName);
  console.log('Sequence No:', sequenceNo);
  console.log('Initial Config:', initialConfig);
  
  const { toast } = useToast();
  
  const [taskRefId, setTaskRefId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [taskListDomain, setTaskListDomain] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [fullJsonInput, setFullJsonInput] = useState('');
  const [fullJsonError, setFullJsonError] = useState('');

  // Auto-sync JSON in real-time whenever form values change
  useEffect(() => {
    if (!open) return;

    const config = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'SIGNAL_WAIT' as const,
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      output: {},
    };

    setFullJsonInput(JSON.stringify(config, null, 2));
    validateFullJson(JSON.stringify(config, null, 2));
  }, [
    open,
    taskRefId,
    taskId,
    taskListDomain,
    sequenceNo
  ]);

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setTaskRefId(initialConfig.taskRefId);
        setTaskId(initialConfig.taskId);
        setTaskListDomain(initialConfig.taskListDomain || '');
      } else {
        const timestamp = Date.now();
        setTaskRefId(`wait-for-schedule-status-signal-taskref-${timestamp}`);
        setTaskId('wait-for-schedule-status-signal');
        setTaskListDomain('BOPUS-TASKLIST');
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
    console.log('=== SignalWaitTaskConfigModal handleSave ===');
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

    const config: SignalWaitTaskConfiguration = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'SIGNAL_WAIT',
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      output: {},
    };

    console.log('Saving Signal Wait task config from form:', config);
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

  const SIGNAL_WAIT_EXAMPLE = `{
  "taskRefId": "wait-for-schedule-status-signal-taskref",
  "taskId": "wait-for-schedule-status-signal",
  "taskListDomain": "BOPUS-TASKLIST",
  "sequenceNo": 1,
  "taskType": "SIGNAL_WAIT",
  "output": {}
}`;

  const handleLoadExample = () => {
    setFullJsonInput(SIGNAL_WAIT_EXAMPLE);
    validateFullJson(SIGNAL_WAIT_EXAMPLE);
    toast({
      title: 'Example Loaded',
      description: 'Signal Wait task example has been loaded.',
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
            <BellIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
            Configure Signal Wait Task
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                SIGNAL_WAIT
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
              value="info"
              className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Signal Information
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
                    <p className="text-xs font-medium text-foreground">Signal Wait Task Configuration</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Signal Wait tasks pause workflow execution until a signal is received from an external source or another workflow. 
                      The workflow will remain in a waiting state until the signal arrives.
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
                  placeholder="e.g., wait-for-schedule-status-signal-taskref"
                  className="bg-background text-foreground border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Unique reference identifier for this task instance in the workflow. This ID will be used by SIGNAL tasks to target this wait task.
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
                  placeholder="e.g., wait-for-schedule-status-signal"
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
                  value="SIGNAL_WAIT"
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

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">How Signal Wait Works</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This task will pause the workflow execution and wait indefinitely until a signal is received. 
                      The signal must be sent by a SIGNAL task that references this task's taskRefId.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-background border border-border">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <BellIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-2">Signal Reception</p>
                      <p className="text-xs text-muted-foreground">
                        When a SIGNAL task sends a signal to this task's taskRefId, the workflow will resume execution. 
                        The signal can include output data that will be available to subsequent tasks.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background border border-border">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary/10 flex-shrink-0">
                      <span className="text-lg">🔗</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-2">Cross-Workflow Communication</p>
                      <p className="text-xs text-muted-foreground">
                        Signal Wait tasks enable communication between different workflow executions. 
                        One workflow can wait for a signal from another workflow, enabling complex orchestration patterns.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background border border-border">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 flex-shrink-0">
                      <span className="text-lg">⏱️</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-2">No Timeout</p>
                      <p className="text-xs text-muted-foreground">
                        Unlike SCHEDULED_WAIT, this task has no timeout. It will wait indefinitely until a signal is received. 
                        Consider using SIGNAL_OR_SCHEDULED_WAIT if you need a timeout fallback.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs font-medium text-foreground mb-2">Common Use Cases:</p>
                <ul className="text-xs text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">•</span>
                    <span><strong className="text-foreground">Manual Approval:</strong> Wait for human approval before proceeding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">•</span>
                    <span><strong className="text-foreground">External Event:</strong> Wait for external system notification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">•</span>
                    <span><strong className="text-foreground">Workflow Coordination:</strong> Synchronize multiple workflow executions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">•</span>
                    <span><strong className="text-foreground">Callback Pattern:</strong> Wait for callback from async operation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">•</span>
                    <span><strong className="text-foreground">Order Processing:</strong> Wait for payment confirmation or inventory availability</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-xs font-medium text-foreground mb-2">Important Notes:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>The taskRefId must be unique within the workflow</li>
                  <li>SIGNAL tasks must reference this exact taskRefId to unblock this task</li>
                  <li>The workflow will remain in RUNNING state while waiting</li>
                  <li>No automatic timeout - the signal must be sent to proceed</li>
                  <li>Consider workflow timeout settings to prevent indefinite waiting</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs font-medium text-foreground mb-2">Example Workflow Pattern:</p>
                <div className="space-y-2 text-xs font-mono">
                  <div className="bg-background p-3 rounded border border-border">
                    <p className="text-foreground mb-2">Workflow A (Waiting):</p>
                    <p className="text-muted-foreground">1. Start workflow</p>
                    <p className="text-muted-foreground">2. Process initial data</p>
                    <p className="text-primary">3. SIGNAL_WAIT (taskRefId: "wait-for-approval")</p>
                    <p className="text-muted-foreground">4. Continue after signal received</p>
                  </div>
                  <div className="bg-background p-3 rounded border border-border">
                    <p className="text-foreground mb-2">Workflow B (Signaling):</p>
                    <p className="text-muted-foreground">1. Start workflow</p>
                    <p className="text-muted-foreground">2. Perform approval check</p>
                    <p className="text-tertiary">3. SIGNAL (target: "wait-for-approval")</p>
                    <p className="text-muted-foreground">4. Complete</p>
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
                      View or edit the complete Signal Wait task configuration in JSON format. Changes are synced in real-time.
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
                  placeholder="Enter complete Signal Wait task JSON configuration..."
                />
              </div>

              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs font-medium text-foreground mb-2">Signal Wait Task Example:</p>
                <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{SIGNAL_WAIT_EXAMPLE}
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs font-medium text-foreground mb-2">Key Features:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Pauses workflow execution until signal is received</li>
                  <li>No timeout - waits indefinitely for signal</li>
                  <li>Enables cross-workflow communication</li>
                  <li>Can receive output data from the signal</li>
                  <li>Useful for manual approval and external event patterns</li>
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
