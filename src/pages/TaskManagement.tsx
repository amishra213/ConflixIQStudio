import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useWorkflowStore } from '@/stores/workflowStore';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useConductorApi } from '@/hooks/useConductorApi';

// Config Modals (used in WorkflowDesigner, but imported here for type consistency if needed)
import { HttpTaskModal } from '@/components/modals/system-tasks';

const workerTaskTypes = [
  { id: 'HTTP', name: 'HTTP Task', description: 'Make HTTP API calls', color: '#00bcd4' },
];

export default function Tasks() {
  // Default export
  const { tasks, addTask, deleteTask } = useWorkflowStore();
  const { toast } = useToast();
  const [isTaskTypeSelectOpen, setIsTaskTypeSelectOpen] = useState(false);
  const [isHttpCreateModalOpen, setIsHttpCreateModalOpen] = useState(false);

  const handleTaskTypeSelect = (taskType: string) => {
    setIsTaskTypeSelectOpen(false);
    if (taskType === 'HTTP') {
      setIsHttpCreateModalOpen(true);
    }
  };

  const { createTaskDefinition } = useConductorApi();

  const handleSaveHttpTask = async (config: Record<string, unknown>) => {
    try {
      // Create task definition in Conductor
      const success = await createTaskDefinition(config);
      if (success) {
        addTask({
          id: `task-${Date.now()}`,
          name: (config.name as string) || (config.taskId as string),
          type: 'HTTP',
          description: 'HTTP worker task',
        });
        toast({ title: 'Success', description: 'HTTP task created successfully.' });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create HTTP task. Please check the error details.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error creating HTTP task:', errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    deleteTask(id);
    toast({ title: 'Task deleted', description: `${name} deleted successfully.` });
  };

  return (
    <div className="p-8 space-y-8 bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Tasks</h1>
          <p className="text-base text-muted-foreground">Manage reusable task definitions</p>
        </div>
        <Dialog open={isTaskTypeSelectOpen} onOpenChange={setIsTaskTypeSelectOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 text-foreground hover:bg-cyan-600 shadow-sm font-medium">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Worker Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card text-foreground border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground text-xl">Select Worker Task Type</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              {workerTaskTypes.map((taskType) => (
                <Card
                  key={taskType.id}
                  className="p-4 bg-background border-border cursor-pointer hover:border-cyan-500 transition-all duration-200"
                  onClick={() => handleTaskTypeSelect(taskType.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${taskType.color}20` }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: taskType.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground mb-1">{taskType.name}</h3>
                      <p className="text-xs text-muted-foreground">{taskType.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className="p-6 bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{task.name}</h3>
                <p className="text-sm text-muted-foreground mt-3">{task.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 font-medium">
                  {task.type}
                </Badge>
              </div>
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button
                  size="sm"
                  onClick={() => handleDelete(task.id, task.name)}
                  variant="outline"
                  className="flex-1 text-destructive border-border hover:bg-destructive/10"
                >
                  <Trash2Icon className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Modals */}
      <HttpTaskModal
        open={isHttpCreateModalOpen}
        onOpenChange={setIsHttpCreateModalOpen}
        onSave={handleSaveHttpTask}
      />
    </div>
  );
}

