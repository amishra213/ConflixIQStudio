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
import { AlertCircleIcon, InfoIcon, CopyIcon, CodeIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TerminateTaskConfiguration {
  taskRefId: string;
  taskId: string;
  taskType: 'TERMINATE';
  taskListDomain?: string;
  sequenceNo: number;
  taskinputParameters?: {
    terminationStatus?: string;
    terminationReason?: string;
    workflowOutput?: Record<string, any>;
    [key: string]: any;
  };
}

interface TerminateTaskConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: TerminateTaskConfiguration) => void;
  taskName: string;
  initialConfig?: TerminateTaskConfiguration;
  sequenceNo: number;
}

export default function TerminateTaskConfigModal({
  open,
  onClose,
  onSave,
  taskName,
  initialConfig,
  sequenceNo,
}: TerminateTaskConfigModalProps) {
  console.log('=== TerminateTaskConfigModal RENDER ===');
  console.log('Open:', open);
  console.log('Task Name:', taskName);
  console.log('Sequence No:', sequenceNo);
  console.log('Initial Config:', initialConfig);
  
  const { toast } = useToast();
  
  const [taskRefId, setTaskRefId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [taskListDomain, setTaskListDomain] = useState('');
  const [terminationStatus, setTerminationStatus] = useState('COMPLETED');
  const [terminationReason, setTerminationReason] = useState('');
  const [workflowOutput, setWorkflowOutput] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [fullJsonInput, setFullJsonInput] = useState('');
  const [fullJsonError, setFullJsonError] = useState('');

  // Auto-sync JSON in real-time whenever form values change
  useEffect(() => {
    if (!open) return;

    const taskinputParameters: any = {};

    if (terminationStatus) {
      taskinputParameters.terminationStatus = terminationStatus;
    }

    if (terminationReason.trim()) {
      taskinputParameters.terminationReason = terminationReason.trim();
    }

    if (workflowOutput.trim()) {
      try {
        taskinputParameters.workflowOutput = JSON.parse(workflowOutput);
      } catch {
        taskinputParameters.workflowOutput = workflowOutput.trim();
      }
    }

    const config = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'TERMINATE' as const,
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
    terminationStatus,
    terminationReason,
    workflowOutput
  ]);

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setTaskRefId(initialConfig.taskRefId);
        setTaskId(initialConfig.taskId);
        setTaskListDomain(initialConfig.taskListDomain || '');
        setTerminationStatus(initialConfig.taskinputParameters?.terminationStatus || 'COMPLETED');
        setTerminationReason(initialConfig.taskinputParameters?.terminationReason || '');
        
        if (initialConfig.taskinputParameters?.workflowOutput) {
          const output = initialConfig.taskinputParameters.workflowOutput;
          setWorkflowOutput(typeof output === 'object' ? JSON.stringify(output, null, 2) : String(output));
        }
      } else {
        const defaultTaskId = taskName.toLowerCase().replace(/\s+/g, '-');
        const timestamp = Date.now();
        setTaskRefId(`${defaultTaskId}-${sequenceNo}-taskref-${timestamp}`);
        setTaskId(`${defaultTaskId}-task`);
        setTaskListDomain('DEFAULT-TASKLIST');
        setTerminationStatus('COMPLETED');
        setTerminationReason('Workflow terminated successfully');
        setWorkflowOutput(JSON.stringify({ status: 'terminated', reason: 'Workflow completed' }, null, 2));
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
    console.log('=== TerminateTaskConfigModal handleSave ===');
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

    if (terminationStatus) {
      taskinputParameters.terminationStatus = terminationStatus;
    }

    if (terminationReason.trim()) {
      taskinputParameters.terminationReason = terminationReason.trim();
    }

    if (workflowOutput.trim()) {
      try {
        taskinputParameters.workflowOutput = JSON.parse(workflowOutput);
      } catch {
        taskinputParameters.workflowOutput = workflowOutput.trim();
      }
    }

    const config: TerminateTaskConfiguration = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'TERMINATE',
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters: Object.keys(taskinputParameters).length > 0 ? taskinputParameters : undefined,
    };

    console.log('Saving Terminate task config from form:', config);
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

  const TERMINATE_EXAMPLE = `{
  "taskRefId": "terminate-workflow-taskref",
  "taskId": "terminate-workflow-task",
  "taskListDomain": "DEFAULT-TASKLIST",
  "sequenceNo": 1,
  "taskType": "TERMINATE",
  "taskinputParameters": {
    "terminationStatus": "COMPLETED",
    "terminationReason": "Workflow terminated successfully",
    "workflowOutput": {
      "status": "terminated",
      "reason": "Workflow completed",
      "finalResult": "\${previous-task.output.result}"
    }
  }
}`;

  const handleLoadExample = () => {
    setFullJsonInput(TERMINATE_EXAMPLE);
    validateFullJson(TERMINATE_EXAMPLE);
    toast({
      title: 'Example Loaded',
      description: 'Terminate task example has been loaded.',
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
            <XCircleIcon className="h-5 w-5 text-destructive" strokeWidth={1.5} />
            Configure Terminate Task
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                TERMINATE
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
              value="termination"
              className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Termination Settings
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
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">Terminate Task Configuration</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Terminate tasks immediately stop workflow execution. Use this to end workflows based on specific conditions or error states.
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
                  placeholder="e.g., terminate-workflow-taskref"
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
                  placeholder="e.g., terminate-workflow-task"
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
                  value="TERMINATE"
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

            <TabsContent value="termination" className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">Termination Configuration</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Configure how the workflow should be terminated, including the final status and any output data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terminationStatus" className="text-foreground">
                  Termination Status <span className="text-destructive">*</span>
                </Label>
                <select
                  id="terminationStatus"
                  value={terminationStatus}
                  onChange={(e) => setTerminationStatus(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="TERMINATED">TERMINATED</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Final status of the workflow after termination
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terminationReason" className="text-foreground">
                  Termination Reason
                </Label>
                <Input
                  id="terminationReason"
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  placeholder="e.g., Workflow terminated successfully"
                  className="bg-background text-foreground border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Human-readable reason for termination
                </p>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-2">
                <Label htmlFor="workflowOutput" className="text-foreground">
                  Workflow Output (JSON)
                </Label>
                <Textarea
                  id="workflowOutput"
                  value={workflowOutput}
                  onChange={(e) => setWorkflowOutput(e.target.value)}
                  placeholder={`{
  "status": "terminated",
  "reason": "Workflow completed",
  "finalResult": "\${previous-task.output.result}"
}`}
                  className="bg-background text-foreground border-border font-mono text-xs min-h-[150px] resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  Final output data for the workflow. Use JSONPath expressions like {'${taskRef.output.field}'} to reference task outputs.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs font-medium text-foreground mb-2">Termination Status Options:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li><code className="bg-background px-1 rounded">COMPLETED</code> - Workflow completed successfully</li>
                  <li><code className="bg-background px-1 rounded">FAILED</code> - Workflow failed with errors</li>
                  <li><code className="bg-background px-1 rounded">TERMINATED</code> - Workflow was explicitly terminated</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-xs font-medium text-foreground mb-2">Use Cases:</p>
                <ul className="text-xs text-muted-foreground space-y-2">
                  <li>
                    <strong className="text-foreground">Early Exit:</strong> Stop workflow when a condition is met
                  </li>
                  <li>
                    <strong className="text-foreground">Error Handling:</strong> Terminate on critical errors
                  </li>
                  <li>
                    <strong className="text-foreground">Conditional Completion:</strong> End workflow based on business logic
                  </li>
                  <li>
                    <strong className="text-foreground">Resource Cleanup:</strong> Stop workflow and release resources
                  </li>
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
                      View or edit the complete Terminate task configuration in JSON format. Changes are synced in real-time.
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
                  placeholder="Enter complete Terminate task JSON configuration..."
                />
              </div>

              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs font-medium text-foreground mb-2">Terminate Task Example:</p>
                <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{TERMINATE_EXAMPLE}
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
