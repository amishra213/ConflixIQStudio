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
import { HttpTaskModal } from '@/components/modals/system-tasks/HttpTaskModal';
import { KafkaPublishTaskModal, KafkaPublishTaskConfig } from '@/components/modals/system-tasks/KafkaPublishTaskModal';
import { GrpcTaskModal, GrpcTaskConfig } from '@/components/modals/system-tasks/GrpcTaskModal';
import { JsonJqTransformTaskModal, JsonJqTransformTaskConfig } from '@/components/modals/system-tasks/JsonJqTransformTaskModal';
import { JsonJqTransformStringTaskModal, JsonJqTransformStringTaskConfig } from '@/components/modals/system-tasks/JsonJqTransformStringTaskModal';
import { NoopSystemTaskModal, NoopSystemTaskConfig } from '@/components/modals/system-tasks/NoopSystemTaskModal';
import { EventSystemTaskModal, EventSystemTaskConfig } from '@/components/modals/system-tasks/EventSystemTaskModal';
import { WaitSystemTaskModal, WaitSystemTaskConfig } from '@/components/modals/system-tasks/WaitSystemTaskModal';
import { SetVariableSystemTaskModal, SetVariableSystemTaskConfig } from '@/components/modals/system-tasks/SetVariableSystemTaskModal';
import { SubWorkflowSystemTaskModal, SubWorkflowSystemTaskConfig } from '@/components/modals/system-tasks/SubWorkflowSystemTaskModal';
import { TerminateSystemTaskModal, TerminateSystemTaskConfig } from '@/components/modals/system-tasks/TerminateSystemTaskModal';
import { InlineSystemTaskModal, InlineSystemTaskConfig } from '@/components/modals/system-tasks/InlineSystemTaskModal';
import { SimpleTaskModal, WorkflowTaskConfig } from '@/components/modals/SimpleTaskModal';

// Operator Modals
import { ForkJoinModal, ForkJoinConfig } from '@/components/modals/operators/ForkJoinModal';
import { ForkJoinDynamicModal, ForkJoinDynamicConfig } from '@/components/modals/operators/ForkJoinDynamicModal';
import { SwitchModal, SwitchConfig } from '@/components/modals/operators/SwitchModal';
import { DoWhileModal, DoWhileConfig } from '@/components/modals/operators/DoWhileModal';
import { DynamicModal, DynamicConfig } from '@/components/modals/operators/DynamicModal';
import { LambdaModal, LambdaConfig } from '@/components/modals/operators/LambdaModal';
import { InlineModal, InlineConfig } from '@/components/modals/operators/InlineModal';
import { JoinModal, JoinConfig } from '@/components/modals/operators/JoinModal';
import { ExclusiveJoinModal, ExclusiveJoinConfig } from '@/components/modals/operators/ExclusiveJoinModal';
import { SubWorkflowModal, SubWorkflowConfig } from '@/components/modals/operators/SubWorkflowModal';

import logo from '../../resources/logo.svg';

