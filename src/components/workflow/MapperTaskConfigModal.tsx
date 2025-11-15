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
import { PlusIcon, TrashIcon, AlertCircleIcon, InfoIcon, CopyIcon, CodeIcon, CheckCircle2Icon, FunctionSquareIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MapperTaskConfiguration {
  taskRefId: string;
  taskId: string;
  taskType: 'MAPPER';
  taskListDomain?: string;
  sequenceNo: number;
  taskinputParameters?: {
    MAPPER?: Record<string, any>;
    [key: string]: any;
  };
}

interface MapperTaskConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: MapperTaskConfiguration) => void;
  taskName: string;
  initialConfig?: MapperTaskConfiguration;
  sequenceNo: number;
}

export default function MapperTaskConfigModal({
  open,
  onClose,
  onSave,
  taskName,
  initialConfig,
  sequenceNo,
}: MapperTaskConfigModalProps) {
  console.log('=== MapperTaskConfigModal RENDER ===');
  console.log('Open:', open);
  console.log('Task Name:', taskName);
  console.log('Sequence No:', sequenceNo);
  console.log('Initial Config:', initialConfig);
  
  const { toast } = useToast();
  
  const [taskRefId, setTaskRefId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [taskListDomain, setTaskListDomain] = useState('');
  const [mapperInputs, setMapperInputs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');
  const [fullJsonInput, setFullJsonInput] = useState('');
  const [fullJsonError, setFullJsonError] = useState('');
  const [useJsonEditor, setUseJsonEditor] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Auto-sync JSON in real-time whenever form values change
  useEffect(() => {
    if (!open) return;

    const taskinputParameters: any = {};

    if (Object.keys(mapperInputs).length > 0) {
      taskinputParameters.MAPPER = {};
      
      // Parse each mapper input value to handle nested objects
      Object.entries(mapperInputs).forEach(([key, value]) => {
        try {
          // Try to parse as JSON for nested objects
          const parsed = JSON.parse(value);
          taskinputParameters.MAPPER[key] = parsed;
        } catch {
          // If not valid JSON, store as string
          taskinputParameters.MAPPER[key] = value;
        }
      });
    }

    const config = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'MAPPER' as const,
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
    mapperInputs
  ]);

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setTaskRefId(initialConfig.taskRefId);
        setTaskId(initialConfig.taskId);
        setTaskListDomain(initialConfig.taskListDomain || '');
        
        if (initialConfig.taskinputParameters?.MAPPER) {
          const mapperData = initialConfig.taskinputParameters.MAPPER;
          const inputs: Record<string, string> = {};
          
          Object.entries(mapperData).forEach(([key, value]) => {
            inputs[key] = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
          });
          
          setMapperInputs(inputs);
          setJsonInput(JSON.stringify(mapperData, null, 2));
        }
      } else {
        const defaultTaskId = taskName.toLowerCase().replace(/\s+/g, '-');
        const timestamp = Date.now();
        setTaskRefId(`${defaultTaskId}-${sequenceNo}-taskref-${timestamp}`);
        setTaskId(`${defaultTaskId}-task`);
        setTaskListDomain('ORDER_TASK_LIST');
        
        // Set default mapper inputs
        const defaultInputs = {
          'orderWrapperRequest': '${shipping_extension_call.output.response.body}',
          'addressDetails': '${capture_address_api.output.response.body}',
          'workflowDetails': JSON.stringify({
            workflowId: '${workflow.workflowId}',
            workflowExecutionId: '${workflow.input.workflowExecutionId}'
          }, null, 2),
        };
        
        setMapperInputs(defaultInputs);
        setJsonInput(JSON.stringify(defaultInputs, null, 2));
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
    console.log('=== MapperTaskConfigModal handleSave ===');
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

    let finalMapperInputs = mapperInputs;

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
        finalMapperInputs = {};
        Object.entries(parsed).forEach(([key, value]) => {
          finalMapperInputs[key] = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
        });
      } catch (error) {
        toast({
          title: 'Invalid JSON',
          description: 'Invalid JSON format in mapper inputs',
          variant: 'destructive',
        });
        return;
      }
    }

    const taskinputParameters: any = {};

    if (Object.keys(finalMapperInputs).length > 0) {
      taskinputParameters.MAPPER = {};
      
      Object.entries(finalMapperInputs).forEach(([key, value]) => {
        try {
          const parsed = JSON.parse(value);
          taskinputParameters.MAPPER[key] = parsed;
        } catch {
          taskinputParameters.MAPPER[key] = value;
        }
      });
    }

    const config: MapperTaskConfiguration = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'MAPPER',
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters: Object.keys(taskinputParameters).length > 0 ? taskinputParameters : undefined,
    };

    console.log('Saving Mapper task config from form:', config);
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

  const handleAddMapperInput = () => {
    const newKey = `param${Object.keys(mapperInputs).length + 1}`;
    setMapperInputs({
      ...mapperInputs,
      [newKey]: '',
    });
  };

  const handleUpdateMapperInputKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    
    const updated = { ...mapperInputs };
    updated[newKey] = updated[oldKey];
    delete updated[oldKey];
    setMapperInputs(updated);
  };

  const handleUpdateMapperInputValue = (key: string, value: string) => {
    setMapperInputs({
      ...mapperInputs,
      [key]: value,
    });
  };

  const handleDeleteMapperInput = (key: string) => {
    const updated = { ...mapperInputs };
    delete updated[key];
    setMapperInputs(updated);
  };

  const MAPPER_EXAMPLE = `{
  "taskRefId": "create_order_api_input_mapper",
  "taskId": "create_order_api_input_mapper_task",
  "taskListDomain": "ORDER_TASK_LIST",
  "taskType": "MAPPER",
  "sequenceNo": 1,
  "taskinputParameters": {
    "MAPPER": {
      "orderWrapperRequest": "\${shipping_extension_call.output.response.body}",
      "addressDetails": "\${capture_address_api.output.response.body}",
      "workflowDetails": {
        "workflowId": "\${workflow.workflowId}",
        "workflowExecutionId": "\${workflow.input.workflowExecutionId}"
      },
      "event": "\${get_tasks_input_mapping_api.output.response.body.details.ORDER_TASK_LIST.create_order_api_input_mapper.event}"
    }
  }
}`;

  const handleLoadExample = () => {
    setFullJsonInput(MAPPER_EXAMPLE);
    validateFullJson(MAPPER_EXAMPLE);
    toast({
      title: 'Example Loaded',
      description: 'Mapper task example has been loaded.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-card text-card-foreground border-border" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-foreground flex items-center gap-2">
            <FunctionSquareIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
            Configure Mapper Task
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                MAPPER
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
              value="mapper"
              className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Mapper Inputs
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
                    <p className="text-xs font-medium text-foreground">Mapper Task Configuration</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mapper tasks transform and map input data from previous tasks or workflow inputs to create structured output for subsequent tasks.
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
                  placeholder="e.g., create_order_api_input_mapper"
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
                  placeholder="e.g., create_order_api_input_mapper_task"
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
                  placeholder="e.g., ORDER_TASK_LIST"
                  className="bg-background text-foreground border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Domain for task list organization and routing
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Task Type</Label>
                <Input
                  value="MAPPER"
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

            <TabsContent value="mapper" className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">Mapper Input Configuration</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Define input mappings that transform data from previous tasks. Use JSONPath expressions like {'${taskRef.output.field}'} to reference task outputs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground">Mapper Input Parameters</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!useJsonEditor) {
                          const mapperObj: Record<string, any> = {};
                          Object.entries(mapperInputs).forEach(([key, value]) => {
                            try {
                              mapperObj[key] = JSON.parse(value);
                            } catch {
                              mapperObj[key] = value;
                            }
                          });
                          setJsonInput(JSON.stringify(mapperObj, null, 2));
                        } else {
                          if (validateJson(jsonInput)) {
                            try {
                              const parsed = JSON.parse(jsonInput);
                              const inputs: Record<string, string> = {};
                              Object.entries(parsed).forEach(([key, value]) => {
                                inputs[key] = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
                              });
                              setMapperInputs(inputs);
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
  "orderWrapperRequest": "\${shipping_extension_call.output.response.body}",
  "addressDetails": "\${capture_address_api.output.response.body}",
  "workflowDetails": {
    "workflowId": "\${workflow.workflowId}",
    "workflowExecutionId": "\${workflow.input.workflowExecutionId}"
  }
}`}
                      className="bg-background text-foreground border-border font-mono text-xs min-h-[350px] resize-y"
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
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                      <p className="text-xs font-medium text-foreground mb-2">JSON Editor Tips:</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Use <code className="bg-background px-1 rounded">{'${taskRef.output.field}'}</code> to reference task outputs</li>
                        <li>Use <code className="bg-background px-1 rounded">{'${workflow.input.field}'}</code> for workflow inputs</li>
                        <li>Nested objects are supported for complex mappings</li>
                        <li>Ensure proper JSON syntax with quotes around keys and string values</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-xs font-medium text-foreground">Form Editor Tips:</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>For nested objects, use JSON format in the value field</li>
                        <li>Example: <code className="bg-background px-1 rounded">{`{"workflowId": "\${workflow.workflowId}"}`}</code></li>
                        <li>Use <code className="bg-background px-1 rounded">{'${taskRef.output.field}'}</code> for dynamic values</li>
                      </ul>
                    </div>

                    <ScrollArea className="h-[350px] pr-4">
                      <div className="space-y-3">
                        {Object.entries(mapperInputs).map(([key, value]) => (
                          <div key={key} className="space-y-2 p-3 rounded-lg bg-background border border-border">
                            <div className="flex gap-2 items-start">
                              <div className="flex-1 space-y-2">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Parameter Name</Label>
                                  <Input
                                    value={key}
                                    onChange={(e) => handleUpdateMapperInputKey(key, e.target.value)}
                                    placeholder="Parameter name (e.g., orderWrapperRequest)"
                                    className="bg-background text-foreground border-border mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Parameter Value</Label>
                                  <Textarea
                                    value={value}
                                    onChange={(e) => handleUpdateMapperInputValue(key, e.target.value)}
                                    placeholder='Value or JSON object (e.g., "${taskRef.output.field}" or {"key": "value"})'
                                    className="bg-background text-foreground border-border font-mono text-xs mt-1 min-h-[100px] resize-y"
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteMapperInput(key)}
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
                      onClick={handleAddMapperInput}
                      className="w-full bg-transparent text-foreground border-border hover:bg-accent"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                      Add Mapper Input
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="json" className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">JSON Editor Mode</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      View or edit the complete Mapper task configuration in JSON format. Changes are synced in real-time.
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
                  placeholder="Enter complete Mapper task JSON configuration..."
                />
              </div>

              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs font-medium text-foreground mb-2">Mapper Task Example:</p>
                <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{MAPPER_EXAMPLE}
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
