import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  SearchIcon,
  BoxIcon,
  GitBranchIcon,
  TimerIcon,
  DatabaseIcon,
  WebhookIcon,
  MailIcon,
  FunctionSquareIcon,
  ClockIcon,
  XCircleIcon,
  RepeatIcon,
  ZapIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  name: string;
  type: 'system' | 'user';
  category: string;
  icon: React.ElementType;
  description: string;
}

const systemTasks: Task[] = [
  {
    id: 'HTTP',
    name: 'HTTP Task',
    type: 'system',
    category: 'Integration',
    icon: WebhookIcon,
    description: 'Make HTTP API calls',
  },
  {
    id: 'FORK_AND_CONVERGE',
    name: 'Fork and Converge',
    type: 'system',
    category: 'Control',
    icon: GitBranchIcon,
    description: 'Execute tasks in parallel and wait for all branches to complete',
  },
  {
    id: 'DECISION',
    name: 'Decision',
    type: 'system',
    category: 'Control',
    icon: GitBranchIcon,
    description: 'Conditional branching logic',
  },
  {
    id: 'DO_WHILE',
    name: 'Do While',
    type: 'system',
    category: 'Control',
    icon: RepeatIcon,
    description: 'Loop until condition is met',
  },
  {
    id: 'DYNAMIC',
    name: 'Dynamic',
    type: 'system',
    category: 'Control',
    icon: ZapIcon,
    description: 'Execute a task determined dynamically at runtime',
  },
  {
    id: 'MAPPER',
    name: 'Mapper',
    type: 'system',
    category: 'Advanced',
    icon: FunctionSquareIcon,
    description: 'Maps input JSON to output JSON',
  },
  {
    id: 'SIGNAL',
    name: 'Signal',
    type: 'system',
    category: 'Integration',
    icon: WebhookIcon,
    description: 'Send signals to unblock waiting tasks in workflows',
  },
  {
    id: 'SIGNAL_WAIT',
    name: 'Signal Wait',
    type: 'system',
    category: 'Control',
    icon: WebhookIcon,
    description: 'Wait for a signal before proceeding',
  },
  {
    id: 'SIGNAL_OR_SCHEDULED_WAIT',
    name: 'Signal or Scheduled Wait',
    type: 'system',
    category: 'Control',
    icon: TimerIcon,
    description: 'Wait for signal or timeout, whichever comes first',
  },
  {
    id: 'SCHEDULED_WAIT',
    name: 'Scheduled Wait',
    type: 'system',
    category: 'Control',
    icon: ClockIcon,
    description: 'Wait for a specified duration before continuing',
  },
  {
    id: 'LAMBDA',
    name: 'Lambda',
    type: 'system',
    category: 'Advanced',
    icon: FunctionSquareIcon,
    description: 'Execute inline JavaScript expressions',
  },
  {
    id: 'PASS_THROUGH',
    name: 'Pass Through',
    type: 'system',
    category: 'Basic',
    icon: BoxIcon,
    description: 'Pass input directly to output without modification',
  },
  {
    id: 'TERMINATE',
    name: 'Terminate',
    type: 'system',
    category: 'Control',
    icon: XCircleIcon,
    description: 'Terminate workflow execution',
  },
];

const userTasks: Task[] = [
  {
    id: 'SEND_EMAIL',
    name: 'Send Email',
    type: 'user',
    category: 'Communication',
    icon: MailIcon,
    description: 'Send email notification',
  },
  {
    id: 'PROCESS_DATA',
    name: 'Process Data',
    type: 'user',
    category: 'Data',
    icon: DatabaseIcon,
    description: 'Custom data processing task',
  },
  {
    id: 'TRANSFORM',
    name: 'Transform',
    type: 'user',
    category: 'Data',
    icon: FunctionSquareIcon,
    description: 'Transform data structure',
  },
];

export default function TaskLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const filteredSystemTasks = systemTasks.filter(
    (task) =>
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUserTasks = userTasks.filter(
    (task) =>
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragStart = (task: Task, e: React.DragEvent) => {
    setDraggedTask(task);
    e.dataTransfer.setData('task', JSON.stringify(task));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <SearchIcon
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            type="search"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background text-foreground border-border"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">System Tasks</h3>
            <div className="space-y-2">
              {filteredSystemTasks.map((task) => {
                const Icon = task.icon;
                return (
                  <button
                    key={task.id}
                    type="button"
                    draggable
                    onDragStart={(e) => handleDragStart(task, e)}
                    onDragEnd={handleDragEnd}
                    aria-label={`Drag ${task.name} to canvas`}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border border-border bg-background cursor-move transition-all hover:border-primary hover:shadow-md',
                      draggedTask?.id === task.id && 'opacity-50'
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        // Could trigger add to canvas here
                      }
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">{task.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator className="bg-border" />

          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">User Defined Tasks</h3>
            <div className="space-y-2">
              {filteredUserTasks.map((task) => {
                const Icon = task.icon;
                return (
                  <button
                    key={task.id}
                    type="button"
                    draggable
                    onDragStart={(e) => handleDragStart(task, e)}
                    onDragEnd={handleDragEnd}
                    aria-label={`Drag ${task.name} to canvas`}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border border-border bg-background cursor-move transition-all hover:border-tertiary hover:shadow-md',
                      draggedTask?.id === task.id && 'opacity-50'
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        // Could trigger add to canvas here
                      }
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-tertiary/10 flex-shrink-0">
                      <Icon className="h-4 w-4 text-tertiary" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">{task.name}</p>
                        <Badge
                          variant="outline"
                          className="text-xs bg-tertiary/10 text-tertiary border-tertiary/20"
                        >
                          Custom
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
