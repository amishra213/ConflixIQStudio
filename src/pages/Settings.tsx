import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { SaveIcon, SettingsIcon, ServerIcon, CheckCircle2Icon, AlertCircleIcon } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

export function Settings() {
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

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

      const response = await fetch(`${proxyServer.proxyEndpoint.replace('/graphql', '')}/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configPayload),
      });

      if (response.ok) {
        setConnectionStatus('success');
        toast({
          title: 'Connection successful',
          description: 'Successfully connected to the proxy server and configured Conductor connection.',
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
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-base text-muted-foreground">Configure your Conductor Studio preferences</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* GraphQL Proxy Server Configuration */}
        <Card className="p-6 bg-card border-border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <ServerIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-foreground">GraphQL Proxy Server</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="proxy-enabled" className="text-foreground">Enable Proxy Server</Label>
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
                  <Label htmlFor="proxy-endpoint" className="text-foreground">Proxy Endpoint</Label>
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
                  <Label htmlFor="proxy-port" className="text-foreground">Proxy Port</Label>
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
                  <Label htmlFor="conductor-server-url" className="text-foreground">Conductor Server URL</Label>
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
                  <Label htmlFor="conductor-server-api-key" className="text-foreground">Conductor API Key (Optional)</Label>
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
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.812 19.026c-2.382.001-3.599-1.166-3.599-3.501V7.002h-1.5v-1.5h1.5v-1.5h1.5v1.5h3.5v1.5h-3.5v7.5c0 .83.333 1.166 1.166 1.166.834 0 1.167-.336 1.167-1.166V7.002h1.5v7.5c0 2.335-1.167 3.501-3.599 3.501z"/>
            </svg>
            <h2 className="text-xl font-semibold text-foreground">OpenAI LLM Configuration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="openai-api-endpoint" className="text-foreground">API Endpoint</Label>
              <Input
                id="openai-api-endpoint"
                value={openAiLlm.apiEndpoint}
                onChange={(e) => setOpenAiApiEndpoint(e.target.value)}
                className="mt-2 bg-background text-foreground border-border"
              />
            </div>
            <div>
              <Label htmlFor="openai-api-key" className="text-foreground">API Key</Label>
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
                <Label htmlFor="notifications" className="text-foreground">Enable Notifications</Label>
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
                <Label htmlFor="auto-save" className="text-foreground">Auto-save Workflows</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically save workflow changes
                </p>
              </div>
              <Switch id="auto-save" checked={autoSaveWorkflows} onCheckedChange={setAutoSaveWorkflows} />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium">
            <SaveIcon className="w-5 h-5 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
