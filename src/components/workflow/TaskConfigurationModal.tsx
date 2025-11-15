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
import { PlusIcon, TrashIcon, AlertCircleIcon, InfoIcon, CopyIcon, CodeIcon, CheckCircle2Icon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TaskConfiguration {
  taskRefId: string;
  taskId: string;
  taskType: string;
  taskListDomain?: string;
  sequenceNo: number;
  taskinputParameters?: Record<string, any>;
}

interface TaskConfigurationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: TaskConfiguration) => void;
  taskType: string;
  taskName: string;
  initialConfig?: TaskConfiguration;
  sequenceNo: number;
}

export default function TaskConfigurationModal({
  open,
  onClose,
  onSave,
  taskType,
  taskName,
  initialConfig,
  sequenceNo,
}: TaskConfigurationModalProps) {
  console.log('=== TaskConfigurationModal RENDER ===');
  console.log('Open prop:', open);
  console.log('Task Type:', taskType);
  console.log('Task Name:', taskName);
  console.log('Sequence No:', sequenceNo);
  console.log('TaskConfigurationModal: Initial Config:', initialConfig);
  
  // Don't render for tasks with specialized modals
  if (taskType === 'LAMBDA' || taskType === 'DECISION' || taskType === 'MAPPER' || taskType === 'SCHEDULED_WAIT' || taskType === 'SIGNAL_OR_SCHEDULED_WAIT' || taskType === 'SIGNAL' || taskType === 'SIGNAL_WAIT' || taskType === 'TERMINATE' || taskType === 'PASS_THROUGH' || taskType === 'DO_WHILE') {
    console.log(`TaskConfigurationModal: Skipping render for taskType: ${taskType} - specialized modal should handle this`);
    return null;
  }
  
  console.log('TaskConfigurationModal: ✓ Will render Dialog component for taskType:', taskType);
  
  const { toast } = useToast();
  
  const [taskRefId, setTaskRefId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [taskListDomain, setTaskListDomain] = useState('');
  const [inputParameters, setInputParameters] = useState<Record<string, any>>({});
  const [jsonInput, setJsonInput] = useState('');
  const [useJsonEditor, setUseJsonEditor] = useState(false);
  const [jsonError, setJsonError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [fullJsonInput, setFullJsonInput] = useState('');
  const [fullJsonError, setFullJsonError] = useState('');
  const [isUserDefinedTask, setIsUserDefinedTask] = useState(false);
  
  // HTTP Task specific states
  const [httpUri, setHttpUri] = useState('');
  const [httpMethod, setHttpMethod] = useState('POST');
  const [httpConnectionTimeout, setHttpConnectionTimeout] = useState('3600');
  const [httpReadTimeout, setHttpReadTimeout] = useState('3600');
  const [httpAccept, setHttpAccept] = useState('application/json');
  const [httpContentType, setHttpContentType] = useState('application/json');
  const [httpBody, setHttpBody] = useState('');
  const [httpHeaders, setHttpHeaders] = useState<Record<string, string>>({
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  });

  // Auto-sync JSON in real-time whenever form values change
  useEffect(() => {
    if (!open) return;

    let taskinputParameters: any = {};

    if (taskType === 'HTTP') {
      taskinputParameters = {
        HTTP: {
          connectionTimeOut: httpConnectionTimeout,
          readTimeOut: httpReadTimeout,
          uri: httpUri.trim(),
          method: httpMethod,
          accept: httpAccept,
          'content-Type': httpContentType,
          body: httpBody.trim(),
          headers: httpHeaders
        }
      };
    } else {
      taskinputParameters = Object.keys(inputParameters).length > 0 ? inputParameters : undefined;
    }

    const config = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType,
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
    taskType,
    taskListDomain,
    sequenceNo,
    httpUri,
    httpMethod,
    httpConnectionTimeout,
    httpReadTimeout,
    httpAccept,
    httpContentType,
    httpBody,
    httpHeaders,
    inputParameters
  ]);

  useEffect(() => {
    console.log('=== TaskConfigurationModal useEffect triggered ===');
    console.log('Open:', open);
    console.log('Task Type:', taskType);
    console.log('Task Name:', taskName);
    console.log('Sequence No:', sequenceNo);
    console.log('Initial Config:', initialConfig);
    
    if (open && taskType) {
      // Check if this is a user-defined task
      const isUserDefined = !['GENERIC', 'HTTP', 'LAMBDA', 'DECISION'].includes(taskType);
      setIsUserDefinedTask(isUserDefined);
      
      if (initialConfig) {
        setTaskRefId(initialConfig.taskRefId);
        setTaskId(initialConfig.taskId);
        setTaskListDomain(initialConfig.taskListDomain || '');
        
        // Handle HTTP task configuration
        if (taskType === 'HTTP' && initialConfig.taskinputParameters?.HTTP) {
          const httpConfig = initialConfig.taskinputParameters.HTTP;
          setHttpUri(httpConfig.uri || '');
          setHttpMethod(httpConfig.method || 'POST');
          setHttpConnectionTimeout(httpConfig.connectionTimeOut || '3600');
          setHttpReadTimeout(httpConfig.readTimeOut || '3600');
          setHttpAccept(httpConfig.accept || 'application/json');
          setHttpContentType(httpConfig['content-Type'] || 'application/json');
          setHttpBody(httpConfig.body || '');
          setHttpHeaders(httpConfig.headers || { 'Accept': 'application/json', 'Content-Type': 'application/json' });
        } else {
          setInputParameters(initialConfig.taskinputParameters || {});
          setJsonInput(JSON.stringify(initialConfig.taskinputParameters || {}, null, 2));
        }
      } else {
        // Set default values based on task type
        const defaultTaskId = isUserDefined ? taskType : taskName.toLowerCase().replace(/\s+/g, '-');
        const timestamp = Date.now();
        setTaskRefId(`${defaultTaskId}-${sequenceNo}-taskref-${timestamp}`);
        setTaskId(isUserDefined ? taskType : `${defaultTaskId}-task`);
        
        // Set default task list domain
        setTaskListDomain('DEFAULT-TASKLIST');
        
        if (taskType === 'GENERIC') {
          // Set default input parameters for GENERIC tasks
          const defaultParams = {
            order: {
              orderType: '${workflow.input.orderType}',
              hasReservation: 'Y',
              shipNode: '${workflow.input.shipNode}',
              orderNo: 'Order-1'
            }
          };
          setInputParameters(defaultParams);
          setJsonInput(JSON.stringify(defaultParams, null, 2));
        } else if (taskType === 'HTTP') {
          // Set default values for HTTP tasks
          setHttpUri('http://localhost:8080/api/endpoint');
          setHttpMethod('POST');
          setHttpConnectionTimeout('3600');
          setHttpReadTimeout('3600');
          setHttpAccept('application/json');
          setHttpContentType('application/json');
          setHttpBody('${workflow.input}');
          setHttpHeaders({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          });
        } else {
          setInputParameters({});
          setJsonInput('{}');
        }
      }
      setActiveTab('basic');
      setJsonError('');
      setUseJsonEditor(false);
    }
  }, [initialConfig, taskName, sequenceNo, taskType, open]);

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
    console.log('TaskConfigurationModal: handleSave triggered for taskType:', taskType);
    // If using JSON tab, parse and save from JSON
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

    // Otherwise use form-based validation
    if (!taskRefId.trim()) {
      alert('Task Reference ID is required');
      return;
    }

    if (!taskId.trim()) {
      alert('Task ID is required');
      return;
    }

    let finalInputParameters = inputParameters;

    if (useJsonEditor) {
      if (!validateJson(jsonInput)) {
        alert('Please fix JSON errors before saving');
        return;
      }
      try {
        finalInputParameters = JSON.parse(jsonInput);
      } catch (error) {
        alert('Invalid JSON format in input parameters');
        return;
      }
    }

    const config: TaskConfiguration = {
      taskRefId: taskRefId.trim(),
      taskId: taskId.trim(),
      taskType,
      taskListDomain: taskListDomain.trim() || undefined,
      sequenceNo,
      taskinputParameters: Object.keys(finalInputParameters).length > 0 ? finalInputParameters : undefined,
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

  const handleAddHttpHeader = () => {
    const newKey = `header${Object.keys(httpHeaders).length + 1}`;
    setHttpHeaders({
      ...httpHeaders,
      [newKey]: '',
    });
  };

  const handleUpdateHttpHeaderKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    
    const updated = { ...httpHeaders };
    updated[newKey] = updated[oldKey];
    delete updated[oldKey];
    setHttpHeaders(updated);
  };

  const handleUpdateHttpHeaderValue = (key: string, value: string) => {
    setHttpHeaders({
      ...httpHeaders,
      [key]: value,
    });
  };

  const handleDeleteHttpHeader = (key: string) => {
    const updated = { ...httpHeaders };
    delete updated[key];
    setHttpHeaders(updated);
  };

  const handleAddParameter = () => {
    const newKey = `param${Object.keys(inputParameters).length + 1}`;
    setInputParameters({
      ...inputParameters,
      [newKey]: '',
    });
  };

  const handleUpdateParameterKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    
    const updated = { ...inputParameters };
    updated[newKey] = updated[oldKey];
    delete updated[oldKey];
    setInputParameters(updated);
  };

  const handleUpdateParameterValue = (key: string, value: string) => {
    const updated = { ...inputParameters };
    
    // Try to parse as JSON for nested objects
    try {
      const parsed = JSON.parse(value);
      updated[key] = parsed;
    } catch {
      // If not valid JSON, store as string
      updated[key] = value;
    }
    
    setInputParameters(updated);
  };

  const handleDeleteParameter = (key: string) => {
    const updated = { ...inputParameters };
    delete updated[key];
    setInputParameters(updated);
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

  const handleLoadExample = () => {
    setFullJsonInput(GENERIC_TASK_EXAMPLE);
    validateFullJson(GENERIC_TASK_EXAMPLE);
    toast({
      title: 'Example Loaded',
      description: 'Generic task example has been loaded.',
    });
  };

  const renderHttpTaskForm = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-muted">
        <TabsTrigger 
          value="basic"
          className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Task Configuration
        </TabsTrigger>
        <TabsTrigger 
          value="http"
          className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          HTTP Configuration
        </TabsTrigger>
        <TabsTrigger 
          value="json"
          className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <CodeIcon className="h-3 w-3 mr-1" strokeWidth={1.5} />
          JSON
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-start gap-2">
            <InfoIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">HTTP Task Configuration</p>
              <p className="text-xs text-muted-foreground mt-1">
                Configure the basic properties for this HTTP task. Use the HTTP Configuration tab to set up the API call details.
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
            placeholder="e.g., publishorder"
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
            placeholder="e.g., publish-order-1"
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
            value={taskType}
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

      <TabsContent value="http" className="space-y-4 mt-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="httpUri" className="text-foreground">
              URI <span className="text-destructive">*</span>
            </Label>
            <Input
              id="httpUri"
              value={httpUri}
              onChange={(e) => setHttpUri(e.target.value)}
              placeholder="http://localhost:9092/api/endpoint"
              className="bg-background text-foreground border-border font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Full URL for the HTTP request. Use {'${variable}'} for dynamic values.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="httpMethod" className="text-foreground">
                HTTP Method <span className="text-destructive">*</span>
              </Label>
              <select
                id="httpMethod"
                value={httpMethod}
                onChange={(e) => setHttpMethod(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="httpAccept" className="text-foreground">
                Accept
              </Label>
              <Input
                id="httpAccept"
                value={httpAccept}
                onChange={(e) => setHttpAccept(e.target.value)}
                placeholder="application/json"
                className="bg-background text-foreground border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="httpConnectionTimeout" className="text-foreground">
                Connection Timeout (ms)
              </Label>
              <Input
                id="httpConnectionTimeout"
                type="number"
                value={httpConnectionTimeout}
                onChange={(e) => setHttpConnectionTimeout(e.target.value)}
                className="bg-background text-foreground border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="httpReadTimeout" className="text-foreground">
                Read Timeout (ms)
              </Label>
              <Input
                id="httpReadTimeout"
                type="number"
                value={httpReadTimeout}
                onChange={(e) => setHttpReadTimeout(e.target.value)}
                className="bg-background text-foreground border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="httpContentType" className="text-foreground">
              Content-Type
            </Label>
            <Input
              id="httpContentType"
              value={httpContentType}
              onChange={(e) => setHttpContentType(e.target.value)}
              placeholder="application/json"
              className="bg-background text-foreground border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="httpBody" className="text-foreground">
              Request Body
            </Label>
            <Textarea
              id="httpBody"
              value={httpBody}
              onChange={(e) => setHttpBody(e.target.value)}
              placeholder='${workflow.input} or {"key": "value"}'
              className="bg-background text-foreground border-border font-mono text-xs min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Request body content. Use {'${variable}'} for dynamic values or provide JSON directly.
            </p>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-3">
            <Label className="text-foreground">HTTP Headers</Label>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {Object.entries(httpHeaders).map(([key, value]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <Input
                      value={key}
                      onChange={(e) => handleUpdateHttpHeaderKey(key, e.target.value)}
                      placeholder="Header name"
                      className="bg-background text-foreground border-border"
                    />
                    <Input
                      value={value}
                      onChange={(e) => handleUpdateHttpHeaderValue(key, e.target.value)}
                      placeholder="Header value"
                      className="bg-background text-foreground border-border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteHttpHeader(key)}
                      className="flex-shrink-0 bg-transparent text-destructive border-border hover:bg-destructive/10"
                      aria-label="Delete header"
                      title="Delete header"
                    >
                      <TrashIcon className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddHttpHeader}
              className="w-full bg-transparent text-foreground border-border hover:bg-accent"
            >
              <PlusIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Add Header
            </Button>
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
                View or edit the complete HTTP task configuration in JSON format.
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

        <ScrollArea className="h-[350px] rounded-lg border border-border">
          <Textarea
            value={fullJsonInput}
            onChange={(e) => {
              setFullJsonInput(e.target.value);
              validateFullJson(e.target.value);
            }}
            className="min-h-[350px] font-mono text-xs bg-background text-foreground border-0 focus-visible:ring-0 resize-none"
            placeholder="Enter complete HTTP task JSON configuration..."
          />
        </ScrollArea>

        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
          <p className="text-xs font-medium text-foreground mb-2">HTTP Task JSON Example:</p>
          <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{`{
  "taskRefId": "publishorder",
  "taskId": "publish-order-1",
  "taskType": "HTTP",
  "taskListDomain": "BOPUS-TASKLIST",
  "sequenceNo": 1,
  "taskinputParameters": {
    "HTTP": {
      "connectionTimeOut": "3600",
      "readTimeOut": "3600",
      "uri": "http://localhost:9092/api/endpoint",
      "method": "POST",
      "accept": "application/json",
      "content-Type": "application/json",
      "body": "\${workflow.input}",
      "headers": {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    }
  }
}`}
          </pre>
        </div>
      </TabsContent>
    </Tabs>
  );

  const renderGenericTaskForm = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-muted">
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
          value="json"
          className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <CodeIcon className="h-3 w-3 mr-1" strokeWidth={1.5} />
          JSON
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
                <div className={cn(
                  "p-3 rounded-lg border",
                  isUserDefinedTask 
                    ? "bg-tertiary/10 border-tertiary/20" 
                    : "bg-primary/10 border-primary/20"
                )}>
                  <div className="flex items-start gap-2">
                    <InfoIcon className={cn(
                      "h-4 w-4 flex-shrink-0 mt-0.5",
                      isUserDefinedTask ? "text-tertiary" : "text-primary"
                    )} strokeWidth={1.5} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">
                        {isUserDefinedTask ? 'User Defined Task Configuration' : 'Task Configuration'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isUserDefinedTask 
                          ? `Configure this user-defined task (${taskType}). This task definition should already exist in your Conductor server.`
                          : `Define the basic properties for this ${taskType} task. These values will be included in the workflow JSON definition.`
                        }
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
            placeholder="e.g., sample-generic-bopis-task-1-taskref"
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
                    placeholder="e.g., sample-generic-bopis-task"
                    className="bg-background text-foreground border-border"
                    disabled={isUserDefinedTask}
                  />
                  <p className="text-xs text-muted-foreground">
                    {isUserDefinedTask 
                      ? 'Task definition identifier (pre-filled from user-defined task)'
                      : 'Task definition identifier (must match registered task definition)'
                    }
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
            Domain for task list organization and routing (e.g., BOPUS-TASKLIST, DEFAULT-TASKLIST)
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Task Type</Label>
          <Input
            value={taskType}
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
                    // Switching to JSON editor - sync current form data
                    setJsonInput(JSON.stringify(inputParameters, null, 2));
                  } else {
                    // Switching to form editor - parse JSON
                    if (validateJson(jsonInput)) {
                      try {
                        setInputParameters(JSON.parse(jsonInput));
                      } catch (error) {
                        alert('Invalid JSON. Please fix errors before switching to form editor.');
                        return;
                      }
                    } else {
                      alert('Invalid JSON. Please fix errors before switching to form editor.');
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
  "order": {
    "orderType": "\${workflow.input.orderType}",
    "hasReservation": "Y",
    "shipNode": "\${workflow.input.shipNode}",
    "orderNo": "Bopus-Order-1"
  }
}`}
                className="bg-background text-foreground border-border font-mono text-xs min-h-[300px]"
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
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs font-medium text-foreground mb-2">JSON Editor Tips:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Use <code className="bg-background px-1 rounded">{'${workflow.input.fieldName}'}</code> for dynamic workflow input values</li>
                    <li>Use <code className="bg-background px-1 rounded">{'${taskRefName.output.fieldName}'}</code> to reference previous task outputs</li>
                    <li>Nested objects are supported for complex data structures</li>
                    <li>Ensure proper JSON syntax with quotes around keys and string values</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-xs font-medium text-foreground mb-2">Example for GENERIC Task:</p>
                  <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{`{
  "order": {
    "orderType": "\${workflow.input.orderType}",
    "hasReservation": "Y",
    "shipNode": "\${workflow.input.shipNode}",
    "orderNo": "Bopus-Order-1"
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs font-medium text-foreground">Form Editor Tips:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>For nested objects, use JSON format in the value field</li>
                  <li>Example: <code className="bg-background px-1 rounded">{`{"orderType": "\${workflow.input.orderType}"}`}</code></li>
                  <li>Use <code className="bg-background px-1 rounded">{'${workflow.input.fieldName}'}</code> for dynamic values</li>
                </ul>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {Object.entries(inputParameters).map(([key, value]) => (
                    <div key={key} className="space-y-2 p-3 rounded-lg bg-background border border-border">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Parameter Name</Label>
                            <Input
                              value={key}
                              onChange={(e) => handleUpdateParameterKey(key, e.target.value)}
                              placeholder="Parameter name (e.g., order)"
                              className="bg-background text-foreground border-border mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Parameter Value</Label>
                            <Textarea
                              value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                              onChange={(e) => handleUpdateParameterValue(key, e.target.value)}
                              placeholder='Value or JSON object (e.g., {"orderType": "${workflow.input.orderType}"})'
                              className="bg-background text-foreground border-border font-mono text-xs mt-1 min-h-[80px]"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteParameter(key)}
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
                onClick={handleAddParameter}
                className="w-full bg-transparent text-foreground border-border hover:bg-accent"
              >
                <PlusIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Add Parameter
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
                Create or edit the task using JSON format. This gives you full control over the task configuration.
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
              Copy from Form
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
            className="h-[350px] w-full font-mono text-xs bg-background text-foreground border-0 focus-visible:ring-0 resize-none overflow-auto"
            placeholder="Enter complete task JSON configuration..."
          />
        </div>

        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
          <p className="text-xs font-medium text-foreground mb-2">JSON Tips:</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Use <code className="bg-background px-1 rounded">{'${workflow.input.fieldName}'}</code> for dynamic workflow input values</li>
            <li>Use <code className="bg-background px-1 rounded">{'${taskRefName.output.fieldName}'}</code> to reference previous task outputs</li>
            <li>Click "Copy from Form" to convert your form data to JSON</li>
            <li>Click "Load Example" to see a sample GENERIC task configuration</li>
          </ul>
        </div>
      </TabsContent>
    </Tabs>
  );

  console.log('=== About to return Dialog component ===');
  console.log('Dialog open prop will be:', open);
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      console.log('=== Dialog onOpenChange triggered ===');
      console.log('New open state:', isOpen);
      if (!isOpen) {
        console.log('Calling onClose');
        onClose();
      }
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-card text-card-foreground border-border" onPointerDownOutside={(e) => e.preventDefault()}>
        {console.log('=== DialogContent is rendering ===')}
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-foreground">
            Configure {taskName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                {taskType}
              </Badge>
              <span className="text-xs">Sequence: {sequenceNo}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6 py-4">
            {taskType === 'GENERIC' && renderGenericTaskForm()}
            {taskType === 'HTTP' && renderHttpTaskForm()}
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
            disabled={(useJsonEditor && !!jsonError) || (activeTab === 'json' && !!fullJsonError)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
