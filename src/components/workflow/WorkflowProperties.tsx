import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useWorkflowStore } from '@/stores/workflowStore';
import { TrashIcon, PlusIcon } from 'lucide-react';

export default function WorkflowProperties() {
  const { currentWorkflow, updateWorkflow } = useWorkflowStore();
  
  const [orgId, setOrgId] = useState(currentWorkflow?.orgId || '');
  const [workflowId, setWorkflowId] = useState(currentWorkflow?.workflowId || '');
  const [description, setDescription] = useState(currentWorkflow?.description || '');
  const [effectiveDate, setEffectiveDate] = useState(currentWorkflow?.effectiveDate || '');
  const [endDate, setEndDate] = useState(currentWorkflow?.endDate || '');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'DRAFT'>(currentWorkflow?.status || 'DRAFT');
  const [timeoutSeconds, setTimeoutSeconds] = useState(currentWorkflow?.timeoutSeconds || 3600);
  const [restartable, setRestartable] = useState(currentWorkflow?.restartable ?? true);
  const [inputParameters, setInputParameters] = useState<string[]>(currentWorkflow?.inputParameters || []);
  const [outputParameters, setOutputParameters] = useState<Record<string, any>>(currentWorkflow?.outputParameters || {});
  const [newInputParam, setNewInputParam] = useState('');
  const [newOutputKey, setNewOutputKey] = useState('');
  const [newOutputValue, setNewOutputValue] = useState('');

  // Sync with store when currentWorkflow changes
  useEffect(() => {
    if (currentWorkflow) {
      setOrgId(currentWorkflow.orgId || '');
      setWorkflowId(currentWorkflow.workflowId || '');
      setDescription(currentWorkflow.description || '');
      setEffectiveDate(currentWorkflow.effectiveDate || '');
      setEndDate(currentWorkflow.endDate || '');
      setStatus(currentWorkflow.status || 'DRAFT');
      setTimeoutSeconds(currentWorkflow.timeoutSeconds || 3600);
      setRestartable(currentWorkflow.restartable ?? true);
      setInputParameters(currentWorkflow.inputParameters || []);
      setOutputParameters(currentWorkflow.outputParameters || {});
    }
  }, [currentWorkflow]);

  // Update store when values change
  useEffect(() => {
    updateWorkflow({
      orgId,
      workflowId,
      description,
      effectiveDate,
      endDate,
      status,
      timeoutSeconds,
      restartable,
      inputParameters,
      outputParameters,
    });
  }, [orgId, workflowId, description, effectiveDate, endDate, status, timeoutSeconds, restartable, inputParameters, outputParameters, updateWorkflow]);

  const handleAddInputParameter = () => {
    if (newInputParam.trim()) {
      setInputParameters([...inputParameters, newInputParam.trim()]);
      setNewInputParam('');
    }
  };

  const handleRemoveInputParameter = (index: number) => {
    setInputParameters(inputParameters.filter((_, i) => i !== index));
  };

  const handleAddOutputParameter = () => {
    if (newOutputKey.trim() && newOutputValue.trim()) {
      setOutputParameters({
        ...outputParameters,
        [newOutputKey.trim()]: newOutputValue.trim(),
      });
      setNewOutputKey('');
      setNewOutputValue('');
    }
  };

  const handleRemoveOutputParameter = (key: string) => {
    const updated = { ...outputParameters };
    delete updated[key];
    setOutputParameters(updated);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Workflow Identification</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-id" className="text-foreground">Organization ID</Label>
            <Input
              id="org-id"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              placeholder="e.g., TEST_ORG001"
              className="bg-background text-foreground border-border"
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for your organization
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow-id" className="text-foreground">Workflow ID</Label>
            <Input
              id="workflow-id"
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              placeholder="e.g., demo-workflow-sprint-1"
              className="bg-background text-foreground border-border"
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for this workflow
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow-description" className="text-foreground">Description</Label>
            <Textarea
              id="workflow-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Order Create Mapper workflow"
              className="bg-background text-foreground border-border min-h-[100px]"
            />
          </div>
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Workflow Lifecycle</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effective-date" className="text-foreground">Effective Date</Label>
              <Input
                id="effective-date"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="bg-background text-foreground border-border"
              />
              <p className="text-xs text-muted-foreground">
                Date when workflow becomes active
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-foreground">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background text-foreground border-border"
              />
              <p className="text-xs text-muted-foreground">
                Date when workflow expires (optional)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-foreground">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE' | 'DRAFT')}
              className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Current status of the workflow
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeout" className="text-foreground">Timeout (seconds)</Label>
            <Input
              id="timeout"
              type="number"
              value={timeoutSeconds}
              onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 3600)}
              className="bg-background text-foreground border-border"
            />
            <p className="text-xs text-muted-foreground">
              Maximum time allowed for workflow execution
            </p>
          </div>
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Execution Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="restartable" className="text-foreground">Restartable</Label>
              <p className="text-xs text-muted-foreground">
                Allow workflow to be restarted from failed tasks
              </p>
            </div>
            <Switch
              id="restartable"
              checked={restartable}
              onCheckedChange={setRestartable}
            />
          </div>
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Input Parameters</h3>
        <div className="space-y-3">
          {inputParameters.map((param, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={param}
                readOnly
                className="bg-muted text-foreground border-border"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleRemoveInputParameter(index)}
                className="flex-shrink-0 bg-transparent text-destructive border-border hover:bg-destructive/10"
              >
                <TrashIcon className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="Parameter name (e.g., orderId)"
              value={newInputParam}
              onChange={(e) => setNewInputParam(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddInputParameter()}
              className="bg-background text-foreground border-border"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddInputParameter}
              className="flex-shrink-0"
            >
              <PlusIcon className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Define input parameters that can be passed when starting the workflow
          </p>
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Output Parameters</h3>
        <div className="space-y-3">
          {Object.entries(outputParameters).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-center">
              <Input
                value={key}
                readOnly
                className="bg-muted text-foreground border-border"
              />
              <Input
                value={typeof value === 'string' ? value : JSON.stringify(value)}
                readOnly
                className="bg-muted text-foreground border-border"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleRemoveOutputParameter(key)}
                className="flex-shrink-0 bg-transparent text-destructive border-border hover:bg-destructive/10"
              >
                <TrashIcon className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="Output name"
              value={newOutputKey}
              onChange={(e) => setNewOutputKey(e.target.value)}
              className="bg-background text-foreground border-border"
            />
            <Input
              placeholder="JSONPath expression (e.g., $.taskRef.output)"
              value={newOutputValue}
              onChange={(e) => setNewOutputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddOutputParameter()}
              className="bg-background text-foreground border-border"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddOutputParameter}
              className="flex-shrink-0"
            >
              <PlusIcon className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Define output parameters using JSONPath expressions to extract data from task results
          </p>
        </div>
      </div>
    </div>
  );
}
