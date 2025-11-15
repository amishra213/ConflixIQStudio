import { useCallback, useState, useEffect, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  NodeProps,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useWorkflowStore, WorkflowSettings } from '@/stores/workflowStore';
import { SaveIcon, PlayIcon, EyeIcon, EditIcon, Trash2Icon, LayoutGridIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ExecuteWorkflowModal } from '@/components/modals/ExecuteWorkflowModal';
import { GenericTaskConfigModal } from '@/components/modals/GenericTaskConfigModal';
import { HttpTaskModal } from '@/components/modals/HttpTaskModal';
import { MapperTaskModal } from '@/components/modals/MapperTaskModal';
import { ScheduledWaitTaskModal } from '@/components/modals/ScheduledWaitTaskModal';
import { WaitForSignalTaskModal } from '@/components/modals/WaitForSignalTaskModal'; // Keep for system task config

// Custom Node Component
const CustomNode = memo(({ data, selected, id }: NodeProps) => {
  const getNodeIcon = (taskType: string) => {
    switch (taskType) {
      case 'HTTP':
        return '🌐';
      case 'LAMBDA':
        return '⚡';
      case 'DECISION':
        return '🔀';
      case 'CONVERGE':
        return '🔗';
      case 'FORK_JOIN':
        return '🔱';
      default:
        return '📋';
    }
  };

  return (
    <div
      className={`px-2 py-1.5 rounded-md border-2 bg-[#1a1f2e] min-w-[120px] transition-all group ${
        selected ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' : 'border-[#2a3142]'
      }`}
      style={{
        borderColor: selected ? '#00bcd4' : data.color || '#2a3142',
      }}
    >
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 !bg-cyan-500" />
      
      {/* Action Buttons */}
      <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onEdit?.(id);
          }}
          className="w-4 h-4 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg"
          title="Edit Task"
        >
          <EditIcon className="w-2 h-2 text-white" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete?.(id);
          }}
          className="w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg"
          title="Delete Task"
        >
          <Trash2Icon className="w-2 h-2 text-white" />
        </button>
      </div>

      {/* Sequence Number Badge */}
      {data.sequenceNo && (
        <div className="absolute -top-1 -left-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
          {data.sequenceNo}
        </div>
      )}

      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-sm">{getNodeIcon(data.taskType)}</span>
        <span className="text-[10px] font-semibold text-cyan-400 uppercase">{data.taskType}</span>
      </div>
      <div className="text-xs font-medium text-white truncate">{data.label}</div>
      
      {/* Config indicator */}
      {data.config && (
        <div className="mt-0.5 flex items-center gap-0.5">
          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
          <span className="text-[9px] text-green-400">Configured</span>
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 !bg-cyan-500" />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

const systemTasks = [
  // Worker Tasks (alphabetically sorted)
  {
    id: 'GENERIC',
    name: 'Generic Task',
    description: 'Basic task for custom business logic',
    type: 'GENERIC',
    color: '#00bcd4',
  },
  {
    id: 'HTTP',
    name: 'HTTP Task',
    description: 'Make HTTP API calls',
    type: 'HTTP',
    color: '#00bcd4',
  },
  {
    id: 'MAPPER',
    name: 'Mapper',
    description: 'Maps input JSON to output JSON',
    type: 'MAPPER',
    color: '#00bcd4',
  },
  {
    id: 'WAIT_FOR_SIGNAL',
    name: 'Signal or Scheduled Wait',
    description: 'Wait for signal or timeout, whichever comes first',
    type: 'WAIT_FOR_SIGNAL',
    color: '#00bcd4',
  },
  // System Tasks (alphabetically sorted)
  {
    id: 'CONVERGE',
    name: 'Converge',
    description: 'Wait for multiple parallel tasks to complete',
    type: 'CONVERGE',
    color: '#e91e63',
  },
  {
    id: 'DECISION',
    name: 'Decision',
    description: 'Conditional branching logic',
    type: 'DECISION',
    color: '#00bcd4',
  },
  {
    id: 'DO_WHILE',
    name: 'Do While',
    description: 'Loop until condition is met',
    type: 'DO_WHILE',
    color: '#00bcd4',
  },
  {
    id: 'FORK_JOIN',
    name: 'Fork and Converge',
    description: 'Execute tasks in parallel and wait for completion',
    type: 'FORK_JOIN',
    color: '#00bcd4',
  },
  {
    id: 'LAMBDA',
    name: 'Lambda',
    description: 'Execute inline JavaScript expressions',
    type: 'LAMBDA',
    color: '#00bcd4',
  },
  {
    id: 'PASS_THROUGH',
    name: 'Pass Through',
    description: 'Pass input directly to output without modification',
    type: 'PASS_THROUGH',
    color: '#00bcd4',
  },
  {
    id: 'WAIT',
    name: 'Scheduled Wait',
    description: 'Wait for a specified duration before continuing',
    type: 'WAIT',
    color: '#00bcd4',
  },
  {
    id: 'SIGNAL',
    name: 'Signal',
    description: 'Send signals to unblock waiting tasks in workflows',
    type: 'SIGNAL',
    color: '#00bcd4',
  },
  {
    id: 'WAIT_UNTIL',
    name: 'Signal Wait',
    description: 'Wait for a signal before continuing',
    type: 'WAIT_UNTIL',
    color: '#00bcd4',
  },
  {
    id: 'TERMINATE',
    name: 'Terminate',
    description: 'Terminate the workflow execution',
    type: 'TERMINATE',
    color: '#f44336',
  },
];

export function WorkflowDesigner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { workflows, updateWorkflow, executeWorkflow } = useWorkflowStore();
  const { toast } = useToast();

  const workflow = id ? workflows.find((w) => w.id === id) : null;
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [workflowSettings, setWorkflowSettings] = useState<WorkflowSettings>({
    description: 'A new workflow definition',
    version: 1,
    timeoutSeconds: 3600,
    restartable: true,
    schemaVersion: 2,
    orgId: 'ORG001',
    workflowId: `workflow-${Date.now()}`,
    effectiveDate: formatDate(new Date()),
    endDate: formatDate(new Date(new Date().setFullYear(new Date().getFullYear() + 10))),
    status: 'DRAFT',
    inputParameters: [],
    outputParameters: {},
  });
  const [activeTab, setActiveTab] = useState('design');
  const [searchQuery, setSearchQuery] = useState('');

  // Declare nodes and edges state before useEffect hooks that depend on them
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load workflow data on mount or when workflow changes
  useEffect(() => {
    if (workflow) {
      setWorkflowName(workflow.name);
      if (workflow.settings) {
        setWorkflowSettings(workflow.settings);
      }
      // Load nodes and edges from the workflow
      if (workflow.nodes && workflow.nodes.length > 0) {
        setNodes(workflow.nodes);
      } else {
        setNodes([]); // Clear nodes if workflow has none
      }
      if (workflow.edges && workflow.edges.length > 0) {
        setEdges(workflow.edges);
      } else {
        setEdges([]); // Clear edges if workflow has none
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only run when the workflow ID changes

  // Update node handlers after they're loaded (only runs once after initial load)
  useEffect(() => {
    if (nodes.length > 0 && nodes[0].data.onEdit === undefined) {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            onEdit: handleEditNode,
            onDelete: handleDeleteNode,
          },
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]); // Only check when nodes count changes

  // Auto-save nodes and edges whenever they change
  useEffect(() => {
    if (workflow && (nodes.length > 0 || edges.length > 0)) {
      // Debounce the save to avoid too frequent updates
      const timeoutId = setTimeout(() => {
        updateWorkflow(workflow.id, {
          nodes: nodes,
          edges: edges,
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, workflow?.id]); // Only depend on workflow.id, not the entire workflow object

  function formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  }

  function parseDateString(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const [month, day, year] = dateStr.split('-');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  }

  function formatDateForInput(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const [month, day, year] = dateStr.split('-');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  }

  function formatDateFromInput(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      return `${month}-${day}-${year}`;
    } catch {
      return '';
    }
  }

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      // Get source and target nodes
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      // Get sequence numbers
      const sourceSeq = sourceNode.data.sequenceNo || 0;
      const targetSeq = targetNode.data.sequenceNo || 0;

      // Only allow connecting to the next node in sequence
      if (targetSeq !== sourceSeq + 1) {
        toast({
          title: 'Invalid connection',
          description: 'Tasks can only be connected in sequence order. Use Auto Arrange to reorganize.',
          variant: 'destructive',
        });
        return;
      }

      const edge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#00bcd4', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [nodes, setEdges, toast]
  );

  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [isGenericConfigModalOpen, setIsGenericConfigModalOpen] = useState(false);
  const [isHttpConfigModalOpen, setIsHttpConfigModalOpen] = useState(false);
  const [isMapperConfigModalOpen, setIsMapperConfigModalOpen] = useState(false);
  const [isWaitForSignalConfigModalOpen, setIsWaitForSignalConfigModalOpen] = useState(false); // Keep for system task config
  const [isScheduledWaitConfigModalOpen, setIsScheduledWaitConfigModalOpen] = useState(false); // For worker task
  const [selectedNodeForConfig, setSelectedNodeForConfig] = useState<Node | null>(null);
  const [pendingNodeForAutoConfig, setPendingNodeForAutoConfig] = useState<Node | null>(null); // For auto-opening config after drag/drop

  // Define handlers first without dependencies on each other
  const handleEditNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNodeForConfig(node);
      // Open the correct modal based on task type
      switch (node.data.taskType) {
        case 'GENERIC': setIsGenericConfigModalOpen(true); break;
        case 'HTTP': setIsHttpConfigModalOpen(true); break;
        case 'MAPPER': setIsMapperConfigModalOpen(true); break;
        case 'WAIT_FOR_SIGNAL': setIsWaitForSignalConfigModalOpen(true); break;
        case 'WAIT': setIsScheduledWaitConfigModalOpen(true); break;
        default:
          toast({
            title: 'Configuration not available',
            description: `No specific configuration modal for task type: ${node.data.taskType}`,
            variant: 'destructive',
          });
          setSelectedNodeForConfig(null);
          break;
      }
    }
  }, [nodes, toast]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => {
      const filteredNodes = nds.filter((n) => n.id !== nodeId);
      
      // Recalculate sequence numbers after deletion
      return filteredNodes.map((node, index) => ({
        ...node,
        data: {
          ...node.data,
          sequenceNo: index + 1,
        },
      }));
    });
    
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    
    toast({
      title: 'Task deleted',
      description: 'Task has been removed from the workflow.',
    });
  }, [setNodes, setEdges, toast]);

  const handleSaveTaskConfig = useCallback((config: any, nodeId: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                config: config,
              },
            }
          : node
      )
    );

    toast({
      title: 'Configuration saved',
      description: 'Task configuration has been updated.',
    });

    setSelectedNodeForConfig(null);
    setPendingNodeForAutoConfig(null);
  }, [setNodes, toast]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const taskId = event.dataTransfer.getData('application/reactflow');
      if (!taskId) return;

      const task = systemTasks.find((t) => t.id === taskId);
      if (!task) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 80,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      const taskRefId = `${task.type.toLowerCase()}_${Date.now()}`;
      
      setNodes((nds) => {
        const sequenceNo = nds.length + 1;
        
        const newNode: Node = {
          id: taskRefId,
          type: 'custom',
          position,
          data: {
            label: taskRefId,
            taskType: task.type,
            taskName: task.name,
            color: task.color,
            sequenceNo: sequenceNo,
            onEdit: handleEditNode,
            onDelete: handleDeleteNode,
          },
        };
        
        const updatedNodes = [...nds, newNode];
        
        // Auto-connect to the last node if exists
        if (nds.length > 0) {
          const lastNode = nds[nds.length - 1];
          const newEdge: Edge = {
            id: `${lastNode.id}-${newNode.id}`,
            source: lastNode.id,
            target: newNode.id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#00bcd4', strokeWidth: 2 },
          };
          setEdges((eds) => [...eds, newEdge]);
        }
        
        // Open config modal for GENERIC tasks automatically
        if (task.type === 'GENERIC') {
          setPendingNodeForAutoConfig(newNode);
          setIsGenericConfigModalOpen(true);
        }
        
        return updatedNodes;
      });
    },
    [setNodes, setEdges, handleEditNode, handleDeleteNode]
  );

  const handleAddNode = useCallback((taskId: string) => {
    const task = systemTasks.find((t) => t.id === taskId);
    if (!task) return;

    setNodes((nds) => {
      // Calculate position based on existing nodes with better spacing
      const lastNode = nds[nds.length - 1];
      const xPosition = lastNode ? lastNode.position.x : 100;
      const yPosition = lastNode ? lastNode.position.y + 150 : 100;
      const sequenceNo = nds.length + 1;

      const taskRefId = `${task.type.toLowerCase()}_${Date.now()}`;
      const newNode: Node = {
        id: taskRefId,
        type: 'custom',
        position: { x: xPosition, y: yPosition },
        data: { 
          label: taskRefId,
          taskType: task.type,
          taskName: task.name,
          color: task.color,
          sequenceNo: sequenceNo,
          onEdit: handleEditNode,
          onDelete: handleDeleteNode,
        },
      };

      const updatedNodes = [...nds, newNode];
      
      // Auto-connect to previous node if exists
      if (lastNode) {
        const newEdge: Edge = {
          id: `${lastNode.id}-${newNode.id}`,
          source: lastNode.id,
          target: newNode.id,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#00bcd4', strokeWidth: 2 },
        };
        setEdges((eds) => [...eds, newEdge]);
      }
      
      return updatedNodes;
    });
  }, [setNodes, setEdges, handleEditNode, handleDeleteNode]);

  const handleAutoArrange = useCallback(() => {
    if (nodes.length === 0) {
      toast({
        title: 'No tasks to arrange',
        description: 'Add some tasks to the workflow first.',
        variant: 'destructive',
      });
      return;
    }

    // Sort nodes by their sequence number to maintain logical order
    const sortedNodes = [...nodes].sort((a, b) => {
      const seqA = a.data.sequenceNo || 0;
      const seqB = b.data.sequenceNo || 0;
      return seqA - seqB;
    });

    // Configuration for snake layout
    const nodesPerRow = 5; // Number of nodes in each row
    const horizontalSpacing = 200; // Space between nodes horizontally
    const verticalSpacing = 120; // Space between rows
    const startX = 50; // Starting X position
    const startY = 50; // Starting Y position

    // Arrange nodes in a snake pattern
    const arrangedNodes = sortedNodes.map((node, index) => {
      const rowIndex = Math.floor(index / nodesPerRow);
      const colIndex = index % nodesPerRow;

      // Snake pattern: reverse direction on odd rows
      const isOddRow = rowIndex % 2 === 1;
      const actualColIndex = isOddRow ? (nodesPerRow - 1 - colIndex) : colIndex;

      return {
        ...node,
        position: {
          x: startX + (actualColIndex * horizontalSpacing),
          y: startY + (rowIndex * verticalSpacing),
        },
      };
    });

    setNodes(arrangedNodes);

    // Auto-connect all nodes in sequence
    const newEdges: Edge[] = [];
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const sourceNode = sortedNodes[i];
      const targetNode = sortedNodes[i + 1];

      newEdges.push({
        id: `${sourceNode.id}-${targetNode.id}`,
        source: sourceNode.id,
        target: targetNode.id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#00bcd4', strokeWidth: 2 },
      });
    }
    setEdges(newEdges);
  }, [nodes, setNodes, setEdges]);

  const handlePreview = () => {
    // Save current state temporarily
    if (workflow) {
      useWorkflowStore.getState().updateWorkflow(workflow.id, {
        nodes: nodes,
        edges: edges,
      });
      // Navigate to unified diagram page in preview mode
      navigate(`/diagram/${workflow.id}?mode=preview`);
    } else {
      // For unsaved workflows, create temporary workflow
      const tempWorkflow = {
        id: `temp-${Date.now()}`,
        name: workflowName,
        description: 'Preview workflow',
        nodes: nodes,
        edges: edges,
        createdAt: new Date().toISOString(),
        status: 'draft' as const,
      };
      useWorkflowStore.getState().addWorkflow(tempWorkflow);
      navigate(`/diagram/${tempWorkflow.id}?mode=preview`);
    }
  };

  const handleSave = () => {
    if (workflow) {
      updateWorkflow(workflow.id, {
        name: workflowName,
        description: workflowSettings.description,
        settings: workflowSettings,
        nodes: nodes,
        edges: edges,
      });
      toast({
        title: 'Workflow saved',
        description: 'Your workflow has been saved successfully.',
      });
      return true;
    } else {
      // Create new workflow if accessed from standalone designer
      const newWorkflow = {
        id: workflowSettings.workflowId,
        name: workflowName,
        description: workflowSettings.description,
        nodes: nodes,
        edges: edges,
        createdAt: new Date().toISOString(),
        status: workflowSettings.status.toLowerCase() as 'draft' | 'active' | 'paused',
        settings: workflowSettings,
      };
      useWorkflowStore.getState().addWorkflow(newWorkflow);
      toast({
        title: 'Workflow created',
        description: 'Your workflow has been created successfully.',
      });
      navigate(`/workflows/${newWorkflow.id}`);
      return true;
    }
  };

  const handleExecute = () => {
    // First save the workflow
    if (workflow) {
      // Save workflow changes
      updateWorkflow(workflow.id, {
        name: workflowName,
      });
      
      // Open execute modal
      setExecuteModalOpen(true);
    } else {
      toast({
        title: 'Please save first',
        description: 'Save the workflow before executing.',
        variant: 'destructive',
      });
    }
  };

  const handleExecuteWorkflow = (workflowId: string, input: any) => {
    try {
      const execution = executeWorkflow(workflowId, input);
      
      toast({
        title: 'Workflow execution started',
        description: `Execution ID: ${execution.id}`,
      });

      // Navigate to executions page
      setTimeout(() => {
        navigate('/executions');
      }, 500);
    } catch (error) {
      toast({
        title: 'Execution failed',
        description: error instanceof Error ? error.message : 'Failed to execute workflow',
        variant: 'destructive',
      });
    }
  };

  const filteredTasks = systemTasks.filter(
    (task) =>
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="h-full flex flex-col bg-[#1a1f2e]">
        {/* Top Bar */}
        <div className="h-16 bg-[#1a1f2e] border-b border-[#2a3142] px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-white">{workflowName}</span>
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded">
                  v1
                </span>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                  ACTIVE
                </span>
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded">
                  {nodes.length} tasks
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            className="text-purple-400 border-[#2a3142] hover:bg-purple-500/10 hover:text-purple-300"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            Preview Diagram
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142] hover:text-white"
          >
            <SaveIcon className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button
            size="sm"
            onClick={handleExecute}
            className="bg-cyan-500 text-white hover:bg-cyan-600 font-medium"
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            Execute
          </Button>
        </div>
      </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Task Library */}
          <div className="w-80 bg-[#1a1f2e] border-r border-[#2a3142] flex flex-col">
          {/* Task Library Header */}
          <div className="px-4 py-4 border-b border-[#2a3142]">
            <h3 className="text-base font-semibold text-white mb-3">Task Library</h3>
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-[#0f1419] text-white text-sm border border-[#2a3142] rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder:text-gray-500"
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
              <div>
                <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  Worker Tasks
                </h4>
                <div className="space-y-2">
                  {filteredTasks
                    .filter((task) => ['GENERIC', 'HTTP', 'MAPPER', 'WAIT_FOR_SIGNAL'].includes(task.id))
                    .map((task) => (
                      <div
                        key={task.id}
                        className="group p-3 bg-[#0f1419] border border-[#2a3142] rounded-lg cursor-pointer hover:border-cyan-500 transition-all duration-200"
                        onClick={() => handleAddNode(task.id)}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/reactflow', task.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="mt-0.5 w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${task.color}20` }}
                          >
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: task.color }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{task.name}</p>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2a3142]"></div>
                </div>
              </div>

              {/* System Tasks */}
              <div>
                <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  System Tasks
                </h4>
                <div className="space-y-2">
                  {filteredTasks
                    .filter((task) => !['GENERIC', 'HTTP', 'MAPPER', 'WAIT_FOR_SIGNAL'].includes(task.id))
                    .map((task) => (
                      <div
                        key={task.id}
                        className="group p-3 bg-[#0f1419] border border-[#2a3142] rounded-lg cursor-pointer hover:border-cyan-500 transition-all duration-200"
                        onClick={() => handleAddNode(task.id)}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/reactflow', task.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="mt-0.5 w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${task.color}20` }}
                          >
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: task.color }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{task.name}</p>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Right Side - Canvas Area */}
          <div className="flex-1 flex flex-col bg-[#0f1419]">
            {/* Canvas Toolbar */}
            <div className="h-14 bg-[#1a1f2e] border-b border-[#2a3142] px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('design')}
                className={`font-medium h-8 px-4 ${
                  activeTab === 'design'
                    ? 'text-white bg-cyan-500 hover:bg-cyan-600'
                    : 'text-gray-400 hover:bg-[#2a3142] hover:text-white'
                }`}
              >
                Design
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('settings')}
                className={`font-medium h-8 px-4 ${
                  activeTab === 'settings'
                    ? 'text-white bg-cyan-500 hover:bg-cyan-600'
                    : 'text-gray-400 hover:bg-[#2a3142] hover:text-white'
                }`}
              >
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('summary')}
                className={`font-medium h-8 px-4 ${
                  activeTab === 'summary'
                    ? 'text-white bg-cyan-500 hover:bg-cyan-600'
                    : 'text-gray-400 hover:bg-[#2a3142] hover:text-white'
                }`}
              >
                Summary
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('json')}
                className={`font-medium h-8 px-4 ${
                  activeTab === 'json'
                    ? 'text-white bg-cyan-500 hover:bg-cyan-600'
                    : 'text-gray-400 hover:bg-[#2a3142] hover:text-white'
                }`}
              >
                JSON Definition
              </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoArrange}
                  className="text-cyan-400 border-[#2a3142] hover:bg-cyan-500/10 hover:text-cyan-300"
                  disabled={nodes.length === 0}
                >
                  <LayoutGridIcon className="w-4 h-4 mr-2" />
                  Auto Arrange
                </Button>
              </div>
            </div>

            {/* Canvas Content */}
            <div className="flex-1 relative overflow-hidden">
              {activeTab === 'design' && (
                <div className="h-full flex flex-col">
                  {/* Canvas Info Bar */}
                  <div className="bg-[#1a1f2e] border-b border-[#2a3142] px-4 py-2">
                  <p className="text-xs text-gray-400">
                    <span className="font-medium">Tip:</span> Tasks auto-connect in sequence • Use <span className="font-medium">Auto Arrange</span> to organize in snake pattern (5 per row)
                    <br />
                    <span className="font-medium">Edit/Delete:</span> Hover over task and click blue Edit or red Delete button
                  </p>
                </div>

                {/* Canvas */}
                <div 
                  className="flex-1 relative"
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                >
                    {nodes.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center max-w-md">
                          <div className="w-16 h-16 bg-[#2a3142] rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">Start Building Your Workflow</h3>
                          <p className="text-sm text-gray-400 mb-6">
                            Click on tasks from the Task Library to add them to your workflow canvas
                          </p>
                        </div>
                      </div>
                    ) : (
                      <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-[#0f1419]"
                        defaultEdgeOptions={{
                          type: 'smoothstep',
                          animated: true,
                          style: { stroke: '#00bcd4', strokeWidth: 2 },
                        }}
                      >
                        <Background
                          color="#2a3142"
                          gap={20}
                          size={1}
                          variant={"dots" as BackgroundVariant}
                        />
                        <Controls 
                          className="bg-[#1a1f2e] border border-[#2a3142] rounded-lg overflow-hidden"
                          showInteractive={false}
                        />
                      </ReactFlow>
                    )}
                  </div>
                </div>
              )}

            {activeTab === 'summary' && (
              <div className="h-full overflow-y-auto p-6 bg-[#0f1419]">
                <Card className="max-w-4xl mx-auto p-6 bg-[#1a1f2e] border-[#2a3142]">
                  <h3 className="text-xl font-semibold text-white mb-6">Workflow Summary</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-400 text-sm">Name</Label>
                        <p className="text-white mt-1">{workflowName}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400 text-sm">Workflow ID</Label>
                        <p className="text-white mt-1 font-mono text-sm">{workflowSettings.workflowId}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400 text-sm">Status</Label>
                        <Badge className="mt-1">{workflowSettings.status}</Badge>
                      </div>
                      <div>
                        <Label className="text-gray-400 text-sm">Version</Label>
                        <p className="text-white mt-1">{workflowSettings.version}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400 text-sm">Total Tasks</Label>
                        <p className="text-white mt-1">{nodes.length}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400 text-sm">Timeout</Label>
                        <p className="text-white mt-1">{workflowSettings.timeoutSeconds}s</p>
                      </div>
                    </div>
                    <Separator className="bg-[#2a3142]" />
                    <div>
                      <Label className="text-gray-400 text-sm">Description</Label>
                      <p className="text-white mt-1">{workflowSettings.description}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="h-full overflow-y-auto p-6 bg-[#0f1419]">
                <Card className="max-w-4xl mx-auto p-6 bg-[#1a1f2e] border-[#2a3142]">
                  <h3 className="text-xl font-semibold text-white mb-6">Workflow Settings</h3>
                  
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-white">Basic Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Workflow Name *</Label>
                          <Input
                            value={workflowName}
                            onChange={(e) => setWorkflowName(e.target.value)}
                            className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Workflow ID *</Label>
                          <Input
                            value={workflowSettings.workflowId}
                            onChange={(e) => setWorkflowSettings({ ...workflowSettings, workflowId: e.target.value })}
                            className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-white">Description</Label>
                          <Textarea
                            value={workflowSettings.description}
                            onChange={(e) => setWorkflowSettings({ ...workflowSettings, description: e.target.value })}
                            className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-[#2a3142]" />

                    {/* Version & Organization */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-white">Version & Organization</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-white">Version</Label>
                          <Input
                            type="number"
                            value={workflowSettings.version}
                            onChange={(e) => setWorkflowSettings({ ...workflowSettings, version: Number.parseInt(e.target.value) || 1 })}
                            className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Schema Version</Label>
                          <Input
                            type="number"
                            value={workflowSettings.schemaVersion}
                            onChange={(e) => setWorkflowSettings({ ...workflowSettings, schemaVersion: Number.parseInt(e.target.value) || 2 })}
                            className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Organization ID</Label>
                          <Input
                            value={workflowSettings.orgId}
                            onChange={(e) => setWorkflowSettings({ ...workflowSettings, orgId: e.target.value })}
                            className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-[#2a3142]" />

                    {/* Status & Dates */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-white">Status & Dates</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-white">Status</Label>
                          <Select
                            value={workflowSettings.status}
                            onValueChange={(value: 'DRAFT' | 'ACTIVE' | 'PAUSED') => 
                              setWorkflowSettings({ ...workflowSettings, status: value })
                            }
                          >
                            <SelectTrigger className="mt-2 bg-[#0f1419] text-white border-[#2a3142]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                              <SelectItem value="DRAFT">DRAFT</SelectItem>
                              <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                              <SelectItem value="PAUSED">PAUSED</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-white">Effective Date (MM-DD-YYYY)</Label>
                          <Input
                            type="date"
                            value={formatDateForInput(workflowSettings.effectiveDate)}
                            onChange={(e) => setWorkflowSettings({ 
                              ...workflowSettings, 
                              effectiveDate: formatDateFromInput(e.target.value) 
                            })}
                            className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
                          />
                        </div>
                        <div>
                          <Label className="text-white">End Date (MM-DD-YYYY)</Label>
                          <Input
                            type="date"
                            value={formatDateForInput(workflowSettings.endDate)}
                            onChange={(e) => setWorkflowSettings({ 
                              ...workflowSettings, 
                              endDate: formatDateFromInput(e.target.value) 
                            })}
                            className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-[#2a3142]" />

                    {/* Execution Settings */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-white">Execution Settings</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Timeout (seconds)</Label>
                          <Input
                            type="number"
                            value={workflowSettings.timeoutSeconds}
                            onChange={(e) => setWorkflowSettings({ ...workflowSettings, timeoutSeconds: parseInt(e.target.value) || 3600 })}
                            className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-8">
                          <Label className="text-white">Restartable</Label>
                          <Switch
                            checked={workflowSettings.restartable}
                            onCheckedChange={(checked) => setWorkflowSettings({ ...workflowSettings, restartable: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-[#2a3142]" />

                    {/* Parameters */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-white">Parameters</h4>
                      <div>
                        <Label className="text-white">Input Parameters (comma-separated)</Label>
                        <Input
                          value={workflowSettings.inputParameters.join(', ')}
                          onChange={(e) => setWorkflowSettings({ 
                            ...workflowSettings, 
                            inputParameters: e.target.value.split(',').map(p => p.trim()).filter(p => p) 
                          })}
                          placeholder="param1, param2, param3"
                          className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Output Parameters (JSON)</Label>
                        <Textarea
                          value={JSON.stringify(workflowSettings.outputParameters, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setWorkflowSettings({ ...workflowSettings, outputParameters: parsed });
                            } catch (err) {
                              // Invalid JSON, don't update
                            }
                          }}
                          className="mt-2 bg-[#0f1419] text-white border-[#2a3142] font-mono text-sm"
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleSave}
                        className="bg-cyan-500 text-white hover:bg-cyan-600"
                      >
                        <SaveIcon className="w-4 h-4 mr-2" />
                        Save Settings
                      </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

            {activeTab === 'json' && (
              <div className="h-full overflow-y-auto p-6 bg-[#0f1419]">
                <Card className="max-w-4xl mx-auto p-6 bg-[#1a1f2e] border-[#2a3142]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">Workflow Definition (JSON)</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const json = JSON.stringify({
                          name: workflowName,
                          description: workflowSettings.description,
                          version: workflowSettings.version,
                          tasks: nodes.map(node => {
                            const baseTask = {
                              name: node.data.config?.taskId || node.data.taskName,
                              taskReferenceName: node.data.config?.taskRefId || node.id,
                              type: node.data.taskType,
                              optional: false,
                            };
                            
                            // Include full config if available
                            if (node.data.config) {
                              return {
                                ...baseTask,
                                ...node.data.config,
                                sequenceNo: node.data.sequenceNo,
                              };
                            }
                            
                            return {
                              ...baseTask,
                              inputParameters: {},
                              sequenceNo: node.data.sequenceNo,
                            };
                          }),
                          inputParameters: workflowSettings.inputParameters,
                          outputParameters: workflowSettings.outputParameters,
                          timeoutSeconds: workflowSettings.timeoutSeconds,
                          restartable: workflowSettings.restartable,
                          schemaVersion: workflowSettings.schemaVersion,
                          orgId: workflowSettings.orgId,
                          workflowId: workflowSettings.workflowId,
                          effectiveDate: workflowSettings.effectiveDate,
                          endDate: workflowSettings.endDate,
                          status: workflowSettings.status,
                        }, null, 2);
                        navigator.clipboard.writeText(json);
                        toast({ title: 'Copied!', description: 'JSON copied to clipboard' });
                      }}
                      className="text-cyan-500 border-[#2a3142]"
                    >
                      Copy JSON
                    </Button>
                  </div>
                  <pre className="text-xs text-gray-300 font-mono bg-[#0f1419] p-4 rounded-lg border border-[#2a3142] overflow-x-auto max-h-[600px] overflow-y-auto">
                    {JSON.stringify({
                      name: workflowName,
                      description: workflowSettings.description,
                      version: workflowSettings.version,
                      tasks: nodes.map(node => {
                        const baseTask = {
                          name: node.data.config?.taskId || node.data.taskName,
                          taskReferenceName: node.data.config?.taskRefId || node.id,
                          type: node.data.taskType,
                          optional: false,
                        };
                        
                        // Include full config if available
                        if (node.data.config) {
                          return {
                            ...baseTask,
                            ...node.data.config,
                            sequenceNo: node.data.sequenceNo,
                          };
                        }
                        
                        return {
                          ...baseTask,
                          inputParameters: {},
                          sequenceNo: node.data.sequenceNo,
                        };
                      }),
                      inputParameters: workflowSettings.inputParameters,
                      outputParameters: workflowSettings.outputParameters,
                      timeoutSeconds: workflowSettings.timeoutSeconds,
                      restartable: workflowSettings.restartable,
                      schemaVersion: workflowSettings.schemaVersion,
                      orgId: workflowSettings.orgId,
                      workflowId: workflowSettings.workflowId,
                      externalReferences: null,
                      httpEndpoints: [],
                      searchableFields: [],
                      effectiveDate: workflowSettings.effectiveDate,
                      endDate: workflowSettings.endDate,
                      status: workflowSettings.status,
                    }, null, 2)}
                  </pre>
                </Card>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ExecuteWorkflowModal
        open={executeModalOpen}
        onOpenChange={setExecuteModalOpen}
        workflow={workflow || null}
        onExecute={handleExecuteWorkflow}
      />

      <GenericTaskConfigModal
        open={isGenericConfigModalOpen}
        onOpenChange={(open) => {
          setIsGenericConfigModalOpen(open);
          if (!open) {
            if (pendingNodeForAutoConfig && !selectedNodeForConfig) {
              setNodes((nds) => nds.filter((n) => n.id !== pendingNodeForAutoConfig.id));
              setEdges((eds) => eds.filter((e) => 
                e.source !== pendingNodeForAutoConfig.id && e.target !== pendingNodeForAutoConfig.id
              ));
            }
            setPendingNodeForAutoConfig(null);
            setSelectedNodeForConfig(null);
          }
        }}
        node={selectedNodeForConfig?.data?.taskType === 'GENERIC' ? selectedNodeForConfig : pendingNodeForAutoConfig?.data?.taskType === 'GENERIC' ? pendingNodeForAutoConfig : null}
        onSave={(config) => handleSaveTaskConfig(config, (selectedNodeForConfig || pendingNodeForAutoConfig)!.id)}
      />

      <HttpTaskModal
        open={isHttpConfigModalOpen}
        onOpenChange={(open) => {
          setIsHttpConfigModalOpen(open);
          if (!open) {
            if (pendingNodeForAutoConfig && !selectedNodeForConfig) {
              setNodes((nds) => nds.filter((n) => n.id !== pendingNodeForAutoConfig.id));
              setEdges((eds) => eds.filter((e) => 
                e.source !== pendingNodeForAutoConfig.id && e.target !== pendingNodeForAutoConfig.id
              ));
            }
            setPendingNodeForAutoConfig(null);
            setSelectedNodeForConfig(null);
          }
        }}
        initialConfig={selectedNodeForConfig?.data?.taskType === 'HTTP' ? selectedNodeForConfig.data.config : pendingNodeForAutoConfig?.data?.taskType === 'HTTP' ? pendingNodeForAutoConfig.data.config : null}
        onSave={(config) => handleSaveTaskConfig(config, (selectedNodeForConfig || pendingNodeForAutoConfig)!.id)}
      />

      <MapperTaskModal
        open={isMapperConfigModalOpen}
        onOpenChange={(open) => {
          setIsMapperConfigModalOpen(open);
          if (!open) {
            if (pendingNodeForAutoConfig && !selectedNodeForConfig) {
              setNodes((nds) => nds.filter((n) => n.id !== pendingNodeForAutoConfig.id));
              setEdges((eds) => eds.filter((e) => 
                e.source !== pendingNodeForAutoConfig.id && e.target !== pendingNodeForAutoConfig.id
              ));
            }
            setPendingNodeForAutoConfig(null);
            setSelectedNodeForConfig(null);
          }
        }}
        initialConfig={selectedNodeForConfig?.data?.taskType === 'MAPPER' ? selectedNodeForConfig.data.config : pendingNodeForAutoConfig?.data?.taskType === 'MAPPER' ? pendingNodeForAutoConfig.data.config : null}
        onSave={(config) => handleSaveTaskConfig(config, (selectedNodeForConfig || pendingNodeForAutoConfig)!.id)}
      />

      <WaitForSignalTaskModal // This is a system task, keep its config modal
        open={isWaitForSignalConfigModalOpen}
        onOpenChange={(open) => {
          setIsWaitForSignalConfigModalOpen(open);
          if (!open) {
            if (pendingNodeForAutoConfig && !selectedNodeForConfig) {
              setNodes((nds) => nds.filter((n) => n.id !== pendingNodeForAutoConfig.id));
              setEdges((eds) => eds.filter((e) => 
                e.source !== pendingNodeForAutoConfig.id && e.target !== pendingNodeForAutoConfig.id
              ));
            }
            setPendingNodeForAutoConfig(null);
            setSelectedNodeForConfig(null);
          }
        }}
        initialConfig={selectedNodeForConfig?.data?.taskType === 'WAIT_FOR_SIGNAL' ? selectedNodeForConfig.data.config : pendingNodeForAutoConfig?.data?.taskType === 'WAIT_FOR_SIGNAL' ? pendingNodeForAutoConfig.data.config : null}
        onSave={(config) => handleSaveTaskConfig(config, (selectedNodeForConfig || pendingNodeForAutoConfig)!.id)}
      />

      <ScheduledWaitTaskModal // Renamed from SignalOrScheduledWaitTaskModal
        open={isScheduledWaitConfigModalOpen}
        onOpenChange={(open) => {
          setIsScheduledWaitConfigModalOpen(open);
          if (!open) {
            if (pendingNodeForAutoConfig && !selectedNodeForConfig) {
              setNodes((nds) => nds.filter((n) => n.id !== pendingNodeForAutoConfig.id));
              setEdges((eds) => eds.filter((e) => 
                e.source !== pendingNodeForAutoConfig.id && e.target !== pendingNodeForAutoConfig.id
              ));
            }
            setPendingNodeForAutoConfig(null);
            setSelectedNodeForConfig(null);
          }
        }}
        initialConfig={selectedNodeForConfig?.data?.taskType === 'WAIT' ? selectedNodeForConfig.data.config : pendingNodeForAutoConfig?.data?.taskType === 'WAIT' ? pendingNodeForAutoConfig.data.config : null}
        onSave={(config) => handleSaveTaskConfig(config, (selectedNodeForConfig || pendingNodeForAutoConfig)!.id)}
      />
    </>
  );
}
