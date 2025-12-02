import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useWorkflowStore } from '@/stores/workflowStore';
import { TrashIcon, PlusIcon } from 'lucide-react';

type TimeoutPolicy = 'TIME_OUT_WF' | 'ALERT_ONLY';

export default function WorkflowProperties() {
  const { selectedWorkflow: currentWorkflow, updateWorkflow } = useWorkflowStore();

  const [name, setName] = useState(currentWorkflow?.name || '');
  const [description, setDescription] = useState(currentWorkflow?.description || '');
  const [version, setVersion] = useState(currentWorkflow?.version || 1);
  const [schemaVersion] = useState(2);
  const [ownerEmail, setOwnerEmail] = useState(currentWorkflow?.ownerEmail || '');
  const [restartable, setRestartable] = useState(currentWorkflow?.restartable ?? true);
  const [timeoutSeconds, setTimeoutSeconds] = useState(currentWorkflow?.timeoutSeconds || 0);
  const [timeoutPolicy, setTimeoutPolicy] = useState<TimeoutPolicy>(
    currentWorkflow?.timeoutPolicy || 'TIME_OUT_WF'
  );
  const [workflowStatusListenerEnabled, setWorkflowStatusListenerEnabled] = useState(
    currentWorkflow?.workflowStatusListenerEnabled ?? false
  );
  const [failureWorkflow, setFailureWorkflow] = useState(currentWorkflow?.failureWorkflow || '');
  const [inputParameters, setInputParameters] = useState<string[]>(
    currentWorkflow?.inputParameters || []
  );
  const [outputParameters, setOutputParameters] = useState<Record<string, unknown>>(
    currentWorkflow?.outputParameters || {}
  );
  const [inputTemplate, setInputTemplate] = useState<Record<string, unknown>>(
    currentWorkflow?.inputTemplate || {}
  );
  const [newInputParam, setNewInputParam] = useState('');
  const [newOutputKey, setNewOutputKey] = useState('');
  const [newOutputValue, setNewOutputValue] = useState('');
  const [newInputTemplateKey, setNewInputTemplateKey] = useState('');
  const [newInputTemplateValue, setNewInputTemplateValue] = useState('');

  useEffect(() => {
    if (currentWorkflow) {
      setName(currentWorkflow.name || '');
      setDescription(currentWorkflow.description || '');
      setVersion(currentWorkflow.version || 1);
      setOwnerEmail(currentWorkflow.ownerEmail || '');
      setRestartable(currentWorkflow.restartable ?? true);
      setTimeoutSeconds(currentWorkflow.timeoutSeconds || 0);
      setTimeoutPolicy(currentWorkflow.timeoutPolicy || 'TIME_OUT_WF');
      setWorkflowStatusListenerEnabled(currentWorkflow.workflowStatusListenerEnabled ?? false);
      setFailureWorkflow(currentWorkflow.failureWorkflow || '');
      setInputParameters(currentWorkflow.inputParameters || []);
      setOutputParameters(currentWorkflow.outputParameters || {});
      setInputTemplate(currentWorkflow.inputTemplate || {});
    }
  }, [currentWorkflow]);

  useEffect(() => {
    if (currentWorkflow?.id) {
      updateWorkflow(currentWorkflow.id, {
        name,
        description,
        version,
        schemaVersion,
        ownerEmail,
        restartable,
        timeoutSeconds,
        timeoutPolicy,
        workflowStatusListenerEnabled,
        failureWorkflow,
        inputParameters,
        outputParameters,
        inputTemplate,
      });
    }
  }, [
    name,
    description,
    version,
    schemaVersion,
    ownerEmail,
    restartable,
    timeoutSeconds,
    timeoutPolicy,
    workflowStatusListenerEnabled,
    failureWorkflow,
    inputParameters,
    outputParameters,
    inputTemplate,
    updateWorkflow,
    currentWorkflow?.id,
  ]);

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
      setOutputParameters({ ...outputParameters, [newOutputKey.trim()]: newOutputValue.trim() });
      setNewOutputKey('');
      setNewOutputValue('');
    }
  };

  const handleRemoveOutputParameter = (key: string) => {
    const updated = { ...outputParameters };
    delete updated[key];
    setOutputParameters(updated);
  };

  const handleAddInputTemplate = () => {
    if (newInputTemplateKey.trim() && newInputTemplateValue.trim()) {
      setInputTemplate({
        ...inputTemplate,
        [newInputTemplateKey.trim()]: newInputTemplateValue.trim(),
      });
      setNewInputTemplateKey('');
      setNewInputTemplateValue('');
    }
  };

  const handleRemoveInputTemplate = (key: string) => {
    const updated = { ...inputTemplate };
    delete updated[key];
    setInputTemplate(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
          Workflow Identification
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              Workflow Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., encode_workflow, mail_a_box"
              className="bg-background text-foreground border-border"
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for the workflow (required)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Order Create Mapper workflow, Video encoding workflow"
              className="bg-background text-foreground border-border min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version" className="text-foreground">
                Version
              </Label>
              <Input
                id="version"
                type="number"
                value={version}
                onChange={(e) => setVersion(Number.parseInt(e.target.value) || 1)}
                min="1"
                className="bg-background text-foreground border-border"
              />
              <p className="text-xs text-muted-foreground">
                Incrementing version; highest used if omitted
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schema-version" className="text-foreground">
                Schema Version
              </Label>
              <Input
                id="schema-version"
                type="number"
                value={schemaVersion}
                disabled
                className="bg-muted text-foreground border-border"
              />
              <p className="text-xs text-muted-foreground">Must be 2 (OSS Conductor spec)</p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
          Owner Information
        </h3>
        <div className="space-y-2">
          <Label htmlFor="owner-email" className="text-foreground">
            Owner Email *
          </Label>
          <Input
            id="owner-email"
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            placeholder="e.g., conductor@example.com"
            className="bg-background text-foreground border-border"
          />
          <p className="text-xs text-muted-foreground">
            Contact email for workflow ownership and notifications (required)
          </p>
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
          Execution Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="restartable" className="text-foreground">
                Restartable
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow workflow to be restarted from failed tasks (defaults to true)
              </p>
            </div>
            <Switch id="restartable" checked={restartable} onCheckedChange={setRestartable} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeout-seconds" className="text-foreground">
                Timeout (seconds)
              </Label>
              <Input
                id="timeout-seconds"
                type="number"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(Number.parseInt(e.target.value) || 0)}
                min="0"
                className="bg-background text-foreground border-border"
              />
              <p className="text-xs text-muted-foreground">0 = no timeout</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout-policy" className="text-foreground">
                Timeout Policy
              </Label>
              <select
                id="timeout-policy"
                value={timeoutPolicy}
                onChange={(e) => setTimeoutPolicy(e.target.value as TimeoutPolicy)}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="TIME_OUT_WF">TIME_OUT_WF - Mark & terminate</option>
                <option value="ALERT_ONLY">ALERT_ONLY - Register counter only</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Action on timeout (defaults to TIME_OUT_WF)
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
          Failure Handling
        </h3>
        <div className="space-y-2">
          <Label htmlFor="failure-workflow" className="text-foreground">
            Failure Workflow
          </Label>
          <Input
            id="failure-workflow"
            value={failureWorkflow}
            onChange={(e) => setFailureWorkflow(e.target.value)}
            placeholder="e.g., shipping_issues, error_handler"
            className="bg-background text-foreground border-border"
          />
          <p className="text-xs text-muted-foreground">
            Workflow to execute on failure. Receives: original input + workflowId, reason,
            failureStatus, failureTaskId
          </p>
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Status Listener</h3>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="status-listener" className="text-foreground">
              Workflow Status Listener Enabled
            </Label>
            <p className="text-xs text-muted-foreground">
              Send notifications or events on workflow status changes (defaults to false)
            </p>
          </div>
          <Switch
            id="status-listener"
            checked={workflowStatusListenerEnabled}
            onCheckedChange={setWorkflowStatusListenerEnabled}
          />
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
          Input Parameters
        </h3>
        <div className="space-y-3">
          {inputParameters.length > 0 &&
            inputParameters.map((param) => (
              <div key={`input-${param}`} className="flex gap-2 items-center">
                <Input value={param} readOnly className="bg-muted text-foreground border-border" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveInputParameter(inputParameters.indexOf(param))}
                  className="flex-shrink-0 bg-transparent text-destructive border-border hover:bg-destructive/10"
                >
                  <TrashIcon className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </div>
            ))}
          <div className="flex gap-2">
            <Input
              placeholder="Parameter name (e.g., movieId, recipe)"
              value={newInputParam}
              onChange={(e) => setNewInputParam(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddInputParameter()}
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
            Documents required inputs. Passed when starting the workflow. Usage: $
            {'${workflow.input.paramName}'}
          </p>
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
          Input Template (Defaults)
        </h3>
        <div className="space-y-3">
          {Object.entries(inputTemplate).map(([key, value]) => (
            <div key={`template-${key}`} className="flex gap-2 items-center">
              <Input value={key} readOnly className="bg-muted text-foreground border-border" />
              <Input
                value={typeof value === 'string' ? value : JSON.stringify(value)}
                readOnly
                className="bg-muted text-foreground border-border"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleRemoveInputTemplate(key)}
                className="flex-shrink-0 bg-transparent text-destructive border-border hover:bg-destructive/10"
              >
                <TrashIcon className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="Key (e.g., url, apiKey)"
              value={newInputTemplateKey}
              onChange={(e) => setNewInputTemplateKey(e.target.value)}
              className="bg-background text-foreground border-border"
            />
            <Input
              placeholder="Default value (e.g., https://some_url:7004)"
              value={newInputTemplateValue}
              onChange={(e) => setNewInputTemplateValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddInputTemplate()}
              className="bg-background text-foreground border-border"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddInputTemplate}
              className="flex-shrink-0"
            >
              <PlusIcon className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Default values that override only when not provided at runtime
          </p>
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
          Output Parameters
        </h3>
        <div className="space-y-3">
          {Object.entries(outputParameters).map(([key, value]) => (
            <div key={`output-${key}`} className="flex gap-2 items-center">
              <Input value={key} readOnly className="bg-muted text-foreground border-border" />
              <Input
                value={typeof value === 'string' ? value : JSON.stringify(value)}
                readOnly
                className="bg-muted text-foreground border-border flex-1"
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
              placeholder="Output name (e.g., trackingNumber, orderId)"
              value={newOutputKey}
              onChange={(e) => setNewOutputKey(e.target.value)}
              className="bg-background text-foreground border-border"
            />
            <Input
              placeholder="JSONPath expression (e.g., $.taskRef.output, $.shipping_task_ref.output.trackingNumber)"
              value={newOutputValue}
              onChange={(e) => setNewOutputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddOutputParameter()}
              className="bg-background text-foreground border-border flex-1"
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
            Output template using JSONPath expressions. If omitted, the last task output is used as
            workflow output.
          </p>
        </div>
      </div>
    </div>
  );
}
