import { TaskDefinition } from '@/constants/taskDefinitions';

interface TaskLibrarySidebarProps {
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly workerTasks: readonly TaskDefinition[];
  readonly operators: readonly TaskDefinition[];
  readonly systemTasks: readonly TaskDefinition[];
}

export function TaskLibrarySidebar({
  searchQuery,
  onSearchChange,
  workerTasks,
  operators,
  systemTasks,
}: Readonly<TaskLibrarySidebarProps>) {
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('application/reactflow', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const renderTaskButton = (task: TaskDefinition) => (
    <button
      key={task.id}
      className="w-full group p-3 bg-background border border-border rounded-lg cursor-move hover:border-cyan-500 transition-all duration-200 text-left"
      draggable
      onDragStart={(e) => handleDragStart(e, task.id)}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${task.color}20` }}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: task.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{task.name}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      {/* Task Library Header */}
      <div className="px-4 py-4 border-b border-border">
        <h3 className="text-base font-semibold text-foreground mb-3">Task Library</h3>
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-background text-foreground text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder:text-muted-foreground"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Task Categories */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Worker Tasks */}
          {workerTasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                Worker Tasks
              </h4>
              <div className="space-y-2">{workerTasks.map(renderTaskButton)}</div>
            </div>
          )}

          {/* Operators */}
          {operators.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Operators
              </h4>
              <div className="space-y-2">{operators.map(renderTaskButton)}</div>
            </div>
          )}

          {/* System Tasks */}
          {systemTasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                System Tasks
              </h4>
              <div className="space-y-2">{systemTasks.map(renderTaskButton)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
