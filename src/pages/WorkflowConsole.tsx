import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlusIcon, PlayIcon, SaveIcon, TrashIcon, SettingsIcon } from 'lucide-react';
import WorkflowCanvas from '../components/workflow/WorkflowCanvas';
import TaskLibrary from '../components/workflow/TaskLibrary';
import WorkflowProperties from '../components/workflow/WorkflowProperties';
import WorkflowSummary from '../components/workflow/WorkflowSummary';
import EditableJsonView from '../components/workflow/EditableJsonView';
import { useWorkflowStore } from '../stores/workflowStore';
import { useToast } from '@/hooks/use-toast';

export default function WorkflowConsole() {
  const { toast } = useToast();
  const { currentWorkflow, saveWorkflow, executeWorkflow, canvasNodes } = useWorkflowStore();
  const [activeTab, setActiveTab] = useState('design');

  const handleSave = () => {
    saveWorkflow();
    toast({
      title: 'Workflow Saved',
      description: `Workflow "${currentWorkflow?.name}" has been saved successfully.`,
    });
  };

  const handleExecute = () => {
    if (canvasNodes.length === 0) {
      toast({
        title: 'Cannot Execute',
        description: 'Please add tasks to the workflow before executing.',
        variant: 'destructive',
      });
      return;
    }
    executeWorkflow();
    toast({
      title: 'Workflow Executed',
      description: `Workflow "${currentWorkflow?.name}" has been queued for execution.`,
    });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className="w-80 flex-shrink-0">
        <Card className="h-full border-border bg-card flex flex-col">
          <CardHeader className="pb-4 flex-shrink-0">
            <CardTitle className="font-heading text-lg text-foreground">Task Library</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <TaskLibrary />
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Workflow Name"
                  value={currentWorkflow?.name || ''}
                  onChange={(e) => {
                    const { updateWorkflow } = useWorkflowStore.getState();
                    updateWorkflow({ name: e.target.value });
                  }}
                  className="w-64 bg-background text-foreground border-border"
                />
                <Badge variant="outline" className="text-muted-foreground">
                  v{currentWorkflow?.version || 1}
                </Badge>
                {currentWorkflow?.status && (
                  <Badge 
                    variant="outline" 
                    className={
                      currentWorkflow.status === 'ACTIVE' 
                        ? 'bg-success/10 text-success border-success/20'
                        : currentWorkflow.status === 'DRAFT'
                        ? 'bg-warning/10 text-warning border-warning/20'
                        : 'bg-muted text-muted-foreground'
                    }
                  >
                    {currentWorkflow.status}
                  </Badge>
                )}
                {canvasNodes.length > 0 && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                    {canvasNodes.length} {canvasNodes.length === 1 ? 'task' : 'tasks'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  className="bg-transparent text-foreground border-border hover:bg-accent"
                >
                  <SaveIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Save
                </Button>
                <Button
                  size="sm"
                  onClick={handleExecute}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <PlayIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Execute
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="flex-1 border-border bg-card overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <CardHeader className="pb-0">
              <TabsList className="bg-muted">
                <TabsTrigger
                  value="design"
                  className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Design
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Summary
                </TabsTrigger>
                <TabsTrigger
                  value="json"
                  className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  JSON Definition
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Settings
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
              <TabsContent value="design" className="h-full m-0 p-6">
                <WorkflowCanvas />
              </TabsContent>

              <TabsContent value="summary" className="h-full m-0 p-6">
                <ScrollArea className="h-full">
                  <WorkflowSummary />
                </ScrollArea>
              </TabsContent>

          <TabsContent value="json" className="h-full m-0 p-6">
            <EditableJsonView />
          </TabsContent>

              <TabsContent value="settings" className="h-full m-0 p-6">
                <ScrollArea className="h-full">
                  <WorkflowProperties />
                </ScrollArea>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
