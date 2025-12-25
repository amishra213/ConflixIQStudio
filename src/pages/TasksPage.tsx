import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore } from '@/stores/workflowStore';
import { PlusIcon, Trash2Icon, ArrowLeftIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useConductorApi } from '@/hooks/useConductorApi';
import { SimpleTaskModal } from '@/components/modals/SimpleTaskModal';

// Define the SimpleTaskDefinition type if not imported from elsewhere
type SimpleTaskDefinition = {
  name: string;
  description?: string;
  // Add other fields as required by your application
};

export function Tasks() {
  const navigate = useNavigate();
  const { tasks, addTask, deleteTask } = useWorkflowStore();
  const { toast } = useToast();
  const { createTaskDefinition } = useConductorApi({ enableFallback: false });
  const [isSimpleTaskModalOpen, setIsSimpleTaskModalOpen] = useState(false);

  const handleSaveSimpleTask = async (config: SimpleTaskDefinition) => {
    try {
      const success = await createTaskDefinition(config);
      if (success) {
        const taskName = config.name;
        addTask({
          id: `task-${Date.now()}`,
          name: taskName,
          type: 'SIMPLE',
          description: config.description || 'Simple task definition',
        });
        toast({
          title: 'Success',
          description: `Task definition "${taskName}" created successfully.`,
        });
      } else {
        toast({
          title: 'Error',
          description:
            'Failed to create task definition. Please check your Conductor API settings.',
        });
      }
    } catch (error) {
      console.error('Error saving task definition:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create task definition.',
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground hover:bg-[#2a3142]"
            title="Back to dashboard"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Tasks</h1>
            <p className="text-base text-muted-foreground">Manage reusable task definitions</p>
          </div>
        </div>
        <Button
          onClick={() => setIsSimpleTaskModalOpen(true)}
          className="bg-cyan-500 text-foreground hover:bg-cyan-600 shadow-sm font-medium"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Task
        </Button>
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
                {task.config && typeof task.config === 'object' ? (
                  <Badge className="bg-green-500/20 text-green-400 border border-green-500/50 font-medium">
                    Configured
                  </Badge>
                ) : null}
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

      <SimpleTaskModal
        open={isSimpleTaskModalOpen}
        onOpenChange={setIsSimpleTaskModalOpen}
        onSave={handleSaveSimpleTask}
      />
    </div>
  );
}

