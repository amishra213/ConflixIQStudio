import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWorkflowStore } from '@/stores/workflowStore';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Config Modals (used in WorkflowDesigner, but imported here for type consistency if needed)
import { GenericTaskConfigModal } from '@/components/modals/GenericTaskConfigModal';
import { HttpTaskModal } from '@/components/modals/HttpTaskModal';
import { MapperTaskModal } from '@/components/modals/MapperTaskModal';
import { WaitForSignalTaskModal } from '@/components/modals/WaitForSignalTaskModal'; // This is a system task config modal
import { ScheduledWaitTaskModal } from '@/components/modals/ScheduledWaitTaskModal'; // This is a worker task config modal

// New Create Modals (used for creating tasks from this page)
import { GenericTaskCreateModal } from '@/components/modals/GenericTaskCreateModal';
import { HttpTaskCreateModal } from '@/components/modals/HttpTaskCreateModal';
import { MapperTaskCreateModal } from '@/components/modals/MapperTaskCreateModal';
import { ScheduledWaitTaskCreateModal } from '@/components/modals/ScheduledWaitTaskCreateModal';


const workerTaskTypes = [
  { id: 'GENERIC', name: 'Generic Task', description: 'Basic task for custom business logic', color: '#00bcd4' },
  { id: 'HTTP', name: 'HTTP Task', description: 'Make HTTP API calls', color: '#00bcd4' },
  { id: 'MAPPER', name: 'Mapper', description: 'Maps input JSON to output JSON', color: '#00bcd4' },
  { id: 'SCHEDULED_WAIT', name: 'Scheduled Wait', description: 'Wait for a scheduled duration', color: '#00bcd4' },
];

export default function Tasks() { // Default export
  const { tasks, addTask, deleteTask } = useWorkflowStore();
  const { toast } = useToast();
  const [isTaskTypeSelectOpen, setIsTaskTypeSelectOpen] = useState(false);

  // State for Create Modals
  const [isGenericCreateModalOpen, setIsGenericCreateModalOpen] = useState(false);
  const [isHttpCreateModalOpen, setIsHttpCreateModalOpen] = useState(false);
  const [isMapperCreateModalOpen, setIsMapperCreateModalOpen] = useState(false);
  const [isScheduledWaitCreateModalOpen, setIsScheduledWaitCreateModalOpen] = useState(false);


  const handleTaskTypeSelect = (taskType: string) => {
    setIsTaskTypeSelectOpen(false);
    switch (taskType) {
      case 'GENERIC': setIsGenericCreateModalOpen(true); break;
      case 'HTTP': setIsHttpCreateModalOpen(true); break;
      case 'MAPPER': setIsMapperCreateModalOpen(true); break;
      case 'SCHEDULED_WAIT': setIsScheduledWaitCreateModalOpen(true); break;
      default: console.warn(`No create modal defined for task type: ${taskType}`); break;
    }
  };

  const handleSaveGenericTask = (config: any) => {
    addTask({ id: `task-${Date.now()}`, name: config.taskId, type: 'GENERIC', description: 'Generic worker task', config });
    toast({ title: 'Task created', description: 'Generic task created successfully.' });
  };

  const handleSaveHttpTask = (config: any) => {
    addTask({ id: `task-${Date.now()}`, name: config.taskId, type: 'HTTP', description: 'HTTP worker task', config });
    toast({ title: 'Task created', description: 'HTTP task created successfully.' });
  };

  const handleSaveMapperTask = (config: any) => {
    addTask({ id: `task-${Date.now()}`, name: config.taskId, type: 'MAPPER', description: 'Mapper worker task', config });
    toast({ title: 'Task created', description: 'Mapper task created successfully.' });
  };

  const handleSaveScheduledWaitTask = (config: any) => {
    addTask({ id: `task-${Date.now()}`, name: config.taskId, type: 'SCHEDULED_WAIT', description: 'Scheduled wait worker task', config });
    toast({ title: 'Task created', description: 'Scheduled wait task created successfully.' });
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
              <PlusIcon className="w-5 h-5 mr-2" />Create Worker Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f2e] text-white border-[#2a3142] max-w-2xl">
            <DialogHeader><DialogTitle className="text-white text-xl">Select Worker Task Type</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              {workerTaskTypes.map((taskType) => (
                <Card key={taskType.id} className="p-4 bg-[#0f1419] border-[#2a3142] cursor-pointer hover:border-cyan-500 transition-all duration-200" onClick={() => handleTaskTypeSelect(taskType.id)}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${taskType.color}20` }}>
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
                <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 font-medium">{task.type}</Badge>
                {task.config && <Badge className="bg-green-500/20 text-green-400 border border-green-500/50 font-medium">Configured</Badge>}
              </div>
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button size="sm" onClick={() => handleDelete(task.id, task.name)} variant="outline" className="flex-1 text-destructive border-border hover:bg-destructive/10">
                  <Trash2Icon className="w-4 h-4 mr-2" />Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Modals */}
      <GenericTaskCreateModal open={isGenericCreateModalOpen} onOpenChange={setIsGenericCreateModalOpen} onSave={handleSaveGenericTask} />
      <HttpTaskCreateModal open={isHttpCreateModalOpen} onOpenChange={setIsHttpCreateModalOpen} onSave={handleSaveHttpTask} />
      <MapperTaskCreateModal open={isMapperCreateModalOpen} onOpenChange={setIsMapperCreateModalOpen} onSave={handleSaveMapperTask} />
      <ScheduledWaitTaskCreateModal open={isScheduledWaitCreateModalOpen} onOpenChange={setIsScheduledWaitCreateModalOpen} onSave={handleSaveScheduledWaitTask} />
    </div>
  );
}
