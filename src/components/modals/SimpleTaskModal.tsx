import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { JsonTextarea } from '@/components/ui/json-textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PlusIcon, Trash2Icon } from 'lucide-react';

export interface WorkflowTaskConfig {
  name: string;
  taskReferenceName: string;
  type: 'SIMPLE';
  inputParameters: Record<string, unknown>;
  rateLimitPerFrequency: number;
  rateLimitFrequencyInSeconds: number;
  optional: boolean;
  startDelay: number;
  asyncComplete: boolean;
  [key: string]: unknown;
}

export interface SimpleTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: WorkflowTaskConfig) => Promise<void>;
  readonly initialConfig?: WorkflowTaskConfig; // For editing existing config
}

interface InputParam {
  id: string;
  key: string;
  value: string;
}

export function SimpleTaskModal({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: SimpleTaskModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskRefName, setTaskRefName] = useState('');
  const [optional, setOptional] = useState(false);
  const [startDelay, setStartDelay] = useState(0);
  const [asyncComplete, setAsyncComplete] = useState(false);
  const [rateLimitPerFrequency, setRateLimitPerFrequency] = useState(0);
  const [rateLimitFrequencyInSeconds, setRateLimitFrequencyInSeconds] = useState(1);
  const [inputParams, setInputParams] = useState<InputParam[]>([]);
  const [jsonEditable, setJsonEditable] = useState('');
  const [jsonValidationError, setJsonValidationError] = useState('');

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        // Editing mode: populate form with existing config
        setTaskName(initialConfig.name || '');
        setTaskRefName(initialConfig.taskReferenceName || '');
        setOptional(initialConfig.optional ?? false);
        setStartDelay(initialConfig.startDelay ?? 0);
        setAsyncComplete(initialConfig.asyncComplete ?? false);
        setRateLimitPerFrequency(initialConfig.rateLimitPerFrequency ?? 0);
        setRateLimitFrequencyInSeconds(initialConfig.rateLimitFrequencyInSeconds ?? 1);

        // Parse input parameters into the InputParam format
        const params: InputParam[] = Object.entries(initialConfig.inputParameters || {}).map(
          ([key, value]) => ({
            id: `${Date.now()}_${key}`,
            key,
            value: typeof value === 'string' ? value : JSON.stringify(value),
          })
        );
        setInputParams(params);
      } else {
        // New task mode: reset form with defaults
        const timestamp = Date.now();
        setTaskName(`task_${timestamp}`);
        setTaskRefName(`task_ref_${timestamp}`);
        setOptional(false);
        setStartDelay(0);
        setAsyncComplete(false);
        setRateLimitPerFrequency(0);
        setRateLimitFrequencyInSeconds(1);
        setInputParams([]);
      }
      setJsonValidationError('');
      setJsonEditable('');
    }
  }, [open, initialConfig]);

  const handleAddInputParam = () => {
    setInputParams([...inputParams, { id: `${Date.now()}`, key: '', value: '' }]);
  };

  const handleRemoveInputParam = (id: string) => {
    setInputParams(inputParams.filter((p) => p.id !== id));
  };

  const handleInputParamChange = (id: string, field: 'key' | 'value', newValue: string) => {
    setInputParams(inputParams.map((p) => (p.id === id ? { ...p, [field]: newValue } : p)));
  };

  const buildInputParameters = () => {
    const inputParameters: Record<string, unknown> = {};
    for (const param of inputParams) {
      if (param.key.trim()) {
        try {
          inputParameters[param.key] = param.value.trim() ? JSON.parse(param.value) : param.value;
        } catch {
          inputParameters[param.key] = param.value;
        }
      }
    }
    return inputParameters;
  };

  const handleSave = async () => {
    if (!taskName || taskName.trim() === '') {
      toast({
        title: 'Validation Error',
        description: 'Task name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!taskRefName || taskRefName.trim() === '') {
      toast({
        title: 'Validation Error',
        description: 'Task reference name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const finalConfig: WorkflowTaskConfig = {
        name: taskName,
        taskReferenceName: taskRefName,
        type: 'SIMPLE',
        inputParameters: buildInputParameters(),
        rateLimitPerFrequency,
        rateLimitFrequencyInSeconds,
        optional,
        startDelay,
        asyncComplete,
      };

      setIsLoading(true);
      await onSave(finalConfig);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save task',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getJsonPreview = (): WorkflowTaskConfig => {
    return {
      name: taskName,
      taskReferenceName: taskRefName,
      type: 'SIMPLE',
      inputParameters: buildInputParameters(),
      rateLimitPerFrequency,
      rateLimitFrequencyInSeconds,
      optional,
      startDelay,
      asyncComplete,
    };
  };

  const handleJsonChange = (newJson: string) => {
    setJsonEditable(newJson);
    try {
      JSON.parse(newJson);
      setJsonValidationError('');
    } catch (error) {
      setJsonValidationError(error instanceof Error ? error.message : 'Invalid JSON');
    }
  };

  const handleCopyJson = async () => {
    try {
      const json = JSON.stringify(getJsonPreview(), null, 2);
      await navigator.clipboard.writeText(json);
      toast({
        title: 'Copied!',
        description: 'JSON configuration copied to clipboard.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy JSON to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-card border-border text-foreground flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-foreground">
            Create Simple Task
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Configure a simple task for your workflow. Specify inputs and rate limiting parameters.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs defaultValue="basic" className="space-y-4 py-4">
            <TabsList className="bg-background">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="inputs">Input Parameters</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="preview">JSON Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card className="p-6 bg-background border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Task Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Task Name *</Label>
                    <Input
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      placeholder="e.g., send_email"
                      className="mt-2 bg-card text-foreground border-border"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Unique name for this task definition
                    </p>
                  </div>
                  <div>
                    <Label className="text-foreground">Task Reference Name *</Label>
                    <Input
                      value={taskRefName}
                      onChange={(e) => setTaskRefName(e.target.value)}
                      placeholder="e.g., send_email_ref"
                      className="mt-2 bg-card text-foreground border-border"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Unique identifier for referencing this task within the workflow
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="inputs" className="space-y-4">
              <Card className="p-6 bg-background border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Input Parameters</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Define name-value pairs that will be passed as input to the task
                    </p>
                  </div>
                  <Button
                    onClick={handleAddInputParam}
                    className="bg-cyan-500 text-white hover:bg-cyan-600"
                    size="sm"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Parameter
                  </Button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {inputParams.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-4">No input parameters defined</p>
                  ) : (
                    inputParams.map((param) => (
                      <Card key={param.id} className="p-4 bg-card border-border">
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Parameter Name</Label>
                            <Input
                              value={param.key}
                              onChange={(e) =>
                                handleInputParamChange(param.id, 'key', e.target.value)
                              }
                              placeholder="e.g., recipientEmail"
                              className="mt-1 bg-background text-foreground border-border h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Parameter Value</Label>
                            <div className="flex gap-2">
                              <Textarea
                                value={param.value}
                                onChange={(e) =>
                                  handleInputParamChange(param.id, 'value', e.target.value)
                                }
                                placeholder='Value, JSON, or reference (e.g., "$workflow.input.email")'
                                className="flex-1 bg-background text-foreground border-border h-16 text-sm font-mono"
                              />
                              <Button
                                onClick={() => handleRemoveInputParam(param.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:bg-red-500/10 hover:text-red-400 h-8 w-8 p-0 mt-auto"
                              >
                                <Trash2Icon className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card className="p-6 bg-background border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Task Settings</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-foreground">Rate Limit Per Frequency</Label>
                      <Input
                        type="number"
                        value={rateLimitPerFrequency}
                        onChange={(e) => setRateLimitPerFrequency(Number(e.target.value) || 0)}
                        className="mt-2 bg-card text-foreground border-border"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum task executions per frequency window (0 = unlimited)
                      </p>
                    </div>
                    <div>
                      <Label className="text-foreground">Rate Limit Frequency (seconds)</Label>
                      <Input
                        type="number"
                        value={rateLimitFrequencyInSeconds}
                        onChange={(e) =>
                          setRateLimitFrequencyInSeconds(Number(e.target.value) || 1)
                        }
                        className="mt-2 bg-card text-foreground border-border"
                        min="1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Time window in seconds for rate limiting
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-foreground">Start Delay (seconds)</Label>
                      <Input
                        type="number"
                        value={startDelay}
                        onChange={(e) => setStartDelay(Number(e.target.value) || 0)}
                        className="mt-2 bg-card text-foreground border-border"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Delay before task execution begins
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="optional"
                        checked={optional}
                        onChange={(e) => setOptional(e.target.checked)}
                        className="w-4 h-4 rounded border-border cursor-pointer"
                      />
                      <Label htmlFor="optional" className="text-foreground cursor-pointer">
                        Optional (task failure does not fail the workflow)
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="async"
                        checked={asyncComplete}
                        onChange={(e) => setAsyncComplete(e.target.checked)}
                        className="w-4 h-4 rounded border-border cursor-pointer"
                      />
                      <Label htmlFor="async" className="text-foreground cursor-pointer">
                        Async Complete (task completes asynchronously)
                      </Label>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card
                className="p-6 bg-background border-border"
                style={{ '--line-height': '1.5rem' } as React.CSSProperties}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">JSON Preview</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      View the generated task configuration
                    </p>
                  </div>
                  <Button
                    onClick={handleCopyJson}
                    className="bg-cyan-500 text-white hover:bg-cyan-600 font-medium"
                    size="sm"
                  >
                    Copy JSON
                  </Button>
                </div>

                <div className="space-y-2">
                  <JsonTextarea
                    value={jsonEditable || JSON.stringify(getJsonPreview(), null, 2)}
                    onChange={(value) => handleJsonChange(value)}
                    className="font-mono text-xs bg-card text-foreground min-h-[400px]"
                    placeholder="JSON will appear here..."
                    readOnly
                  />
                  {jsonValidationError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400">
                        <span className="font-semibold">JSON Error:</span> {jsonValidationError}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-cyan-500 text-white hover:bg-cyan-600 font-medium disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