// Custom Node Component
const CustomNode = memo(({ data, selected, id }: NodeProps) => {
  const getNodeIcon = (taskType: string) => {
    if (taskType === 'HTTP') return '🌐';
    if (taskType === 'LAMBDA') return '⚡';
    if (taskType === 'DECISION') return '🔀';
    if (taskType === 'CONVERGE') return '🔗';
    if (taskType === 'FORK_JOIN') return '🔱';
    return '📋';
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

// Worker Tasks - Currently only SIMPLE is supported by Conductor Server
const workerTasks = [
  {
    id: 'SIMPLE',
    name: 'Simple Task',
    description: 'Execute a simple task with custom business logic',
    type: 'SIMPLE',
    color: '#00bcd4',
  },
];

// Workflow Operators
const operators = [
  {
    id: 'FORK_JOIN',
    name: 'Fork/Join',
    description: 'Execute tasks in parallel and wait for completion',
    type: 'FORK_JOIN',
    color: '#9c27b0',
  },
  {
    id: 'FORK_JOIN_DYNAMIC',
    name: 'Fork/Join Dynamic',
    description: 'Execute dynamic number of parallel tasks',
    type: 'FORK_JOIN_DYNAMIC',
    color: '#9c27b0',
  },
  {
    id: 'JOIN',
    name: 'Join',
    description: 'Wait for multiple tasks to complete',
    type: 'JOIN',
    color: '#9c27b0',
  },
  {
    id: 'EXCLUSIVE_JOIN',
    name: 'Exclusive Join',
    description: 'Wait for one of multiple tasks to complete',
    type: 'EXCLUSIVE_JOIN',
    color: '#9c27b0',
  },
  {
    id: 'SWITCH',
    name: 'Switch',
    description: 'Conditional branching logic',
    type: 'SWITCH',
    color: '#9c27b0',
  },
  {
    id: 'DO_WHILE',
    name: 'Do While',
    description: 'Loop until condition is met',
    type: 'DO_WHILE',
    color: '#9c27b0',
  },
  {
    id: 'DYNAMIC',
    name: 'Dynamic',
    description: 'Execute a task determined dynamically at runtime',
    type: 'DYNAMIC',
    color: '#9c27b0',
  },
  {
    id: 'LAMBDA',
    name: 'Lambda',
    description: 'Execute inline JavaScript expressions',
    type: 'LAMBDA',
    color: '#9c27b0',
  },
  {
    id: 'INLINE',
    name: 'Inline',
    description: 'Execute inline code',
    type: 'INLINE_OPERATOR',
    color: '#9c27b0',
  },
  {
    id: 'WAIT',
    name: 'Wait',
    description: 'Wait for a specified duration',
    type: 'WAIT',
    color: '#9c27b0',
  },
  {
    id: 'EVENT',
    name: 'Event',
    description: 'Wait for an external event',
    type: 'EVENT',
    color: '#9c27b0',
  },
  {
    id: 'SET_VARIABLE',
    name: 'Set Variable',
    description: 'Set workflow variables',
    type: 'SET_VARIABLE',
    color: '#9c27b0',
  },
  {
    id: 'SUB_WORKFLOW',
    name: 'Sub Workflow',
    description: 'Execute a sub-workflow',
    type: 'SUB_WORKFLOW_OPERATOR',
    color: '#9c27b0',
  },
  {
    id: 'TERMINATE',
    name: 'Terminate',
    description: 'Terminate the workflow execution',
    type: 'TERMINATE',
    color: '#f44336',
  },
];

// System Tasks
const systemTasks = [
  {
    id: 'HTTP',
    name: 'HTTP',
    description: 'Make HTTP API calls',
    type: 'HTTP',
    color: '#ff9800',
  },
  {
    id: 'KAFKA_PUBLISH',
    name: 'Kafka Publish',
    description: 'Publish messages to Kafka',
    type: 'KAFKA_PUBLISH',
    color: '#ff9800',
  },
  {
    id: 'GRPC',
    name: 'gRPC',
    description: 'Make gRPC service calls',
    type: 'GRPC',
    color: '#ff9800',
  },
  {
    id: 'JSON_JQ_TRANSFORM',
    name: 'JSON JQ Transform',
    description: 'Transform JSON using JQ expressions',
    type: 'JSON_JQ_TRANSFORM',
    color: '#ff9800',
  },
  {
    id: 'JSON_JQ_TRANSFORM_STRING',
    name: 'JSON JQ Transform (String)',
    description: 'Transform JSON strings using JQ expressions',
    type: 'JSON_JQ_TRANSFORM_STRING',
    color: '#ff9800',
  },
  {
    id: 'NOOP',
    name: 'No-Op',
    description: 'No operation - placeholder task',
    type: 'NOOP',
    color: '#ff9800',
  },
];

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
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
  const [isHttpConfigModalOpen, setIsHttpConfigModalOpen] = useState(false);
  const [isKafkaPublishModalOpen, setIsKafkaPublishModalOpen] = useState(false);
  const [isGrpcModalOpen, setIsGrpcModalOpen] = useState(false);
  const [isJsonJqTransformModalOpen, setIsJsonJqTransformModalOpen] = useState(false);
  const [isJsonJqTransformStringModalOpen, setIsJsonJqTransformStringModalOpen] = useState(false);
  const [isNoopModalOpen, setIsNoopModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isWaitModalOpen, setIsWaitModalOpen] = useState(false);
  const [isSetVariableModalOpen, setIsSetVariableModalOpen] = useState(false);
  const [isSubWorkflowModalOpen, setIsSubWorkflowModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [isInlineModalOpen, setIsInlineModalOpen] = useState(false);
  const [isSimpleTaskModalOpen, setIsSimpleTaskModalOpen] = useState(false);
  
  // Operator Modals
  const [isForkJoinModalOpen, setIsForkJoinModalOpen] = useState(false);
  const [isForkJoinDynamicModalOpen, setIsForkJoinDynamicModalOpen] = useState(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [isDoWhileModalOpen, setIsDoWhileModalOpen] = useState(false);
  const [isDynamicModalOpen, setIsDynamicModalOpen] = useState(false);
  const [isLambdaModalOpen, setIsLambdaModalOpen] = useState(false);
  const [isOperatorInlineModalOpen, setIsOperatorInlineModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isExclusiveJoinModalOpen, setIsExclusiveJoinModalOpen] = useState(false);
  const [isOperatorSubWorkflowModalOpen, setIsOperatorSubWorkflowModalOpen] = useState(false);
  
  const [selectedNodeForConfig, setSelectedNodeForConfig] = useState<Node | null>(null);
  const [pendingNodeForAutoConfig, setPendingNodeForAutoConfig] = useState<Node | null>(null); // For auto-opening config after drag/drop

  // Define handlers first without dependencies on each other
  const handleEditNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNodeForConfig(node);
      // Open the correct modal based on task type
      switch (node.data.taskType) {
        case 'HTTP':
          setIsHttpConfigModalOpen(true);
          break;
        case 'KAFKA_PUBLISH':
          setIsKafkaPublishModalOpen(true);
          break;
        case 'GRPC':
          setIsGrpcModalOpen(true);
          break;
        case 'JSON_JQ_TRANSFORM':
          setIsJsonJqTransformModalOpen(true);
          break;
        case 'JSON_JQ_TRANSFORM_STRING':
          setIsJsonJqTransformStringModalOpen(true);
          break;
        case 'NOOP':
          setIsNoopModalOpen(true);
          break;
        case 'EVENT':
          setIsEventModalOpen(true);
          break;
        case 'WAIT':
          setIsWaitModalOpen(true);
          break;
        case 'SET_VARIABLE':
          setIsSetVariableModalOpen(true);
          break;
        case 'SUB_WORKFLOW':
          setIsSubWorkflowModalOpen(true);
          break;
        case 'TERMINATE':
          setIsTerminateModalOpen(true);
          break;
        case 'INLINE':
          setIsInlineModalOpen(true);
          break;
        case 'SIMPLE':
          setIsSimpleTaskModalOpen(true);
          break;
        case 'FORK_JOIN':
          setIsForkJoinModalOpen(true);
          break;
        case 'FORK_JOIN_DYNAMIC':
          setIsForkJoinDynamicModalOpen(true);
          break;
        case 'SWITCH':
          setIsSwitchModalOpen(true);
          break;
        case 'DO_WHILE':
          setIsDoWhileModalOpen(true);
          break;
        case 'DYNAMIC':
          setIsDynamicModalOpen(true);
          break;
        case 'LAMBDA':
          setIsLambdaModalOpen(true);
          break;
        case 'INLINE_OPERATOR':
          setIsOperatorInlineModalOpen(true);
          break;
        case 'JOIN':
          setIsJoinModalOpen(true);
          break;
        case 'EXCLUSIVE_JOIN':
          setIsExclusiveJoinModalOpen(true);
          break;
        case 'SUB_WORKFLOW_OPERATOR':
          setIsOperatorSubWorkflowModalOpen(true);
          break;
        default:
          toast({
            title: 'Configuration not available',
            description: `No specific configuration modal for task type: ${node.data.taskType}`,
            variant: 'destructive',
          });
          setSelectedNodeForConfig(null);
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
                label: config.taskReferenceName || config.name,
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

  const handleSaveHttpTaskConfig = useCallback((config: any) => {
    const targetNode = selectedNodeForConfig || pendingNodeForAutoConfig;
    if (targetNode?.id) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === targetNode.id
            ? {
                ...node,
                data: {
                  ...node.data,
                  config: config,
                  label: config.taskReferenceName || config.name,
                },
              }
            : node
        )
      );

      toast({
        title: 'Configuration saved',
        description: 'HTTP task configuration has been updated.',
      });
    }

    setSelectedNodeForConfig(null);
    setPendingNodeForAutoConfig(null);
    setIsHttpConfigModalOpen(false);
  }, [selectedNodeForConfig, pendingNodeForAutoConfig, setNodes, toast]);

  // Generic save handler for task configs
  const createTaskConfigHandler = useCallback((
    taskType: string,
    setModalOpen: (open: boolean) => void
  ) => {
    return (config: any) => {
      const targetNode = selectedNodeForConfig || pendingNodeForAutoConfig;
      if (targetNode?.id) {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === targetNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    config: config,
                    label: config.taskReferenceName || config.name,
                  },
                }
              : node
          )
        );

        toast({
          title: 'Configuration saved',
          description: `${taskType} task configuration has been updated.`,
        });
      }

      setSelectedNodeForConfig(null);
      setPendingNodeForAutoConfig(null);
      setModalOpen(false);
    };
  }, [selectedNodeForConfig, pendingNodeForAutoConfig, setNodes, toast]);

  const handleSaveKafkaTaskConfig = useCallback((config: KafkaPublishTaskConfig) =>
    createTaskConfigHandler('Kafka Publish', setIsKafkaPublishModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveGrpcTaskConfig = useCallback((config: GrpcTaskConfig) =>
    createTaskConfigHandler('gRPC', setIsGrpcModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveJsonJqTransformConfig = useCallback((config: JsonJqTransformTaskConfig) =>
    createTaskConfigHandler('JSON JQ Transform', setIsJsonJqTransformModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveJsonJqTransformStringConfig = useCallback((config: JsonJqTransformStringTaskConfig) =>
    createTaskConfigHandler('JSON JQ Transform String', setIsJsonJqTransformStringModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveNoopConfig = useCallback((config: NoopSystemTaskConfig) =>
    createTaskConfigHandler('No-Op', setIsNoopModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveEventConfig = useCallback((config: EventSystemTaskConfig) =>
    createTaskConfigHandler('Event', setIsEventModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveWaitConfig = useCallback((config: WaitSystemTaskConfig) =>
    createTaskConfigHandler('Wait', setIsWaitModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveSetVariableConfig = useCallback((config: SetVariableSystemTaskConfig) =>
    createTaskConfigHandler('Set Variable', setIsSetVariableModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveSubWorkflowConfig = useCallback((config: SubWorkflowSystemTaskConfig) =>
    createTaskConfigHandler('Sub Workflow', setIsSubWorkflowModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveTerminateConfig = useCallback((config: TerminateSystemTaskConfig) =>
    createTaskConfigHandler('Terminate', setIsTerminateModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveInlineConfig = useCallback((config: InlineSystemTaskConfig) =>
    createTaskConfigHandler('Inline', setIsInlineModalOpen)(config),
    [createTaskConfigHandler]
  );

  // Operator Modal Handlers
  const handleSaveForkJoinConfig = useCallback((config: ForkJoinConfig) =>
    createTaskConfigHandler('Fork Join', setIsForkJoinModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveForkJoinDynamicConfig = useCallback((config: ForkJoinDynamicConfig) =>
    createTaskConfigHandler('Fork Join Dynamic', setIsForkJoinDynamicModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveSwitchConfig = useCallback((config: SwitchConfig) =>
    createTaskConfigHandler('Switch', setIsSwitchModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveDoWhileConfig = useCallback((config: DoWhileConfig) =>
    createTaskConfigHandler('Do While', setIsDoWhileModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveDynamicConfig = useCallback((config: DynamicConfig) =>
    createTaskConfigHandler('Dynamic', setIsDynamicModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveLambdaConfig = useCallback((config: LambdaConfig) =>
    createTaskConfigHandler('Lambda', setIsLambdaModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveOperatorInlineConfig = useCallback((config: InlineConfig) =>
    createTaskConfigHandler('Inline Operator', setIsOperatorInlineModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveJoinConfig = useCallback((config: JoinConfig) =>
    createTaskConfigHandler('Join', setIsJoinModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveExclusiveJoinConfig = useCallback((config: ExclusiveJoinConfig) =>
    createTaskConfigHandler('Exclusive Join', setIsExclusiveJoinModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveOperatorSubWorkflowConfig = useCallback((config: SubWorkflowConfig) =>
    createTaskConfigHandler('Sub Workflow Operator', setIsOperatorSubWorkflowModalOpen)(config),
    [createTaskConfigHandler]
  );

  const handleSaveSimpleTaskConfig = useCallback((config: WorkflowTaskConfig, nodeId?: string) => {
    // Get the node ID from selectedNodeForConfig, pendingNodeForAutoConfig, or parameter
    const targetNodeId = nodeId || selectedNodeForConfig?.id || pendingNodeForAutoConfig?.id;

    if (!targetNodeId) {
      console.error('No node ID found for saving simple task config');
      return;
    }

    setNodes((nds) => {
      // Find the node in the current state
      const nodeExists = nds.some(n => n.id === targetNodeId);

      if (!nodeExists) {
        console.warn(`Node with ID ${targetNodeId} not found in nodes array`, nds.map(n => n.id));
        return nds; // Node not found, don't update
      }

      return nds.map((node) =>
        node.id === targetNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                config: config,
                label: config.taskReferenceName || config.name,
              },
            }
          : node
      );
    });

    setSelectedNodeForConfig(null);
    setPendingNodeForAutoConfig(null);
    setIsSimpleTaskModalOpen(false);
  }, [selectedNodeForConfig, pendingNodeForAutoConfig, setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const taskId = event.dataTransfer.getData('application/reactflow');
      if (!taskId) return;

      // Search in system tasks, worker tasks, and operators
      const task = systemTasks.find((t) => t.id === taskId) || workerTasks.find((t) => t.id === taskId) || operators.find((t) => t.id === taskId);
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
          const lastNode = nds.at(-1)!;
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

      // Auto-open config modal for tasks that require configuration
      const pendingNode = {
        id: taskRefId,
        type: 'custom' as const,
        position,
        data: {
          label: taskRefId,
          taskType: task.type,
          taskName: task.name,
          color: task.color,
          sequenceNo: 1,
          onEdit: handleEditNode,
          onDelete: handleDeleteNode,
        },
      };

      setPendingNodeForAutoConfig(pendingNode);

      // Open the appropriate modal based on task type
      switch (task.type) {
        case 'HTTP':
          setIsHttpConfigModalOpen(true);
          break;
        case 'KAFKA_PUBLISH':
          setIsKafkaPublishModalOpen(true);
          break;
        case 'GRPC':
          setIsGrpcModalOpen(true);
          break;
        case 'JSON_JQ_TRANSFORM':
          setIsJsonJqTransformModalOpen(true);
          break;
        case 'JSON_JQ_TRANSFORM_STRING':
          setIsJsonJqTransformStringModalOpen(true);
          break;
        case 'NOOP':
          setIsNoopModalOpen(true);
          break;
        case 'EVENT':
          setIsEventModalOpen(true);
          break;
        case 'WAIT':
          setIsWaitModalOpen(true);
          break;
        case 'SET_VARIABLE':
          setIsSetVariableModalOpen(true);
          break;
        case 'SUB_WORKFLOW':
          setIsSubWorkflowModalOpen(true);
          break;
        case 'TERMINATE':
          setIsTerminateModalOpen(true);
          break;
        case 'INLINE':
          setIsInlineModalOpen(true);
          break;
        case 'SIMPLE':
          setIsSimpleTaskModalOpen(true);
          break;
        case 'FORK_JOIN':
          setIsForkJoinModalOpen(true);
          break;
        case 'FORK_JOIN_DYNAMIC':
          setIsForkJoinDynamicModalOpen(true);
          break;
        case 'SWITCH':
          setIsSwitchModalOpen(true);
          break;
        case 'DO_WHILE':
          setIsDoWhileModalOpen(true);
          break;
        case 'DYNAMIC':
          setIsDynamicModalOpen(true);
          break;
        case 'LAMBDA':
          setIsLambdaModalOpen(true);
          break;
        case 'INLINE_OPERATOR':
          setIsOperatorInlineModalOpen(true);
          break;
        case 'JOIN':
          setIsJoinModalOpen(true);
          break;
        case 'EXCLUSIVE_JOIN':
          setIsExclusiveJoinModalOpen(true);
          break;
        case 'SUB_WORKFLOW_OPERATOR':
          setIsOperatorSubWorkflowModalOpen(true);
          break;
        default:
          // For tasks without modals, just clear the pending node
          setPendingNodeForAutoConfig(null);
      }
    },
    [setNodes, setEdges, handleEditNode, handleDeleteNode, setIsHttpConfigModalOpen, setIsKafkaPublishModalOpen, setIsGrpcModalOpen, setIsJsonJqTransformModalOpen, setIsJsonJqTransformStringModalOpen, setIsNoopModalOpen, setIsEventModalOpen, setIsWaitModalOpen, setIsSetVariableModalOpen, setIsSubWorkflowModalOpen, setIsTerminateModalOpen, setIsInlineModalOpen, setIsSimpleTaskModalOpen, setIsForkJoinModalOpen, setIsForkJoinDynamicModalOpen, setIsSwitchModalOpen, setIsDoWhileModalOpen, setIsLambdaModalOpen, setIsOperatorInlineModalOpen, setIsJoinModalOpen, setIsExclusiveJoinModalOpen, setIsOperatorSubWorkflowModalOpen]
  );

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

  const handleSave = (): boolean => {
    if (!workflow) {
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
      return false;
    }

    // Update existing workflow
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

  const filteredWorkerTasks = workerTasks.filter(
    (task) =>
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOperators = operators.filter(
    (task) =>
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSystemTasks = systemTasks.filter(
    (task) =>
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitialConfig = (taskType: string) => {
    if (selectedNodeForConfig?.data?.taskType === taskType) {
      return selectedNodeForConfig.data.config;
    }
    if (pendingNodeForAutoConfig?.data?.taskType === taskType) {
      return pendingNodeForAutoConfig.data.config;
    }
    return undefined;
  };

  return (
    <>
      <div className="h-full flex flex-col bg-[#1a1f2e]">
        {/* Top Bar */}
        <div className="h-16 bg-[#1a1f2e] border-b border-[#2a3142] px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo and App Name */}
            <img
              src={logo}
              alt="Netflix Conductor Designer Logo"
              className="h-8 w-8 mr-3 select-none"
              draggable={false}
              style={{ minWidth: 32 }}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-white">Netflix Conductor Designer</span>
                <span className="text-base font-semibold text-white">/</span>
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
                  {filteredWorkerTasks.map((task) => (
                    <button
                      key={task.id}
                      className="w-full group p-3 bg-[#0f1419] border border-[#2a3142] rounded-lg cursor-move hover:border-cyan-500 transition-all duration-200 text-left"
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
                    </button>
                  ))}
                </div>
              </div>

              {/* Operators */}
              <div>
                <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  Operators
                </h4>
                <div className="space-y-2">
                  {filteredOperators.map((task) => (
                    <button
                      key={task.id}
                      className="w-full group p-3 bg-[#0f1419] border border-[#2a3142] rounded-lg cursor-move hover:border-purple-500 transition-all duration-200 text-left"
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
                    </button>
                  ))}
                </div>
              </div>

              {/* System Tasks */}
              <div>
                <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  System Tasks
                </h4>
                <div className="space-y-2">
                  {filteredSystemTasks.map((task) => (
                    <button
                      key={task.id}
                      className="w-full group p-3 bg-[#0f1419] border border-[#2a3142] rounded-lg cursor-move hover:border-orange-500 transition-all duration-200 text-left"
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
                    </button>
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
                <section 
                  className="flex-1 relative"
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  aria-label="Workflow canvas"
                >
                    {nodes.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center max-w-md">
                          <div className="w-16 h-16 bg-[#2a3142] rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                </section>
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
                            onChange={(e) => setWorkflowSettings({ ...workflowSettings, timeoutSeconds: Number.parseInt(e.target.value) || 3600 })}
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
                            inputParameters: e.target.value.split(',').map(p => p.trim()).filter(Boolean) 
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
                            } catch {
                              // Invalid JSON - silently ignore to allow editing
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
                          tasks: [...nodes]
                            .sort((a, b) => (a.data.sequenceNo || 0) - (b.data.sequenceNo || 0))
                            .map(node => {
                              // If task has config, use it directly (it should be in proper OSS Conductor format)
                              if (node.data.config) {
                                return node.data.config;
                              }

                              // Fallback for tasks without config
                              return {
                                name: node.data.taskName,
                                taskReferenceName: node.id,
                                type: node.data.taskType,
                                inputParameters: {},
                                optional: false,
                              };
                            }),
                          inputParameters: workflowSettings.inputParameters,
                          outputParameters: workflowSettings.outputParameters,
                          timeoutSeconds: workflowSettings.timeoutSeconds,
                          restartable: workflowSettings.restartable,
                          schemaVersion: workflowSettings.schemaVersion,
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
                      tasks: [...nodes]
                        .sort((a, b) => (a.data.sequenceNo || 0) - (b.data.sequenceNo || 0))
                        .map(node => {
                          // If task has config, use it directly (it should be in proper OSS Conductor format)
                          if (node.data.config) {
                            return node.data.config;
                          }

                          // Fallback for tasks without config
                          return {
                            name: node.data.taskName,
                            taskReferenceName: node.id,
                            type: node.data.taskType,
                            inputParameters: {},
                            optional: false,
                          };
                        }),
                      inputParameters: workflowSettings.inputParameters,
                      outputParameters: workflowSettings.outputParameters,
                      timeoutSeconds: workflowSettings.timeoutSeconds,
                      restartable: workflowSettings.restartable,
                      schemaVersion: workflowSettings.schemaVersion,
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
        initialConfig={getInitialConfig('HTTP')}
        onSave={handleSaveHttpTaskConfig}
      />

      <KafkaPublishTaskModal
        open={isKafkaPublishModalOpen}
        onOpenChange={(open) => {
          setIsKafkaPublishModalOpen(open);
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
        onSave={handleSaveKafkaTaskConfig}
      />

      <GrpcTaskModal
        open={isGrpcModalOpen}
        onOpenChange={(open) => {
          setIsGrpcModalOpen(open);
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
        onSave={handleSaveGrpcTaskConfig}
      />

      <JsonJqTransformTaskModal
        open={isJsonJqTransformModalOpen}
        onOpenChange={(open) => {
          setIsJsonJqTransformModalOpen(open);
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
        onSave={handleSaveJsonJqTransformConfig}
      />

      <JsonJqTransformStringTaskModal
        open={isJsonJqTransformStringModalOpen}
        onOpenChange={(open) => {
          setIsJsonJqTransformStringModalOpen(open);
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
        onSave={handleSaveJsonJqTransformStringConfig}
      />

      <NoopSystemTaskModal
        open={isNoopModalOpen}
        onOpenChange={(open) => {
          setIsNoopModalOpen(open);
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
        onSave={handleSaveNoopConfig}
      />

      <EventSystemTaskModal
        open={isEventModalOpen}
        onOpenChange={(open) => {
          setIsEventModalOpen(open);
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
        onSave={handleSaveEventConfig}
      />

      <WaitSystemTaskModal
        open={isWaitModalOpen}
        onOpenChange={(open) => {
          setIsWaitModalOpen(open);
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
        onSave={handleSaveWaitConfig}
      />

      <SetVariableSystemTaskModal
        open={isSetVariableModalOpen}
        onOpenChange={(open) => {
          setIsSetVariableModalOpen(open);
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
        onSave={handleSaveSetVariableConfig}
      />

      <SubWorkflowSystemTaskModal
        open={isSubWorkflowModalOpen}
        onOpenChange={(open) => {
          setIsSubWorkflowModalOpen(open);
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
        onSave={handleSaveSubWorkflowConfig}
      />

      <TerminateSystemTaskModal
        open={isTerminateModalOpen}
        onOpenChange={(open) => {
          setIsTerminateModalOpen(open);
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
        onSave={handleSaveTerminateConfig}
      />

      <InlineSystemTaskModal
        open={isInlineModalOpen}
        onOpenChange={(open) => {
          setIsInlineModalOpen(open);
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
        onSave={handleSaveInlineConfig}
      />

      <SimpleTaskModal
        open={isSimpleTaskModalOpen}
        onOpenChange={(open) => {
          setIsSimpleTaskModalOpen(open);
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
        onSave={async (config) => {
          const targetNode = selectedNodeForConfig || pendingNodeForAutoConfig;
          if (targetNode?.id) {
            handleSaveSimpleTaskConfig(config, targetNode.id);
          }
        }}
      />

      {/* Operator Modals */}
      <ForkJoinModal
        open={isForkJoinModalOpen}
        onOpenChange={(open) => {
          setIsForkJoinModalOpen(open);
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
        onSave={handleSaveForkJoinConfig}
      />

      <ForkJoinDynamicModal
        open={isForkJoinDynamicModalOpen}
        onOpenChange={(open) => {
          setIsForkJoinDynamicModalOpen(open);
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
        onSave={handleSaveForkJoinDynamicConfig}
      />

      <SwitchModal
        open={isSwitchModalOpen}
        onOpenChange={(open) => {
          setIsSwitchModalOpen(open);
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
        onSave={handleSaveSwitchConfig}
      />

      <DoWhileModal
        open={isDoWhileModalOpen}
        onOpenChange={(open) => {
          setIsDoWhileModalOpen(open);
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
        onSave={handleSaveDoWhileConfig}
      />

      <DynamicModal
        open={isDynamicModalOpen}
        onOpenChange={(open) => {
          setIsDynamicModalOpen(open);
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
        onSave={handleSaveDynamicConfig}
      />

      <LambdaModal
        open={isLambdaModalOpen}
        onOpenChange={(open) => {
          setIsLambdaModalOpen(open);
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
        onSave={handleSaveLambdaConfig}
      />

      <InlineModal
        open={isOperatorInlineModalOpen}
        onOpenChange={(open) => {
          setIsOperatorInlineModalOpen(open);
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
        onSave={handleSaveOperatorInlineConfig}
      />

      <JoinModal
        open={isJoinModalOpen}
        onOpenChange={(open) => {
          setIsJoinModalOpen(open);
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
        onSave={handleSaveJoinConfig}
      />

      <ExclusiveJoinModal
        open={isExclusiveJoinModalOpen}
        onOpenChange={(open) => {
          setIsExclusiveJoinModalOpen(open);
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
        onSave={handleSaveExclusiveJoinConfig}
      />

      <SubWorkflowModal
        open={isOperatorSubWorkflowModalOpen}
        onOpenChange={(open) => {
          setIsOperatorSubWorkflowModalOpen(open);
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
        onSave={handleSaveOperatorSubWorkflowConfig}
      />
    </>
  );
}
