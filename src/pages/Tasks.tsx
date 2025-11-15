import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWorkflowStore } from '@/stores/workflowStore';
import { PlusIcon, EditIcon, Trash2Icon, SettingsIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DecisionTaskModal } from '@/components/modals/DecisionTaskModal';
import { ConvergeTaskModal } from '@/components/modals/ConvergeTaskModal';
import { GenericTaskConfigModal } from '@/components/modals/GenericTaskConfigModal';
import { HttpTaskModal } from '@/components/modals/HttpTaskModal';
import { MapperTaskModal } from '@/components/modals/MapperTaskModal';
import { WaitForSignalTaskModal } from '@/components/modals/WaitForSignalTaskModal';

const workerTaskTypes = [
  { id: 'GENERIC', name: 'Generic Task', description: 'Basic task for custom business logic', color: '#00bcd4' },
  { id: 'HTTP', name: 'HTTP Task', description: 'Make HTTP API calls', color: '#00bcd4' },
  { id: 'MAPPER', name: 'Mapper', description: 'Maps input JSON to output JSON', color: '#00bcd4' },
  { id: 'WAIT_FOR_SIGNAL', name: 'Signal or Scheduled Wait', description: 'Wait for signal or timeout', color: '#00bcd4' },
];

export function Tasks() {
  const { tasks, addTask, deleteTask } = useWorkflowStore();
  const { toast } = useToast();
  const [isTaskTypeSelectOpen, setIsTaskTypeSelectOpen] = useState(false);
  const [isGenericModalOpen, setIsGenericModalOpen] = useState(false);
  const [isHttpModalOpen, setIsHttpModalOpen] = useState(false);
  const [isMapperModalOpen, setIsMapperModalOpen] = useState(false);
  const [isWaitForSignalModalOpen, setIsWaitForSignalModalOpen] = useState(false);

  const handleTaskTypeSelect = (taskType: string) => {
    setIsTaskTypeSelectOpen(false);
    switch (taskType) {
      case 'GENERIC':
        setIsGenericModalOpen(true);
        break;
      case 'HTTP':
        setIsHttpModalOpen(true);
        break;
      case 'MAPPER':
        setIsMapperModalOpen(true);
        break;
      case 'WAIT_FOR_SIGNAL':
        setIsWaitForSignalModalOpen(true);
        break;
    }
  };

  const handleSaveGenericTask = (config: any) => {
    addTask({
      id: `task-${Date.now()}`,
      name: config.taskId,
      type: 'GENERIC',
      description: 'Generic worker task',
      config: config,
    });
    toast({ title: 'Task created', description: 'Generic task created successfully.' });
  };

  const handleSaveHttpTask = (config: any) => {
    addTask({
      id: `task-${Date.now()}`,
      name: config.taskId,
      type: 'HTTP',
      description: 'HTTP worker task',
      config: config,
    });
    toast({ title: 'Task created', description: 'HTTP task created successfully.' });
  };

  const handleSaveMapperTask = (config: any) => {
    addTask({
      id: `task-${Date.now()}`,
      name: config.taskId,
      type: 'MAPPER',
      description: 'Mapper worker task',
      config: config,
    });
    toast({ title: 'Task created', description: 'Mapper task created successfully.' });
  };

  const handleSaveWaitForSignalTask = (config: any) => {
    addTask({
      id: `task-${Date.now()}`,
      name: config.taskId,
      type: 'WAIT_FOR_SIGNAL',
      description: 'Wait for signal worker task',
      config: config,
    });
    toast({ title: 'Task created', description: 'Wait for signal task created successfully.' });
  };

  const handleDelete = (id: string, name: string) => {
    deleteTask(id);
    toast({ title: 'Task deleted', description: `${name} deleted successfully.` });
  };

  return (
    <div className="p-8 space-y-8 bg-[#0f1419]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Tasks</h1>
          <p className="text-base text-gray-400">Manage reusable task definitions</p>
        </div>
        <Dialog open={isTaskTypeSelectOpen} onOpenChange={setIsTaskTypeSelectOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 text-white hover:bg-cyan-600 shadow-sm font-medium">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Worker Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f2e] text-white border-[#2a3142] max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Select Worker Task Type</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              {workerTaskTypes.map((taskType) => (
                <Card
                  key={taskType.id}
                  className="p-4 bg-[#0f1419] border-[#2a3142] cursor-pointer hover:border-cyan-500 transition-all duration-200"
                  onClick={() => handleTaskTypeSelect(taskType.id)}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${taskType.color}20` }}
                    >
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: taskType.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white mb-1">{taskType.name}</h3>
                      <p className="text-xs text-gray-400">{taskType.description}</p>
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
          <Card key={task.id} className="p-6 bg-[#1a1f2e] border-[#2a3142] shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{task.name}</h3>
                <p className="text-sm text-gray-400 mt-3">{task.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 font-medium">
                  {task.type}
                </Badge>
                {task.config && (
                  <Badge className="bg-green-500/20 text-green-400 border border-green-500/50 font-medium">
                    Configured
                  </Badge>
                )}
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

      <GenericTaskConfigModal
        open={isGenericModalOpen}
        onOpenChange={setIsGenericModalOpen}
        node={null}
        onSave={handleSaveGenericTask}
      />

      <HttpTaskModal
        open={isHttpModalOpen}
        onOpenChange={setIsHttpModalOpen}
        onSave={handleSaveHttpTask}
        initialConfig={null}
      />

      <MapperTaskModal
        open={isMapperModalOpen}
        onOpenChange={setIsMapperModalOpen}
        onSave={handleSaveMapperTask}
        initialConfig={null}
      />

      <WaitForSignalTaskModal
        open={isWaitForSignalModalOpen}
        onOpenChange={setIsWaitForSignalModalOpen}
        onSave={handleSaveWaitForSignalTask}
        initialConfig={null}
      />
    </div>
  );
}
