import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlusIcon, Trash2Icon } from "lucide-react";

export interface WorkflowTaskConfig {
  name: string;
  taskReferenceName: string;
  type: "SIMPLE";
  description?: string;
  inputParameters?: Record<string, any>;
  optional?: boolean;
  startDelay?: number;
  retryCount?: number;
  retryLogic?: "FIXED" | "LINEAR" | "EXPONENTIAL";
  retryDelaySeconds?: number;
  backoffRate?: number;
  rateLimitPerFrequency?: number;
  rateLimitFrequencyInSeconds?: number;
  timeoutSeconds?: number;
  timeoutPolicy?: "TIME_OUT_WF" | "TIME_OUT_TASK" | "RETRY";
  responseTimeoutSeconds?: number;
  queueName?: string;
  sink?: string;
  monitorMask?: number;
  asyncComplete?: boolean;
  isolationGroupId?: string;
  executionNameSpace?: string;
  inputTemplate?: Record<string, any>;
  taskDefinition?: {
    name: string;
    description?: string;
    retryCount?: number;
    timeoutSeconds?: number;
  };
}

export interface SimpleTaskModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (config: WorkflowTaskConfig) => Promise<void>;
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
}: SimpleTaskModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskRefName, setTaskRefName] = useState("");
  const [description, setDescription] = useState("");
  const [optional, setOptional] = useState(false);
  const [startDelay, setStartDelay] = useState(0);
  const [retryCount, setRetryCount] = useState(3);
  const [retryLogic, setRetryLogic] = useState<"FIXED" | "LINEAR" | "EXPONENTIAL">("FIXED");
  const [retryDelaySeconds, setRetryDelaySeconds] = useState(5);
  const [backoffRate, setBackoffRate] = useState(2);
  const [rateLimitPerFrequency, setRateLimitPerFrequency] = useState(10);
  const [rateLimitFrequencyInSeconds, setRateLimitFrequencyInSeconds] = useState(1);
  const [timeoutSeconds, setTimeoutSeconds] = useState(120);
  const [timeoutPolicy, setTimeoutPolicy] = useState<"TIME_OUT_WF" | "TIME_OUT_TASK" | "RETRY">("TIME_OUT_WF");
  const [responseTimeoutSeconds, setResponseTimeoutSeconds] = useState(60);
  const [queueName, setQueueName] = useState("");
  const [sink, setSink] = useState("");
  const [monitorMask, setMonitorMask] = useState(0);
  const [asyncComplete, setAsyncComplete] = useState(false);
  const [isolationGroupId, setIsolationGroupId] = useState("");
  const [executionNameSpace, setExecutionNameSpace] = useState("default");
  const [inputParams, setInputParams] = useState<InputParam[]>([]);
  const [jsonEditable, setJsonEditable] = useState("");
  const [jsonValidationError, setJsonValidationError] = useState("");

  useEffect(() => {
    if (open) {
      const timestamp = Date.now();
      setTaskName(`task_${timestamp}`); // Auto-generate task name
      setTaskRefName(`task_ref_${timestamp}`);
      setDescription("");
      setOptional(false);
      setStartDelay(0);
      setRetryCount(3);
      setRetryLogic("FIXED");
      setRetryDelaySeconds(5);
      setBackoffRate(2);
      setRateLimitPerFrequency(10);
      setRateLimitFrequencyInSeconds(1);
      setTimeoutSeconds(120);
      setTimeoutPolicy("TIME_OUT_WF");
      setResponseTimeoutSeconds(60);
      setQueueName("");
      setSink("");
      setMonitorMask(0);
      setAsyncComplete(false);
      setIsolationGroupId("");
      setExecutionNameSpace("default");
      setInputParams([]);
      setJsonValidationError("");
    }
  }, [open]);

  const handleAddInputParam = () => {
    setInputParams([...inputParams, { id: `${Date.now()}`, key: "", value: "" }]);
  };

  const handleRemoveInputParam = (id: string) => {
    setInputParams(inputParams.filter(p => p.id !== id));
  };

  const handleInputParamChange = (id: string, field: "key" | "value", newValue: string) => {
    setInputParams(inputParams.map(p => (p.id === id ? { ...p, [field]: newValue } : p)));
  };

  const handleSave = async () => {
    if (!taskName || taskName.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Task name is required",
        variant: "destructive",
      });
      return;
    }

    if (!taskRefName || taskRefName.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Task reference name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const inputParameters: Record<string, any> = {};
      for (const param of inputParams) {
        if (param.key.trim()) {
          try {
            inputParameters[param.key] = param.value.trim() ? JSON.parse(param.value) : param.value;
          } catch {
            inputParameters[param.key] = param.value;
          }
        }
      }

      const finalConfig: WorkflowTaskConfig = {
        name: taskName,
        taskReferenceName: taskRefName,
        type: "SIMPLE",
        description: description || undefined,
        inputParameters: Object.keys(inputParameters).length > 0 ? inputParameters : undefined,
        optional,
        startDelay: startDelay > 0 ? startDelay : undefined,
        retryCount: retryCount > 0 ? retryCount : undefined,
        retryLogic,
        retryDelaySeconds: retryDelaySeconds > 0 ? retryDelaySeconds : undefined,
        backoffRate: backoffRate > 0 ? backoffRate : undefined,
        rateLimitPerFrequency: rateLimitPerFrequency > 0 ? rateLimitPerFrequency : undefined,
        rateLimitFrequencyInSeconds: rateLimitFrequencyInSeconds > 0 ? rateLimitFrequencyInSeconds : undefined,
        timeoutSeconds: timeoutSeconds > 0 ? timeoutSeconds : undefined,
        timeoutPolicy,
        responseTimeoutSeconds: responseTimeoutSeconds > 0 ? responseTimeoutSeconds : undefined,
        queueName: queueName || undefined,
        sink: sink || undefined,
        monitorMask: monitorMask > 0 ? monitorMask : undefined,
        asyncComplete: asyncComplete || undefined,
        isolationGroupId: isolationGroupId || undefined,
        executionNameSpace: executionNameSpace || undefined,
        inputTemplate: {},
        taskDefinition: {
          name: taskName,
          description: description || undefined,
          retryCount: retryCount > 0 ? retryCount : undefined,
          timeoutSeconds: timeoutSeconds > 0 ? timeoutSeconds : undefined,
        },
      };

      setIsLoading(true);
      await onSave(finalConfig);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save task",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getJsonPreview = () => {
    const inputParameters: Record<string, any> = {};
    for (const param of inputParams) {
      if (param.key.trim()) {
        try {
          inputParameters[param.key] = param.value.trim() ? JSON.parse(param.value) : param.value;
        } catch {
          inputParameters[param.key] = param.value;
        }
      }
    }

    return {
      name: taskName,
      taskReferenceName: taskRefName,
      type: "SIMPLE",
      description: description || undefined,
      inputParameters: Object.keys(inputParameters).length > 0 ? inputParameters : {},
      optional,
      startDelay,
      retryCount,
      retryLogic,
      retryDelaySeconds,
      backoffRate,
      rateLimitPerFrequency,
      rateLimitFrequencyInSeconds,
      timeoutSeconds,
      timeoutPolicy,
      responseTimeoutSeconds,
      queueName,
      sink,
      monitorMask,
      asyncComplete,
      isolationGroupId,
      executionNameSpace,
      inputTemplate: {},
      taskDefinition: {
        name: taskName,
        description: description || undefined,
        retryCount,
        timeoutSeconds,
      },
    };
  };

  const handleJsonChange = (newJson: string) => {
    setJsonEditable(newJson);
    try {
      JSON.parse(newJson);
      setJsonValidationError("");
    } catch (error) {
      setJsonValidationError(error instanceof Error ? error.message : "Invalid JSON");
    }
  };

  const handleCopyJson = async () => {
    try {
      const json = JSON.stringify(getJsonPreview(), null, 2);
      await navigator.clipboard.writeText(json);
      toast({
        title: "Copied!",
        description: "JSON configuration copied to clipboard.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy JSON to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-white">Create Simple Task</DialogTitle>
          <DialogDescription className="text-sm text-gray-400">
            Configure a simple task for your workflow with all necessary parameters.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs defaultValue="basic" className="space-y-4 py-4">
            <TabsList className="bg-[#0f1419]">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="inputs">Input Parameters</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="preview">JSON Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Task Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Task Name *</Label>
                    <Input
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      placeholder="e.g., send_email"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Task Reference Name *</Label>
                    <Input
                      value={taskRefName}
                      onChange={(e) => setTaskRefName(e.target.value)}
                      placeholder="e.g., send_email_ref"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                    />
                    <p className="text-xs text-gray-400 mt-1">Unique identifier for referencing this task within the workflow</p>
                  </div>
                  <div>
                    <Label className="text-white">Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what this task does"
                      className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142] min-h-[100px]"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="inputs" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Input Parameters</h3>
                    <p className="text-sm text-gray-400 mt-1">Define inputs and their values</p>
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

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {inputParams.length === 0 ? (
                    <p className="text-sm text-gray-500 italic py-4">No input parameters defined</p>
                  ) : (
                    inputParams.map((param) => (
                      <Card key={param.id} className="p-3 bg-[#1a1f2e] border-[#2a3142]">
                        <div className="space-y-2">
                          <Input
                            value={param.key}
                            onChange={(e) => handleInputParamChange(param.id, "key", e.target.value)}
                            placeholder="Parameter name (e.g., email)"
                            className="bg-[#0f1419] text-white border-[#2a3142] h-8 text-sm"
                          />
                          <div className="flex gap-2">
                            <Textarea
                              value={param.value}
                              onChange={(e) => handleInputParamChange(param.id, "value", e.target.value)}
                              placeholder='Value or reference (e.g., "$workflow.input.email")'
                              className="flex-1 bg-[#0f1419] text-white border-[#2a3142] h-16 text-sm font-mono"
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
                      </Card>
                    ))
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="policies" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Retry & Timeout Policies</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Retry Count</Label>
                    <Input type="number" value={retryCount} onChange={(e) => setRetryCount(Number(e.target.value) || 0)} className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]" min="0" />
                  </div>
                  <div>
                    <Label className="text-white">Retry Logic</Label>
                    <Select value={retryLogic} onValueChange={(value: any) => setRetryLogic(value)}>
                      <SelectTrigger className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectItem value="FIXED">FIXED</SelectItem>
                        <SelectItem value="LINEAR">LINEAR</SelectItem>
                        <SelectItem value="EXPONENTIAL">EXPONENTIAL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Timeout Seconds</Label>
                    <Input type="number" value={timeoutSeconds} onChange={(e) => setTimeoutSeconds(Number(e.target.value) || 0)} className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]" min="0" />
                  </div>
                  <div>
                    <Label className="text-white">Timeout Policy</Label>
                    <Select value={timeoutPolicy} onValueChange={(value: any) => setTimeoutPolicy(value)}>
                      <SelectTrigger className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                        <SelectItem value="TIME_OUT_WF">TIME_OUT_WF</SelectItem>
                        <SelectItem value="TIME_OUT_TASK">TIME_OUT_TASK</SelectItem>
                        <SelectItem value="RETRY">RETRY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <h3 className="text-lg font-semibold text-white mb-4">Advanced Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="optional" checked={optional} onChange={(e) => setOptional(e.target.checked)} className="w-4 h-4 rounded border-[#2a3142]" />
                    <Label htmlFor="optional" className="text-white cursor-pointer">
                      Optional (failure does not cause workflow failure)
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="async" checked={asyncComplete} onChange={(e) => setAsyncComplete(e.target.checked)} className="w-4 h-4 rounded border-[#2a3142]" />
                    <Label htmlFor="async" className="text-white cursor-pointer">
                      Async Complete
                    </Label>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">JSON Preview</h3>
                    <p className="text-sm text-gray-400 mt-1">View and edit the generated JSON configuration</p>
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
                  <Textarea
                    value={jsonEditable || JSON.stringify(getJsonPreview(), null, 2)}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    className="font-mono text-xs bg-[#1a1f2e] text-white border-[#2a3142] min-h-[400px] max-h-[500px] overflow-y-auto"
                    placeholder="JSON will appear here..."
                  />
                  {jsonValidationError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400">
                        <span className="font-semibold">JSON Error:</span> {jsonValidationError}
                      </p>
                    </div>
                  )}
                  {!jsonValidationError && jsonEditable && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-sm text-green-400">
                        <span className="font-semibold">Valid JSON</span>
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="border-t border-[#2a3142] px-6 py-4 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142] hover:text-white">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-cyan-500 text-white hover:bg-cyan-600 font-medium disabled:opacity-50">
            {isLoading ? "Saving..." : "Save Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
