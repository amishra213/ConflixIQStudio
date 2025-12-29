import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { EditIcon, Trash2Icon } from 'lucide-react';
import '@/styles/CustomNode.css';

export const CustomNode = memo(({ data, selected, id }: NodeProps) => {
  const getNodeIcon = (taskType: string) => {
    if (taskType === 'HTTP') return '🌐';
    if (taskType === 'LAMBDA') return '⚡';
    if (taskType === 'DECISION') return '🔀';
    if (taskType === 'CONVERGE') return '🔗';
    if (taskType === 'FORK_JOIN') return '🔱';
    return '📋';
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onEdit) {
      console.log('Edit clicked for node:', id, 'taskType:', data.taskType);
      data.onEdit(id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  return (
    <div
      className={`px-2 py-1.5 rounded-md border-2 bg-card transition-all group relative cursor-pointer nodeContainer ${
        selected ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' : 'border-border'
      }`}
      // Using inline style is necessary here as it sets a dynamic CSS custom property
      // that comes from the task data and cannot be determined at build time
      style={{
        '--node-border-color': data.color || '#2a3142',
      } as React.CSSProperties & { [key: string]: string }}
      title={`Task: ${data.label}\nRef: ${data.taskReferenceName || 'N/A'}\n\nClick to edit or use the blue Edit button for more options`}
      aria-label={`Task node: ${data.label}. ${data.taskType} task.`}
    >
      {/* Top Handle */}
      <Handle id="top" type="target" position={Position.Top} className="w-2.5 h-2.5 !bg-cyan-500" />

      {/* Left Handle */}
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 !bg-cyan-500 handlePosition"
      />

      {/* Right Handle */}
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 !bg-cyan-500 handlePosition"
      />

      {/* Bottom Handle */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-cyan-500"
      />

      {/* Action Buttons */}
      <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={handleEditClick}
          className="w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
          title="Edit Task"
          aria-label="Edit task"
        >
          <EditIcon className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={handleDeleteClick}
          className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
          title="Delete Task"
          aria-label="Delete task"
        >
          <Trash2Icon className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Sequence Number Badge */}
      {data.sequenceNo && (
        <div className="absolute -top-1 -left-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center text-[10px] font-bold text-foreground shadow-lg">
          {data.sequenceNo}
        </div>
      )}

      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-[1.3rem]">{getNodeIcon(data.taskType)}</span>
        <span className="text-[10px] font-bold text-cyan-400 uppercase">{data.taskType}</span>
      </div>
      <div className="text-xs font-bold text-foreground truncate text-center">{data.label}</div>

      {/* Config indicator */}
      {data.config && (
        <div className="mt-0.5 flex items-center justify-center gap-0.5">
          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
          <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400">Configured</span>
        </div>
      )}
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

