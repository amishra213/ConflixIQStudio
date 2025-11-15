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
import { AlertCircleIcon, InfoIcon, CopyIcon, CodeIcon, CheckCircle2Icon, ArrowRightIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PassThroughTaskConfiguration {
  taskRefId: string;
  taskId: string;
  taskType: 'PASS_THROUGH';
  taskListDomain?: string;
  sequenceNo: number;
  taskinputParameters?: Record<string, any>;
  caseValues?: null;
  forkTasks?: null;
  convergeTasks?: null;
  actions?: null;
  output?: Record<string, any>;
  loopCondition?: null;
  loopOver?: null;
  loopIterationDelay?: null;
}

interface PassThroughTaskConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: PassThroughTaskConfiguration) => void;
  taskName: string;
  initialConfig?: PassThroughTaskConfiguration;
  sequenceNo: number;
}

export default function PassThroughTaskConfigModal({
  open,
  onClose,
  onSave,
  taskName,
  initialConfig,
  sequenceNo,
}: PassThroughTaskConfigModalProps) {
  console.log('=== PassThroughTaskConfigModal RENDER ===');
  console.log('Open:', open);
  console.log('Task Name:', taskName);
  console.log('Sequence No:', sequenceNo);
  console.log('PassThroughTaskConfigModal: Initial Config:', initialConfig);
  
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
      taskType: 'PASS_THROUGH' as const,
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters: {},
      caseValues: null,
      forkTasks: null,
      convergeTasks: null,
      actions: null,
      output: {},
      loopCondition: null,
      loopOver: null,
      loopIterationDelay: null,
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
        const defaultTaskId = taskName.toLowerCase().replace(/\s+/g, '-');
        const timestamp = Date.now();
        setTaskRefId(`fulfilled_lines_pass_through-${timestamp}`);
        setTaskId('decisioning_pass_through');
        setTaskListDomain('FULFILLMENT_UPDATES_TASKLIST');
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
    console.log('PassThroughTaskConfigModal: handleSave triggered. Active tab:', activeTab);
    
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

    const config: PassThroughTaskConfiguration = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'PASS_THROUGH',
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters: {},
      caseValues: null,
      forkTasks: null,
      convergeTasks: null,
      actions: null,
      output: {},
      loopCondition: null,
      loopOver: null,
      loopIterationDelay: null,
    };

    console.log('Saving PASS_THROUGH task config from form:', config);
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

  const PASS_THROUGH_EXAMPLE = `{
  "taskRefId": "fulfilled_lines_pass_through",
  "taskId": "decisioning_pass_through",
  "taskListDomain": "FULFILLMENT_UPDATES_TASKLIST",
  "taskType": "PASS_THROUGH",
  "sequenceNo": 1,
  "taskinputParameters": {},
  "caseValues": null,
  "forkTasks": null,
  "convergeTasks": null,
  "actions": null,
  "output": {},
  "loopCondition": null,
  "loopOver": null,
  "loopIterationDelay": null
}`;

  const handleLoadExample = () => {
    setFullJsonInput(PASS_THROUGH_EXAMPLE);
    validateFullJson(PASS_THROUGH_EXAMPLE);
    toast({
      title: 'Example Loaded',
      description: 'PASS_THROUGH task example has been loaded.',
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
            <ArrowRightIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
            Configure Pass Through Task
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure the Pass Through task settings below.
          </DialogDescription>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              PASS_THROUGH
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
              value="info"
              className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Information
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
                    <p className="text-xs font-medium text-foreground">Pass Through Task Configuration</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pass Through tasks are no-op tasks that pass input directly to output without any transformation. 
                      They are useful for workflow structure and data flow control.
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
                  placeholder="e.g., fulfilled_lines_pass_through"
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
                  placeholder="e.g., decisioning_pass_through"
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
                  placeholder="e.g., FULFILLMENT_UPDATES_TASKLIST"
                  className="bg-background text-foreground border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Domain for task list organization and routing
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Task Type</Label>
                <Input
                  value="PASS_THROUGH"
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

              <Separator className="bg-border" />

              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs font-medium text-foreground mb-2">Task Behavior:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>No input parameters required</li>
                  <li>Input data is passed directly to output without modification</li>
                  <li>Useful for workflow structure and branching points</li>
                  <li>Zero processing overhead</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">What is a Pass Through Task?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      A Pass Through task is a no-operation (no-op) task that simply passes its input to its output without any processing or transformation. 
                      It's one of the simplest task types in Netflix Conductor.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-background border border-border">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <ArrowRightIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-2">Direct Data Flow</p>
                      <p className="text-xs text-muted-foreground">
                        All input data received by the task is immediately available in the output without any changes. 
                        This makes it perfect for data routing and workflow structure.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background border border-border">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary/10 flex-shrink-0">
                      <span className="text-lg">🔄</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-2">Workflow Structure</p>
                      <p className="text-xs text-muted-foreground">
                        Use Pass Through tasks to create logical separation points in your workflow, 
                        making it easier to understand and maintain complex workflow structures.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background border border-border">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 flex-shrink-0">
                      <span className="text-lg">⚡</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-2">Zero Overhead</p>
                      <p className="text-xs text-muted-foreground">
                        Since no processing occurs, Pass Through tasks have minimal performance impact. 
                        They execute instantly and don't consume worker resources.
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
                    <span><strong className="text-foreground">Data Routing:</strong> Route data between different workflow branches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">•</span>
                    <span><strong className="text-foreground">Workflow Markers:</strong> Create logical checkpoints in complex workflows</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">•</span>
                    <span><strong className="text-foreground">Placeholder Tasks:</strong> Reserve spots for future task implementations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">•</span>
                    <span><strong className="text-foreground">Data Aggregation Points:</strong> Collect data from multiple sources before processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">•</span>
                    <span><strong className="text-foreground">Workflow Testing:</strong> Simplify workflows during development and testing</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-xs font-medium text-foreground mb-2">Key Characteristics:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>No input parameters required (taskinputParameters is empty)</li>
                  <li>Output equals input - no transformation</li>
                  <li>Executes instantly with no delay</li>
                  <li>Does not require worker polling</li>
                  <li>All null fields (caseValues, forkTasks, etc.) are standard</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs font-medium text-foreground mb-2">Example Workflow Pattern:</p>
                <div className="space-y-2 text-xs font-mono">
                  <div className="bg-background p-3 rounded border border-border">
                    <p className="text-foreground mb-2">Workflow with Pass Through:</p>
                    <p className="text-muted-foreground">1. HTTP Task - Fetch data</p>
                    <p className="text-primary">2. PASS_THROUGH - Route data</p>
                    <p className="text-muted-foreground">3. Decision Task - Branch based on data</p>
                    <p className="text-muted-foreground">4. Process Task - Handle result</p>
                  </div>
                  <div className="bg-background p-3 rounded border border-border">
                    <p className="text-foreground mb-2">Data Flow:</p>
                    <p className="text-muted-foreground">Input: {`{ "orderId": "123", "status": "pending" }`}</p>
                    <p className="text-primary">↓ Pass Through (no change)</p>
                    <p className="text-muted-foreground">Output: {`{ "orderId": "123", "status": "pending" }`}</p>
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
                      View or edit the complete Pass Through task configuration in JSON format. Changes are synced in real-time.
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
                  placeholder="Enter complete Pass Through task JSON configuration..."
                />
              </div>

              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs font-medium text-foreground mb-2">Pass Through Task Example:</p>
                <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{PASS_THROUGH_EXAMPLE}
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs font-medium text-foreground mb-2">JSON Structure Notes:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li><code className="bg-background px-1 rounded">taskinputParameters</code> is always an empty object {`{}`}</li>
                  <li><code className="bg-background px-1 rounded">output</code> is always an empty object {`{}`}</li>
                  <li>All conditional/loop fields are <code className="bg-background px-1 rounded">null</code></li>
                  <li>No worker configuration needed</li>
                  <li>Minimal JSON structure for maximum efficiency</li>
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
