import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  SaveIcon,
  SettingsIcon,
  ServerIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Trash2Icon as TrashIcon,
  ArrowLeftIcon,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkflowStore } from '@/stores/workflowStore';

interface WorkflowHeaderSettings {
  createdBy: string;
  updatedBy: string;
  ownerEmail: string;
  ownerApp: string;
  timeoutSeconds: number;
  timeoutPolicy: 'TIME_OUT_WF' | 'ALERT_ONLY';
  workflowStatusListenerEnabled: boolean;
  restartable: boolean;
  failureWorkflow: string;
  accessPolicy: Record<string, unknown>;
  variables: Record<string, unknown>;
}

export function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    proxyServer,
    openAiLlm,
    enableNotifications,
    autoSaveWorkflows,
    setProxyServerEnabled,
    setProxyEndpoint,
    setConductorServerUrl,
    setConductorServerApiKey,
    setProxyPort,
    setOpenAiApiEndpoint,
    setOpenAiApiKey,
    setEnableNotifications,
    setAutoSaveWorkflows,
  } = useSettingsStore();
  const { selectedWorkflow, updateWorkflow } = useWorkflowStore();

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Initialize workflow settings from selected workflow
  const initialSettings = useMemo(
    () => ({
      createdBy: selectedWorkflow?.createdBy || 'ConflixIQ Studio',
      updatedBy: selectedWorkflow?.updatedBy || 'ConflixIQ Studio',
      ownerEmail: selectedWorkflow?.ownerEmail || '',
      ownerApp: selectedWorkflow?.ownerApp || '',
      timeoutSeconds: selectedWorkflow?.timeoutSeconds || 3600,
      timeoutPolicy:
        (selectedWorkflow?.timeoutPolicy as 'TIME_OUT_WF' | 'ALERT_ONLY') || 'TIME_OUT_WF',
      workflowStatusListenerEnabled: selectedWorkflow?.workflowStatusListenerEnabled || false,
      restartable: selectedWorkflow?.restartable || true,
      failureWorkflow: selectedWorkflow?.failureWorkflow || '',
      accessPolicy: selectedWorkflow?.accessPolicy || {},
      variables: selectedWorkflow?.variables || {},
    }),
    [selectedWorkflow]
  );

  const [workflowSettings, setWorkflowSettings] = useState<WorkflowHeaderSettings>(initialSettings);
  const [policyKey, setPolicyKey] = useState('');
  const [policyValue, setPolicyValue] = useState('');
  const [variableKey, setVariableKey] = useState('');
  const [variableValue, setVariableValue] = useState('');

  const handleAddAccessPolicy = () => {
    if (policyKey.trim()) {
      setWorkflowSettings({
        ...workflowSettings,
        accessPolicy: {
          ...workflowSettings.accessPolicy,
          [policyKey]: policyValue,
        },
      });
      setPolicyKey('');
      setPolicyValue('');
    }
  };

  const handleRemoveAccessPolicy = (key: string) => {
    const newPolicy = { ...workflowSettings.accessPolicy };
    delete newPolicy[key];
    setWorkflowSettings({
      ...workflowSettings,
      accessPolicy: newPolicy,
    });
  };

  const handleAddVariable = () => {
    if (variableKey.trim()) {
      setWorkflowSettings({
        ...workflowSettings,
        variables: {
          ...workflowSettings.variables,
          [variableKey]: variableValue,
        },
      });
      setVariableKey('');
      setVariableValue('');
    }
  };

  const handleRemoveVariable = (key: string) => {
    const newVariables = { ...workflowSettings.variables };
    delete newVariables[key];
    setWorkflowSettings({
      ...workflowSettings,
      variables: newVariables,
    });
  };

  const handleSaveWorkflowSettings = () => {
    if (!selectedWorkflow) {
      toast({
        title: 'No workflow selected',
        description: 'Please select a workflow to save settings',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date().toISOString();
    updateWorkflow(selectedWorkflow.id, {
      ...workflowSettings,
      updateTime: now,
      updatedBy: 'ConflixIQ Studio',
    });

    toast({
      title: 'Workflow settings saved',
      description: 'Your workflow header settings have been saved successfully.',
    });
  };

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your settings have been saved successfully.',
    });
  };

  const handleTestProxyConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      // Test the proxy server configuration endpoint
      const configPayload = {
        conductorServerUrl: proxyServer.conductorServerUrl,
        conductorApiKey: proxyServer.conductorApiKey,
      };

      const response = await fetch(
        `${proxyServer.proxyEndpoint.replace('/graphql', '')}/api/config`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(configPayload),
        }
      );

      if (response.ok) {
        setConnectionStatus('success');
        toast({
          title: 'Connection successful',
          description:
            'Successfully connected to the proxy server and configured Conductor connection.',
        });
      } else {
        setConnectionStatus('error');
        const errorData = await response.json();
        toast({
          title: 'Connection failed',
          description: errorData.error || 'Failed to configure proxy server',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: 'Connection error',
        description: error instanceof Error ? error.message : 'Failed to connect to proxy server',
        variant: 'destructive',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-background">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white hover:bg-[#2a3142]"
          title="Back to dashboard"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-base text-muted-foreground">
            Configure your Conductor Studio preferences
          </p>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Workflow Header Settings */}
        {selectedWorkflow && (
          <Card className="p-6 bg-card border-border shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <SettingsIcon className="w-5 h-5 text-green-500" />
              <h2 className="text-xl font-semibold text-foreground">
                Workflow Header Configuration
              </h2>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="created-by" className="text-foreground">
                      Created By (Default: ConflixIQ Studio)
                    </Label>
                    <Input
                      id="created-by"
                      value={workflowSettings.createdBy}
                      onChange={(e) =>
                        setWorkflowSettings({ ...workflowSettings, createdBy: e.target.value })
                      }
                      className="mt-2 bg-background text-foreground border-border"
                      placeholder="ConflixIQ Studio"
                    />
                  </div>
                  <div>
                    <Label htmlFor="updated-by" className="text-foreground">
                      Updated By (Default: ConflixIQ Studio)
                    </Label>
                    <Input
                      id="updated-by"
                      value={workflowSettings.updatedBy}
                      onChange={(e) =>
                        setWorkflowSettings({ ...workflowSettings, updatedBy: e.target.value })
                      }
                      className="mt-2 bg-background text-foreground border-border"
                      placeholder="ConflixIQ Studio"
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-email" className="text-foreground">
                      Owner Email
                    </Label>
                    <Input
                      id="owner-email"
                      type="email"
                      value={workflowSettings.ownerEmail}
                      onChange={(e) =>
                        setWorkflowSettings({ ...workflowSettings, ownerEmail: e.target.value })
                      }
                      className="mt-2 bg-background text-foreground border-border"
                      placeholder="dev-team@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-app" className="text-foreground">
                      Owner Application
                    </Label>
                    <Input
                      id="owner-app"
                      value={workflowSettings.ownerApp}
                      onChange={(e) =>
                        setWorkflowSettings({ ...workflowSettings, ownerApp: e.target.value })
                      }
                      className="mt-2 bg-background text-foreground border-border"
                      placeholder="data_service_api"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Timeout Configuration */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Timeout Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeout-seconds" className="text-foreground">
                      Timeout (Seconds)
                    </Label>
                    <Input
                      id="timeout-seconds"
                      type="number"
                      value={workflowSettings.timeoutSeconds}
                      onChange={(e) =>
                        setWorkflowSettings({
                          ...workflowSettings,
                          timeoutSeconds: Number.parseInt(e.target.value, 10),
                        })
                      }
                      className="mt-2 bg-background text-foreground border-border"
                      placeholder="3600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeout-policy" className="text-foreground">
                      Timeout Policy
                    </Label>
                    <select
                      id="timeout-policy"
                      value={workflowSettings.timeoutPolicy}
                      onChange={(e) =>
                        setWorkflowSettings({
                          ...workflowSettings,
                          timeoutPolicy: e.target.value as 'TIME_OUT_WF' | 'ALERT_ONLY',
                        })
                      }
                      className="mt-2 w-full px-3 py-2 bg-background text-foreground border border-border rounded-md"
                    >
                      <option value="TIME_OUT_WF">TIME_OUT_WF</option>
                      <option value="ALERT_ONLY">ALERT_ONLY</option>
                    </select>
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Workflow Behavior */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Workflow Behavior</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground">Restartable</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Allow this workflow to be restarted
                      </p>
                    </div>
                    <Switch
                      checked={workflowSettings.restartable}
                      onCheckedChange={(checked) =>
                        setWorkflowSettings({ ...workflowSettings, restartable: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground">Workflow Status Listener Enabled</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Enable status listener for this workflow
                      </p>
                    </div>
                    <Switch
                      checked={workflowSettings.workflowStatusListenerEnabled}
                      onCheckedChange={(checked) =>
                        setWorkflowSettings({
                          ...workflowSettings,
                          workflowStatusListenerEnabled: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Failure Workflow */}
              <div>
                <Label htmlFor="failure-workflow" className="text-foreground">
                  Failure/Compensation Workflow
                </Label>
                <Input
                  id="failure-workflow"
                  value={workflowSettings.failureWorkflow}
                  onChange={(e) =>
                    setWorkflowSettings({ ...workflowSettings, failureWorkflow: e.target.value })
                  }
                  className="mt-2 bg-background text-foreground border-border"
                  placeholder="compensation_workflow_v1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Optional workflow to execute on failure
                </p>
              </div>

              <Separator className="bg-border" />

              {/* Access Policy */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Access Policy</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="policy-key" className="text-foreground text-sm">
                        Policy Key
                      </Label>
                      <Input
                        id="policy-key"
                        value={policyKey}
                        onChange={(e) => setPolicyKey(e.target.value)}
                        placeholder="e.g., additionalProp1"
                        className="mt-1 bg-background text-foreground border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="policy-value" className="text-foreground text-sm">
                        Policy Value
                      </Label>
                      <Input
                        id="policy-value"
                        value={policyValue}
                        onChange={(e) => setPolicyValue(e.target.value)}
                        placeholder="e.g., read_group_a"
                        className="mt-1 bg-background text-foreground border-border"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddAccessPolicy} variant="outline" className="w-full">
                        Add Policy
                      </Button>
                    </div>
                  </div>

                  {Object.entries(workflowSettings.accessPolicy).length > 0 && (
                    <div className="border border-border rounded-md p-3 space-y-2">
                      {Object.entries(workflowSettings.accessPolicy).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between bg-background p-2 rounded"
                        >
                          <div className="text-sm">
                            <span className="font-semibold text-foreground">{key}:</span>
                            <span className="text-muted-foreground ml-2">{String(value)}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveAccessPolicy(key)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Variables */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Workflow Variables</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="variable-key" className="text-foreground text-sm">
                        Variable Name
                      </Label>
                      <Input
                        id="variable-key"
                        value={variableKey}
                        onChange={(e) => setVariableKey(e.target.value)}
                        placeholder="e.g., run_count"
                        className="mt-1 bg-background text-foreground border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="variable-value" className="text-foreground text-sm">
                        Variable Value
                      </Label>
                      <Input
                        id="variable-value"
                        value={variableValue}
                        onChange={(e) => setVariableValue(e.target.value)}
                        placeholder="e.g., 1"
                        className="mt-1 bg-background text-foreground border-border"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddVariable} variant="outline" className="w-full">
                        Add Variable
                      </Button>
                    </div>
                  </div>

                  {Object.entries(workflowSettings.variables).length > 0 && (
                    <div className="border border-border rounded-md p-3 space-y-2">
                      {Object.entries(workflowSettings.variables).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between bg-background p-2 rounded"
                        >
                          <div className="text-sm">
                            <span className="font-semibold text-foreground">{key}:</span>
                            <span className="text-muted-foreground ml-2">{String(value)}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveVariable(key)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveWorkflowSettings}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium"
                >
                  <SaveIcon className="w-5 h-5 mr-2" />
                  Save Workflow Settings
                </Button>
              </div>
            </div>
          </Card>
        )}
        <Card className="p-6 bg-card border-border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <ServerIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-foreground">GraphQL Proxy Server</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="proxy-enabled" className="text-foreground">
                  Enable Proxy Server
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Use proxy server to bypass CORS issues
                </p>
              </div>
              <Switch
                id="proxy-enabled"
                checked={proxyServer.enabled}
                onCheckedChange={setProxyServerEnabled}
              />
            </div>
            {proxyServer.enabled && (
              <>
                <Separator className="bg-border" />
                <div>
                  <Label htmlFor="proxy-endpoint" className="text-foreground">
                    Proxy Endpoint
                  </Label>
                  <Input
                    id="proxy-endpoint"
                    value={proxyServer.proxyEndpoint}
                    onChange={(e) => setProxyEndpoint(e.target.value)}
                    placeholder="http://localhost:4000/graphql"
                    className="mt-2 bg-background text-foreground border-border"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    GraphQL endpoint of your proxy server
                  </p>
                </div>
                <div>
                  <Label htmlFor="proxy-port" className="text-foreground">
                    Proxy Port
                  </Label>
                  <Input
                    id="proxy-port"
                    type="number"
                    value={proxyServer.proxyPort || 4000}
                    onChange={(e) => setProxyPort(Number.parseInt(e.target.value, 10) || 4000)}
                    className="mt-2 bg-background text-foreground border-border"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Port on which proxy server is running
                  </p>
                </div>
                <Separator className="bg-border" />
                <div>
                  <Label htmlFor="conductor-server-url" className="text-foreground">
                    Conductor Server URL
                  </Label>
                  <Input
                    id="conductor-server-url"
                    value={proxyServer.conductorServerUrl}
                    onChange={(e) => setConductorServerUrl(e.target.value)}
                    placeholder="http://localhost:8080"
                    className="mt-2 bg-background text-foreground border-border"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Conductor server URL (used by proxy to connect)
                  </p>
                </div>
                <div>
                  <Label htmlFor="conductor-server-api-key" className="text-foreground">
                    Conductor API Key (Optional)
                  </Label>
                  <Input
                    id="conductor-server-api-key"
                    type="password"
                    value={proxyServer.conductorApiKey}
                    onChange={(e) => setConductorServerApiKey(e.target.value)}
                    placeholder="Enter Conductor API key if required"
                    className="mt-2 bg-background text-foreground border-border"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    API key for Conductor server authentication
                  </p>
                </div>
                <Separator className="bg-border" />
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleTestProxyConnection}
                    disabled={testingConnection}
                    variant="outline"
                    className="flex-1"
                  >
                    {testingConnection ? 'Testing...' : 'Test Connection'}
                  </Button>
                  {connectionStatus === 'success' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  )}
                  {connectionStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircleIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">Failed</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* OpenAI LLM Configuration */}
        <Card className="p-6 bg-card border-border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.812 19.026c-2.382.001-3.599-1.166-3.599-3.501V7.002h-1.5v-1.5h1.5v-1.5h1.5v1.5h3.5v1.5h-3.5v7.5c0 .83.333 1.166 1.166 1.166.834 0 1.167-.336 1.167-1.166V7.002h1.5v7.5c0 2.335-1.167 3.501-3.599 3.501z" />
            </svg>
            <h2 className="text-xl font-semibold text-foreground">OpenAI LLM Configuration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="openai-api-endpoint" className="text-foreground">
                API Endpoint
              </Label>
              <Input
                id="openai-api-endpoint"
                value={openAiLlm.apiEndpoint}
                onChange={(e) => setOpenAiApiEndpoint(e.target.value)}
                className="mt-2 bg-background text-foreground border-border"
              />
            </div>
            <div>
              <Label htmlFor="openai-api-key" className="text-foreground">
                API Key
              </Label>
              <Input
                id="openai-api-key"
                type="password"
                value={openAiLlm.apiKey}
                onChange={(e) => setOpenAiApiKey(e.target.value)}
                placeholder="Enter your OpenAI API key"
                className="mt-2 bg-background text-foreground border-border"
              />
            </div>
          </div>
        </Card>

        {/* General Preferences */}
        <Card className="p-6 bg-card border-border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">General Preferences</h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications" className="text-foreground">
                  Enable Notifications
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive notifications for workflow executions
                </p>
              </div>
              <Switch
                id="notifications"
                checked={enableNotifications}
                onCheckedChange={setEnableNotifications}
              />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-save" className="text-foreground">
                  Auto-save Workflows
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically save workflow changes
                </p>
              </div>
              <Switch
                id="auto-save"
                checked={autoSaveWorkflows}
                onCheckedChange={setAutoSaveWorkflows}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium"
          >
            <SaveIcon className="w-5 h-5 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
