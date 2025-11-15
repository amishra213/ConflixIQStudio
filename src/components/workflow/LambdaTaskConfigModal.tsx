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

interface LambdaTaskConfiguration {
  taskRefId: string;
  taskId: string;
  taskType: 'LAMBDA';
  taskListDomain?: string;
  sequenceNo: number;
  taskinputParameters?: {
    lambdaValue?: string;
    evalExpression?: string;
    scriptExpression?: string;
    [key: string]: any;
  };
}

interface LambdaTaskConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: LambdaTaskConfiguration) => void;
  taskName: string;
  initialConfig?: LambdaTaskConfiguration;
  sequenceNo: number;
}

export default function LambdaTaskConfigModal({
  open,
  onClose,
  onSave,
  taskName,
  initialConfig,
  sequenceNo,
}: LambdaTaskConfigModalProps) {
  console.log('=== LambdaTaskConfigModal render ===');
  console.log('Open:', open);
  console.log('Task Name:', taskName);
  console.log('Sequence No:', sequenceNo);
  console.log('Initial Config:', initialConfig);
  
  const { toast } = useToast();
  
  const [taskRefId, setTaskRefId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [taskListDomain, setTaskListDomain] = useState('');
  const [expressionType, setExpressionType] = useState<'eval' | 'script'>('eval');
  const [lambdaValue, setLambdaValue] = useState('');
  const [evalExpression, setEvalExpression] = useState('');
  const [scriptExpression, setScriptExpression] = useState('');
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');
  const [fullJsonInput, setFullJsonInput] = useState('');
  const [fullJsonError, setFullJsonError] = useState('');

  // Auto-sync JSON in real-time whenever form values change
  useEffect(() => {
    if (!open) return;

    let taskinputParameters: any = {};

    if (expressionType === 'eval') {
      taskinputParameters = {
        lambdaValue: lambdaValue.trim(),
        evalExpression: evalExpression.trim(),
      };
    } else {
      taskinputParameters = {
        ...customInputs,
        scriptExpression: scriptExpression.trim(),
      };
    }

    const config = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'LAMBDA',
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters,
    };

    setFullJsonInput(JSON.stringify(config, null, 2));
    validateFullJson(JSON.stringify(config, null, 2));
  }, [
    open,
    taskRefId,
    taskId,
    taskListDomain,
    sequenceNo,
    expressionType,
    lambdaValue,
    evalExpression,
    scriptExpression,
    customInputs
  ]);

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setTaskRefId(initialConfig.taskRefId);
        setTaskId(initialConfig.taskId);
        setTaskListDomain(initialConfig.taskListDomain || '');
        
        if (initialConfig.taskinputParameters) {
          const params = initialConfig.taskinputParameters;
          
          if (params.evalExpression) {
            setExpressionType('eval');
            setLambdaValue(params.lambdaValue || '');
            setEvalExpression(params.evalExpression);
          } else if (params.scriptExpression) {
            setExpressionType('script');
            setScriptExpression(params.scriptExpression);
            
            // Extract custom inputs (excluding scriptExpression)
            const { scriptExpression: _, ...rest } = params;
            setCustomInputs(rest);
          }
        }
      } else {
        const defaultTaskId = taskName.toLowerCase().replace(/\s+/g, '-');
        const timestamp = Date.now();
        setTaskRefId(`${defaultTaskId}-${sequenceNo}-taskref-${timestamp}`);
        setTaskId(`${defaultTaskId}-task`);
        setTaskListDomain('BOPUS-TASKLIST');
        setExpressionType('eval');
        setLambdaValue('${workflow.input.orderType}');
        setEvalExpression("if ($.lambdaValue == 'BOPUS'){ return {deliveryMethod:'PICK'} } else { return {deliveryMethod: 'SHIP'} }");
        setScriptExpression("return {'isTransfer': $.isTranfer}");
        setCustomInputs({});
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

    let taskinputParameters: any = {};

    if (expressionType === 'eval') {
      if (!evalExpression.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Eval Expression is required',
          variant: 'destructive',
        });
        return;
      }
      taskinputParameters = {
        lambdaValue: lambdaValue.trim(),
        evalExpression: evalExpression.trim(),
      };
    } else {
      if (!scriptExpression.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Script Expression is required',
          variant: 'destructive',
        });
        return;
      }
      taskinputParameters = {
        ...customInputs,
        scriptExpression: scriptExpression.trim(),
      };
    }

    const config: LambdaTaskConfiguration = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType: 'LAMBDA',
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters,
    };

    onSave(config);
    onClose();
  };

  const handleCopyToJson = () => {
    // JSON is already synced in real-time, just switch to JSON tab
    setActiveTab('json');
    toast({
      title: 'Viewing JSON',
      description: 'JSON is automatically synced with form data in real-time.',
    });
  };

  const handleAddCustomInput = () => {
    const newKey = `param${Object.keys(customInputs).length + 1}`;
    setCustomInputs({
      ...customInputs,
      [newKey]: '',
    });
  };

  const handleUpdateCustomInputKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    
    const updated = { ...customInputs };
    updated[newKey] = updated[oldKey];
    delete updated[oldKey];
    setCustomInputs(updated);
  };

  const handleUpdateCustomInputValue = (key: string, value: string) => {
    setCustomInputs({
      ...customInputs,
      [key]: value,
    });
  };

  const handleDeleteCustomInput = (key: string) => {
    const updated = { ...customInputs };
    delete updated[key];
    setCustomInputs(updated);
  };

  const LAMBDA_EXAMPLE_1 = `{
  "taskRefId": "lambda-task-ref",
  "taskId": "lambda-task",
  "taskListDomain": "BOPUS-TASKLIST",
  "sequenceNo": 1,
  "taskType": "LAMBDA",
  "taskinputParameters": {
    "lambdaValue": "\${workflow.input.orderType}",
    "evalExpression": "if ($.lambdaValue == 'BOPUS'){ return {deliveryMethod:'PICK'} } else { return {deliveryMethod: 'SHIP'} }"
  }
}`;

  const LAMBDA_EXAMPLE_2 = `{
  "taskId": "lambda_task",
  "taskRefId": "get_sales_order_id_2",
  "taskinputParameters": {
    "salesOrderId": "\${workflow.input.orderDetail.orderLines}",
    "isTranfer": "\${workflow.input.orderDetail.orderType}",
    "scriptExpression": "return {'isTransfer': $.isTranfer}"
  },
  "taskType": "LAMBDA",
  "taskListDomain": "BOPUS-TASKLIST",
  "sequenceNo": 2
}`;

  const handleLoadExample = (example: string) => {
    setFullJsonInput(example);
    validateFullJson(example);
    toast({
      title: 'Example Loaded',
      description: 'Lambda task example has been loaded.',
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
            Configure Lambda Task
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                LAMBDA
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
              value="lambda"
              className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Lambda Expression
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
                    <p className="text-xs font-medium text-foreground">Lambda Task Configuration</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Lambda tasks execute inline JavaScript expressions to transform data without requiring external workers.
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
                  placeholder="e.g., lambda-task-ref"
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
                  placeholder="e.g., lambda-task"
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
                  value="LAMBDA"
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

            <TabsContent value="lambda" className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">Lambda Expression Types</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose between evalExpression (with lambdaValue) or scriptExpression (with custom inputs) based on your use case.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Expression Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={expressionType === 'eval' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExpressionType('eval')}
                    className={expressionType === 'eval' ? '' : 'bg-transparent text-foreground border-border hover:bg-accent'}
                  >
                    Eval Expression
                  </Button>
                  <Button
                    type="button"
                    variant={expressionType === 'script' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExpressionType('script')}
                    className={expressionType === 'script' ? '' : 'bg-transparent text-foreground border-border hover:bg-accent'}
                  >
                    Script Expression
                  </Button>
                </div>
              </div>

              <Separator className="bg-border" />

              {expressionType === 'eval' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lambdaValue" className="text-foreground">
                      Lambda Value
                    </Label>
                    <Input
                      id="lambdaValue"
                      value={lambdaValue}
                      onChange={(e) => setLambdaValue(e.target.value)}
                      placeholder="${workflow.input.orderType}"
                      className="bg-background text-foreground border-border font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Input value to be evaluated. Use {'${workflow.input.fieldName}'} for dynamic values.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="evalExpression" className="text-foreground">
                      Eval Expression <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="evalExpression"
                      value={evalExpression}
                      onChange={(e) => setEvalExpression(e.target.value)}
                      placeholder="if ($.lambdaValue == 'BOPUS'){ return {deliveryMethod:'PICK'} } else { return {deliveryMethod: 'SHIP'} }"
                      className="bg-background text-foreground border-border font-mono text-xs min-h-[150px] resize-y"
                    />
                    <p className="text-xs text-muted-foreground">
                      JavaScript expression to evaluate. Use <code className="bg-background px-1 rounded">$.lambdaValue</code> to reference the lambda value.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-xs font-medium text-foreground mb-2">Eval Expression Example:</p>
                    <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{`if ($.lambdaValue == 'BOPUS'){
  return {deliveryMethod:'PICK'}
} else {
  return {deliveryMethod: 'SHIP'}
}`}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground">Custom Input Parameters</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCustomInput}
                        className="bg-transparent text-foreground border-border hover:bg-accent"
                      >
                        <PlusIcon className="h-3 w-3 mr-2" strokeWidth={1.5} />
                        Add Input
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-[200px] pr-4">
                      <div className="space-y-3">
                        {Object.entries(customInputs).map(([key, value]) => (
                          <div key={key} className="flex gap-2 items-center">
                            <Input
                              value={key}
                              onChange={(e) => handleUpdateCustomInputKey(key, e.target.value)}
                              placeholder="Parameter name"
                              className="bg-background text-foreground border-border"
                            />
                            <Input
                              value={value}
                              onChange={(e) => handleUpdateCustomInputValue(key, e.target.value)}
                              placeholder="${workflow.input.fieldName}"
                              className="bg-background text-foreground border-border font-mono text-xs"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteCustomInput(key)}
                              className="flex-shrink-0 bg-transparent text-destructive border-border hover:bg-destructive/10"
                            >
                              <TrashIcon className="h-4 w-4" strokeWidth={1.5} />
                            </Button>
                          </div>
                        ))}
                        {Object.keys(customInputs).length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            No custom inputs added. Click "Add Input" to create parameters.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scriptExpression" className="text-foreground">
                      Script Expression <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="scriptExpression"
                      value={scriptExpression}
                      onChange={(e) => setScriptExpression(e.target.value)}
                      placeholder="return {'isTransfer': $.isTranfer}"
                      className="bg-background text-foreground border-border font-mono text-xs min-h-[150px] resize-y"
                    />
                    <p className="text-xs text-muted-foreground">
                      JavaScript expression to execute. Use <code className="bg-background px-1 rounded">$.parameterName</code> to reference custom inputs.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-xs font-medium text-foreground mb-2">Script Expression Example:</p>
                    <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{`// With inputs: salesOrderId, isTranfer
return {'isTransfer': $.isTranfer}`}
                    </pre>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="json" className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">JSON Editor Mode</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      View or edit the complete Lambda task configuration in JSON format.
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
                  Copy from Form
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
                  placeholder="Enter complete Lambda task JSON configuration..."
                />
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-foreground">Example 1: Eval Expression</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadExample(LAMBDA_EXAMPLE_1)}
                      className="h-6 text-xs bg-transparent text-foreground border-border hover:bg-accent"
                    >
                      Load
                    </Button>
                  </div>
                  <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{LAMBDA_EXAMPLE_1}
                  </pre>
                </div>

                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-foreground">Example 2: Script Expression</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadExample(LAMBDA_EXAMPLE_2)}
                      className="h-6 text-xs bg-transparent text-foreground border-border hover:bg-accent"
                    >
                      Load
                    </Button>
                  </div>
                  <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{LAMBDA_EXAMPLE_2}
                  </pre>
                </div>
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
