import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertCircleIcon, InfoIcon, CheckCircle2Icon, CodeIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FallbackJsonTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
  taskType: string;
  taskName: string;
  initialConfig?: any;
  sequenceNo: number;
}

export default function FallbackJsonTaskModal({
  open,
  onClose,
  onSave,
  taskType,
  taskName,
  initialConfig,
  sequenceNo,
}: FallbackJsonTaskModalProps) {
  console.log('=== FallbackJsonTaskModal RENDER ===');
  console.log('Open:', open);
  console.log('Task Type:', taskType);
  console.log('Task Name:', taskName);
  console.log('Sequence No:', sequenceNo);
  console.log('Initial Config:', initialConfig);
  
  const { toast } = useToast();
  
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

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

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setJsonInput(JSON.stringify(initialConfig, null, 2));
        validateJson(JSON.stringify(initialConfig, null, 2));
      } else {
        const defaultTaskId = taskName.toLowerCase().replace(/\s+/g, '-');
        const timestamp = Date.now();
        
        const defaultConfig = {
          taskRefId: `${defaultTaskId}-${sequenceNo}-taskref-${timestamp}`,
          taskId: `${defaultTaskId}-task`,
          taskType: taskType,
          taskListDomain: 'DEFAULT-TASKLIST',
          sequenceNo,
          taskinputParameters: {},
        };
        
        setJsonInput(JSON.stringify(defaultConfig, null, 2));
        validateJson(JSON.stringify(defaultConfig, null, 2));
      }
    }
  }, [initialConfig, taskName, taskType, sequenceNo, open]);

  // Do not render if a specialized modal should handle this task type
  if (['GENERIC', 'HTTP', 'LAMBDA', 'DECISION', 'MAPPER', 'SCHEDULED_WAIT', 'SIGNAL_OR_SCHEDULED_WAIT', 'SIGNAL', 'SIGNAL_WAIT', 'TERMINATE', 'PASS_THROUGH', 'DO_WHILE', 'FORK_AND_CONVERGE'].includes(taskType)) {
    console.log(`FallbackJsonTaskModal: Skipping render for taskType: ${taskType} - specialized modal should handle this`);
    return null;
  }

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
      const taskConfig = JSON.parse(jsonInput);
      
      // Validate required fields
      if (!taskConfig.taskRefId || !taskConfig.taskId || !taskConfig.taskType) {
        toast({
          title: 'Validation Error',
          description: 'taskRefId, taskId, and taskType are required fields.',
          variant: 'destructive',
        });
        return;
      }

      onSave(taskConfig);
      onClose();
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to parse task JSON.',
        variant: 'destructive',
      });
    }
  };

  const handleLoadTemplate = () => {
    const defaultTaskId = taskName.toLowerCase().replace(/\s+/g, '-');
    const timestamp = Date.now();
    
    const template = {
      taskRefId: `${defaultTaskId}-${sequenceNo}-taskref-${timestamp}`,
      taskId: `${defaultTaskId}-task`,
      taskType: taskType,
      taskListDomain: 'DEFAULT-TASKLIST',
      sequenceNo,
      taskinputParameters: {},
    };
    
    setJsonInput(JSON.stringify(template, null, 2));
    validateJson(JSON.stringify(template, null, 2));
    
    toast({
      title: 'Template Loaded',
      description: 'Basic task template has been loaded.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card text-card-foreground border-border" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-foreground flex items-center gap-2">
            <CodeIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
            Configure {taskName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure the task using JSON format below.
          </DialogDescription>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              {taskType}
            </Badge>
            <span className="text-xs text-muted-foreground">Sequence: {sequenceNo}</span>
            <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
              JSON Editor
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-240px)] pr-4">
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-start gap-2">
                <InfoIcon className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">JSON Configuration Mode</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No specialized form is available for this task type. Please configure the task using JSON format below.
                  </p>
                </div>
              </div>
            </div>

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
                onClick={handleLoadTemplate}
                className="bg-transparent text-foreground border-border hover:bg-accent"
              >
                Load Template
              </Button>
            </div>

            {jsonError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-start gap-2">
                  <AlertCircleIcon className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-destructive">JSON Syntax Error</p>
                    <p className="text-xs text-destructive/80 mt-1">{jsonError}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border overflow-hidden">
              <Textarea
                value={jsonInput}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="h-[400px] w-full font-mono text-xs bg-background text-foreground border-0 focus-visible:ring-0 resize-none overflow-auto"
                placeholder="Enter task JSON configuration..."
              />
            </div>

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs font-medium text-foreground mb-2">Required Fields:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li><code className="bg-background px-1 rounded">taskRefId</code> - Unique reference identifier for this task instance</li>
                <li><code className="bg-background px-1 rounded">taskId</code> - Task definition identifier</li>
                <li><code className="bg-background px-1 rounded">taskType</code> - Type of the task (e.g., {taskType})</li>
                <li><code className="bg-background px-1 rounded">sequenceNo</code> - Order of task in workflow</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <p className="text-xs font-medium text-foreground mb-2">JSON Tips:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Use <code className="bg-background px-1 rounded">{'${workflow.input.fieldName}'}</code> for dynamic workflow input values</li>
                <li>Use <code className="bg-background px-1 rounded">{'${taskRefName.output.fieldName}'}</code> to reference previous task outputs</li>
                <li>Add <code className="bg-background px-1 rounded">taskinputParameters</code> object for task-specific configuration</li>
                <li>Click "Load Template" to start with a basic structure</li>
              </ul>
            </div>
          </div>
        </ScrollArea>

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
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
