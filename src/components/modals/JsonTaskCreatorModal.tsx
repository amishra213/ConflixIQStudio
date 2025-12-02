import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircleIcon, CheckCircle2Icon, InfoIcon, CopyIcon, DownloadIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JsonTaskCreatorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (taskJson: Record<string, unknown>) => void;
}

const TASK_TEMPLATE = {
  name: 'sample-task',
  description: 'Sample task definition',
  retryCount: 3,
  timeoutSeconds: 3600,
  responseTimeoutSeconds: 600,
  inputKeys: ['input1', 'input2'],
  outputKeys: ['output1', 'output2'],
  ownerEmail: 'owner@example.com',
};

const GENERIC_TASK_EXAMPLE = `{
  "taskRefId": "sample-generic-task-1-taskref",
  "taskId": "sample-generic-task",
  "taskType": "GENERIC",
  "taskListDomain": "DEFAULT-TASKLIST",
  "sequenceNo": 1,
  "taskinputParameters": {
    "order": {
      "orderType": "\${workflow.input.orderType}",
      "hasReservation": "Y",
      "shipNode": "\${workflow.input.shipNode}",
      "orderNo": "Order-1"
    }
  }
}`;

const HTTP_TASK_EXAMPLE = `{
  "taskRefId": "http-task-1-taskref",
  "taskId": "http-task",
  "taskType": "HTTP",
  "taskListDomain": "DEFAULT-TASKLIST",
  "sequenceNo": 1,
  "taskinputParameters": {
    "http_request": {
      "uri": "https://api.example.com/data",
      "method": "GET",
      "headers": {
        "Content-Type": "application/json"
      }
    }
  }
}`;

const DECISION_TASK_EXAMPLE = `{
  "taskRefId": "decision-task-1-taskref",
  "taskId": "decision-task",
  "taskType": "DECISION",
  "taskListDomain": "DEFAULT-TASKLIST",
  "sequenceNo": 1,
  "taskinputParameters": {
    "case_value_param": "\${workflow.input.status}"
  },
  "decisionCases": {
    "approved": [
      {
        "taskRefId": "approval-task-ref",
        "taskId": "approval-task",
        "taskType": "GENERIC"
      }
    ],
    "rejected": [
      {
        "taskRefId": "rejection-task-ref",
        "taskId": "rejection-task",
        "taskType": "GENERIC"
      }
    ]
  }
}`;

export default function JsonTaskCreatorModal({
  open,
  onClose,
  onSave,
}: Readonly<JsonTaskCreatorModalProps>) {
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [activeTab, setActiveTab] = useState('editor');

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

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    validateJson(value);
  };

  const handleSave = () => {
    if (!validateJson(jsonInput)) {
      toast({
        title: 'Invalid JSON',
        description: 'Please fix JSON errors before saving.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const taskJson = JSON.parse(jsonInput);
      onSave(taskJson);
    } catch (error) {
      console.error('Failed to parse task JSON:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to parse task JSON.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyExample = (example: string) => {
    setJsonInput(example);
    validateJson(example);
    setActiveTab('editor');
    toast({
      title: 'Example Copied',
      description: 'Example has been loaded into the editor.',
    });
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([JSON.stringify(TASK_TEMPLATE, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'task-template.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: 'Task template has been downloaded.',
    });
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-foreground">
            Create Task from JSON
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Define your task using JSON format. You can use the examples below as a starting point.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger
              value="editor"
              className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              JSON Editor
            </TabsTrigger>
            <TabsTrigger
              value="examples"
              className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Examples
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {jsonError ? (
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
                onClick={handleDownloadTemplate}
                className="bg-transparent text-foreground border-border hover:bg-accent"
              >
                <DownloadIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Download Template
              </Button>
            </div>

            {jsonError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-start gap-2">
                  <AlertCircleIcon
                    className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5"
                    strokeWidth={1.5}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-destructive">JSON Syntax Error</p>
                    <p className="text-xs text-destructive/80 mt-1">{jsonError}</p>
                  </div>
                </div>
              </div>
            )}

            <ScrollArea className="h-[400px] rounded-lg border border-border">
              <Textarea
                value={jsonInput}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="min-h-[400px] font-mono text-xs bg-background text-foreground border-0 focus-visible:ring-0 resize-none"
                placeholder="Enter task JSON definition..."
              />
            </ScrollArea>

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-start gap-2">
                <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground mb-2">JSON Editor Tips:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>
                      Use{' '}
                      <code className="bg-background px-1 rounded">
                        {'${workflow.input.fieldName}'}
                      </code>{' '}
                      for dynamic workflow input values
                    </li>
                    <li>
                      Use{' '}
                      <code className="bg-background px-1 rounded">
                        {'${taskRefName.output.fieldName}'}
                      </code>{' '}
                      to reference previous task outputs
                    </li>
                    <li>
                      Ensure all required fields are included: taskRefId, taskId, taskType,
                      sequenceNo
                    </li>
                    <li>Check the Examples tab for common task type configurations</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4 mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        GENERIC
                      </Badge>
                      <h3 className="text-sm font-medium text-foreground">Generic Task</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyExample(GENERIC_TASK_EXAMPLE)}
                      className="bg-transparent text-foreground border-border hover:bg-accent"
                    >
                      <CopyIcon className="h-3 w-3 mr-2" strokeWidth={1.5} />
                      Use This
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A generic task for custom worker implementations with input parameters
                  </p>
                  <div className="rounded-lg bg-background border border-border p-4">
                    <pre className="text-xs text-foreground font-mono overflow-x-auto">
                      {GENERIC_TASK_EXAMPLE}
                    </pre>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-tertiary/10 text-tertiary border-tertiary/20"
                      >
                        HTTP
                      </Badge>
                      <h3 className="text-sm font-medium text-foreground">HTTP Task</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyExample(HTTP_TASK_EXAMPLE)}
                      className="bg-transparent text-foreground border-border hover:bg-accent"
                    >
                      <CopyIcon className="h-3 w-3 mr-2" strokeWidth={1.5} />
                      Use This
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Make HTTP API calls with configurable method, headers, and body
                  </p>
                  <div className="rounded-lg bg-background border border-border p-4">
                    <pre className="text-xs text-foreground font-mono overflow-x-auto">
                      {HTTP_TASK_EXAMPLE}
                    </pre>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-warning/10 text-warning border-warning/20"
                      >
                        DECISION
                      </Badge>
                      <h3 className="text-sm font-medium text-foreground">Decision Task</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyExample(DECISION_TASK_EXAMPLE)}
                      className="bg-transparent text-foreground border-border hover:bg-accent"
                    >
                      <CopyIcon className="h-3 w-3 mr-2" strokeWidth={1.5} />
                      Use This
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Conditional branching based on input parameters with multiple decision cases
                  </p>
                  <div className="rounded-lg bg-background border border-border p-4">
                    <pre className="text-xs text-foreground font-mono overflow-x-auto">
                      {DECISION_TASK_EXAMPLE}
                    </pre>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
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
            disabled={!!jsonError || !jsonInput.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
