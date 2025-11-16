import { useCallback, useState, useEffect } from 'react';
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
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useWorkflowStore, WorkflowSettings } from '@/stores/workflowStore';
import { SaveIcon, PlayIcon, EyeIcon, LayoutGridIcon } from 'lucide-react';
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

// Extracted modules
import { CustomNode } from '@/components/workflow/CustomNode';
import { TaskLibrarySidebar } from '@/components/workflow/TaskLibrarySidebar';
import { workerTasks, operators, systemTasks } from '@/constants/taskDefinitions';
import { formatDate, formatDateForInput, formatDateFromInput } from '@/utils/dateFormatters';
import { useTaskModals } from '@/hooks/useTaskModals';

import logo from '../../resources/logo.svg';

const nodeTypes = {
  custom: CustomNode,
};

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

  // Use the task modals hook
  const {
    states: modalStates,
    actions: modalActions,
    selectedNodeForConfig,
    setSelectedNodeForConfig,
    pendingNodeForAutoConfig,
    setPendingNodeForAutoConfig,
    pendingTaskDrop,
    setPendingTaskDrop,
  } = useTaskModals();

  // Define edit and delete handlers BEFORE useEffects that use them
  const handleEditNode = useCallback((nodeId: string) => {
    console.log('handleEditNode called with nodeId:', nodeId);
    const node = nodes.find(n => n.id === nodeId);
    console.log('Found node:', node);
    if (node) {
      console.log('Setting selectedNodeForConfig to:', node);
      setSelectedNodeForConfig(node);
      // Open the correct modal based on task type
      console.log('Opening modal for task type:', node.data.taskType);
      modalActions.openModalForTaskType(node.data.taskType);
      
      // Check if no modal was opened (unknown task type)
      if (!node.data.taskType) {
        toast({
          title: 'Configuration not available',
          description: `No specific configuration modal for task type: ${node.data.taskType}`,
          variant: 'destructive',
        });
        setSelectedNodeForConfig(null);
      }
    }
  }, [nodes, toast, modalActions, setSelectedNodeForConfig]);

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
  }, [setNodes, setEdges]);

  // Load workflow data on mount or when workflow changes
  useEffect(() => {
    if (workflow) {
      setWorkflowName(workflow.name);
      if (workflow.settings) {
        setWorkflowSettings(workflow.settings);
      }
      // Load nodes and edges from the workflow
      if (workflow.nodes && workflow.nodes.length > 0) {
        setNodes(workflow.nodes.map(node => ({ 
          ...node, 
          draggable: false,
          data: {
            ...node.data,
            onEdit: handleEditNode,
            onDelete: handleDeleteNode,
          }
        })));
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

  // Update node handlers after they're loaded or when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      // Check if any node is missing handlers
      const needsUpdate = nodes.some(node => !node.data.onEdit || !node.data.onDelete);
      
      if (needsUpdate) {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]); // Only check when nodes count changes

  // Auto-arrange nodes whenever they change (but not on initial load)
  useEffect(() => {
    if (nodes.length > 0) {
      // Auto-arrange nodes in snake pattern whenever a new node is added
      const sortedNodes = [...nodes].sort((a, b) => {
        const seqA = a.data.sequenceNo || 0;
        const seqB = b.data.sequenceNo || 0;
        return seqA - seqB;
      });

      // Configuration for snake layout
      const nodesPerRow = 6;
      const horizontalSpacing = 200;
      const verticalSpacing = 120;
      const startX = 50;
      const startY = 50;

      // Arrange nodes in a snake pattern
      const arrangedNodes = sortedNodes.map((node, index) => {
        const rowIndex = Math.floor(index / nodesPerRow);
        const colIndex = index % nodesPerRow;
        const isOddRow = rowIndex % 2 === 1;
        const actualColIndex = isOddRow ? (nodesPerRow - 1 - colIndex) : colIndex;

        return {
          ...node,
          draggable: false,
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
        
        const sourceIndex = i;
        const targetIndex = i + 1;
        const sourceRow = Math.floor(sourceIndex / nodesPerRow);
        const targetRow = Math.floor(targetIndex / nodesPerRow);
        const isRowTransition = sourceRow !== targetRow;
        
        let sourceHandle = 'right';
        let targetHandle = 'left';
        
        if (isRowTransition) {
          sourceHandle = 'bottom';
          targetHandle = 'top';
        }
        
        newEdges.push({
          id: `${sourceNode.id}-${targetNode.id}`,
          source: sourceNode.id,
          sourceHandle: sourceHandle,
          target: targetNode.id,
          targetHandle: targetHandle,
          type: 'straight',
          animated: true,
          style: { stroke: '#00bcd4', strokeWidth: 2 },
        });
      }
      setEdges(newEdges);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]); // Only run when node count changes

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
        sourceHandle: params.sourceHandle || 'right',
        targetHandle: params.targetHandle || 'left',
        type: 'bezier',
        animated: true,
        style: { stroke: '#00bcd4', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [nodes, setEdges, toast]
  );

  // Modal state declarations moved to top before handleEditNode

  // Helper to update a single node with new config
  const updateNodeWithConfig = (node: any, targetNodeId: string, config: any) => {
    if (node.id === targetNodeId) {
      return {
        ...node,
        data: {
          ...node.data,
          config: config,
          label: config.taskReferenceName || config.name,
          onEdit: handleEditNode,
          onDelete: handleDeleteNode,
        },
      };
    }
    return node;
  };

  // Helper to extract workflow tasks from nodes
  const extractWorkflowTasks = (nodes: any[]) => {
    const sortedNodes = [...nodes];
    sortedNodes.sort((a, b) => (a.data.sequenceNo || 0) - (b.data.sequenceNo || 0));
    return sortedNodes
      .map(node => node.data.config)
      .filter(Boolean); // Remove nodes without config
  };

  // Helper to handle the config save logic
  const saveTaskConfigLogic = (
    config: any,
    setModalOpen: (open: boolean) => void
  ) => {
    // Check if this is a new drop (pendingTaskDrop exists) or editing existing node
    if (pendingTaskDrop) {
      // Creating a new node from drag & drop
      const taskRefId = config.taskReferenceName || `${pendingTaskDrop.taskType.toLowerCase()}_${Date.now()}`;
      
      setNodes((nds) => {
        const sequenceNo = nds.length + 1;
        
        const newNode: Node = {
          id: taskRefId,
          type: 'custom',
          position: { x: 0, y: 0 }, // Temporary position - will be arranged automatically
          draggable: false,
          data: {
            label: config.taskReferenceName || config.name,
            taskType: pendingTaskDrop.taskType,
            taskName: pendingTaskDrop.taskName,
            color: pendingTaskDrop.color,
            sequenceNo: sequenceNo,
            config: config,
            onEdit: handleEditNode,
            onDelete: handleDeleteNode,
          },
        };
        
        const updatedNodes = [...nds, newNode];

        // Update workflow tasks array with all configured tasks
        if (workflow) {
          const workflowTasks = extractWorkflowTasks(updatedNodes);
          updateWorkflow(workflow.id, { tasks: workflowTasks });
        }

        return updatedNodes;
      });

      setPendingTaskDrop(null);
      // Auto-arrange will be triggered by nodes state change via useEffect
    } else {
      // Editing existing node
      const targetNode = selectedNodeForConfig || pendingNodeForAutoConfig;
      if (!targetNode?.id) return;

      setNodes((nds) => {
        const updatedNodes = nds.map((node) => updateNodeWithConfig(node, targetNode.id, config));

        // Update workflow tasks array with all configured tasks
        if (workflow) {
          const workflowTasks = extractWorkflowTasks(updatedNodes);
          updateWorkflow(workflow.id, { tasks: workflowTasks });
        }

        return updatedNodes;
      });

      setSelectedNodeForConfig(null);
      setPendingNodeForAutoConfig(null);
    }

    setModalOpen(false);
  };

  // Generic save handler for task configs
  const createTaskConfigHandler = useCallback((
    setModalOpen: (open: boolean) => void
  ) => {
    return (config: any) => {
      saveTaskConfigLogic(config, setModalOpen);
    };
  }, [selectedNodeForConfig, pendingNodeForAutoConfig, pendingTaskDrop, setNodes, setEdges, workflow, updateWorkflow, handleEditNode, handleDeleteNode]);

  const handleSaveHttpTaskConfig = useCallback((config: any) =>
    createTaskConfigHandler(modalActions.setIsHttpConfigModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveKafkaTaskConfig = useCallback((config: KafkaPublishTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsKafkaPublishModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveGrpcTaskConfig = useCallback((config: GrpcTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsGrpcModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveJsonJqTransformConfig = useCallback((config: JsonJqTransformTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsJsonJqTransformModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveJsonJqTransformStringConfig = useCallback((config: JsonJqTransformStringTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsJsonJqTransformStringModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveNoopConfig = useCallback((config: NoopSystemTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsNoopModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveEventConfig = useCallback((config: EventSystemTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsEventModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveWaitConfig = useCallback((config: WaitSystemTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsWaitModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveSetVariableConfig = useCallback((config: SetVariableSystemTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsSetVariableModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveSubWorkflowConfig = useCallback((config: SubWorkflowSystemTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsSubWorkflowModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveTerminateConfig = useCallback((config: TerminateSystemTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsTerminateModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveInlineConfig = useCallback((config: InlineSystemTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsInlineModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  // Operator Modal Handlers
  const handleSaveForkJoinConfig = useCallback((config: ForkJoinConfig) =>
    createTaskConfigHandler(modalActions.setIsForkJoinModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveForkJoinDynamicConfig = useCallback((config: ForkJoinDynamicConfig) =>
    createTaskConfigHandler(modalActions.setIsForkJoinDynamicModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveSwitchConfig = useCallback((config: SwitchConfig) =>
    createTaskConfigHandler(modalActions.setIsSwitchModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveDoWhileConfig = useCallback((config: DoWhileConfig) =>
    createTaskConfigHandler(modalActions.setIsDoWhileModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveDynamicConfig = useCallback((config: DynamicConfig) =>
    createTaskConfigHandler(modalActions.setIsDynamicModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveLambdaConfig = useCallback((config: LambdaConfig) =>
    createTaskConfigHandler(modalActions.setIsLambdaModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveOperatorInlineConfig = useCallback((config: InlineConfig) =>
    createTaskConfigHandler(modalActions.setIsOperatorInlineModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveJoinConfig = useCallback((config: JoinConfig) =>
    createTaskConfigHandler(modalActions.setIsJoinModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveExclusiveJoinConfig = useCallback((config: ExclusiveJoinConfig) =>
    createTaskConfigHandler(modalActions.setIsExclusiveJoinModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveOperatorSubWorkflowConfig = useCallback((config: SubWorkflowConfig) =>
    createTaskConfigHandler(modalActions.setIsOperatorSubWorkflowModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveSimpleTaskConfig = useCallback((config: WorkflowTaskConfig) => {
    saveTaskConfigLogic(config, modalActions.setIsSimpleTaskModalOpen);
  }, [saveTaskConfigLogic, modalActions]);

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

      // Store the pending drop information - node will be created when config is saved
      setPendingTaskDrop({
        taskType: task.type,
        taskName: task.name,
        color: task.color,
        position: position,
      });

      // Open the appropriate modal based on task type
      modalActions.openModalForTaskType(task.type);
    },
    [modalActions, setPendingTaskDrop]
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
        draggable: false,
        position: {
          x: startX + (actualColIndex * horizontalSpacing),
          y: startY + (rowIndex * verticalSpacing),
        },
      };
    });

    setNodes(arrangedNodes);

    // Auto-connect all nodes in sequence with proper row transitions
    const newEdges: Edge[] = [];
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const sourceNode = sortedNodes[i];
      const targetNode = sortedNodes[i + 1];
      
      const sourceIndex = i;
      const targetIndex = i + 1;
      
      // Determine if we're transitioning to the next row
      const sourceRow = Math.floor(sourceIndex / nodesPerRow);
      const targetRow = Math.floor(targetIndex / nodesPerRow);
      const isRowTransition = sourceRow !== targetRow;
      
      // Determine handle positions based on layout
      let sourceHandle = 'right'; // Default: connect from right
      let targetHandle = 'left';  // Default: connect to left
      
      // If it's a row transition (moving to next row)
      if (isRowTransition) {
        // Connect from bottom of last task in row to top of first task in next row
        sourceHandle = 'bottom';
        targetHandle = 'top';
      }
      
      newEdges.push({
        id: `${sourceNode.id}-${targetNode.id}`,
        source: sourceNode.id,
        sourceHandle: sourceHandle,
        target: targetNode.id,
        targetHandle: targetHandle,
        type: 'straight',
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
        id: `workflow-${Date.now()}`,
        name: workflowName,
        description: workflowSettings.description,
        nodes: nodes,
        edges: edges,
        createdAt: new Date().toISOString(),
        status: workflowSettings.status.toLowerCase() as 'draft' | 'active' | 'paused',
        settings: workflowSettings,
      };
      useWorkflowStore.getState().addWorkflow(newWorkflow);
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
      modalActions.setExecuteModalOpen(true);
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
      executeWorkflow(workflowId, input);

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
          <TaskLibrarySidebar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            workerTasks={filteredWorkerTasks}
            operators={filteredOperators}
            systemTasks={filteredSystemTasks}
          />

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
                          type: 'bezier',
                          animated: true,
                          style: { stroke: '#00bcd4', strokeWidth: 2 },
                        }}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
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
                        <div className="col-span-2">
                          <Label className="text-white">Workflow Name *</Label>
                          <Input
                            value={workflowName}
                            onChange={(e) => setWorkflowName(e.target.value)}
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
        open={modalStates.executeModalOpen}
        onOpenChange={modalActions.setExecuteModalOpen}
        workflow={workflow || null}
        onExecute={handleExecuteWorkflow}
      />

      <HttpTaskModal
        open={modalStates.isHttpConfigModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsHttpConfigModalOpen(open);
          if (!open) {
            setPendingTaskDrop(null);
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
        open={modalStates.isKafkaPublishModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsKafkaPublishModalOpen(open);
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
        open={modalStates.isGrpcModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsGrpcModalOpen(open);
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
        open={modalStates.isJsonJqTransformModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsJsonJqTransformModalOpen(open);
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
        open={modalStates.isJsonJqTransformStringModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsJsonJqTransformStringModalOpen(open);
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
        open={modalStates.isNoopModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsNoopModalOpen(open);
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
        open={modalStates.isEventModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsEventModalOpen(open);
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
        open={modalStates.isWaitModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsWaitModalOpen(open);
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
        open={modalStates.isSetVariableModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsSetVariableModalOpen(open);
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
        open={modalStates.isSubWorkflowModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsSubWorkflowModalOpen(open);
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
        open={modalStates.isTerminateModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsTerminateModalOpen(open);
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
        open={modalStates.isInlineModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsInlineModalOpen(open);
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
        open={modalStates.isSimpleTaskModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsSimpleTaskModalOpen(open);
          if (!open) {
            setPendingTaskDrop(null);
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
        initialConfig={selectedNodeForConfig?.data?.config}
        onSave={async (config) => {
          handleSaveSimpleTaskConfig(config);
        }}
      />

      {/* Operator Modals */}
      <ForkJoinModal
        open={modalStates.isForkJoinModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsForkJoinModalOpen(open);
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
        open={modalStates.isForkJoinDynamicModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsForkJoinDynamicModalOpen(open);
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
        open={modalStates.isSwitchModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsSwitchModalOpen(open);
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
        open={modalStates.isDoWhileModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsDoWhileModalOpen(open);
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
        open={modalStates.isDynamicModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsDynamicModalOpen(open);
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
        open={modalStates.isLambdaModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsLambdaModalOpen(open);
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
        open={modalStates.isOperatorInlineModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsOperatorInlineModalOpen(open);
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
        open={modalStates.isJoinModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsJoinModalOpen(open);
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
        open={modalStates.isExclusiveJoinModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsExclusiveJoinModalOpen(open);
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
        open={modalStates.isOperatorSubWorkflowModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsOperatorSubWorkflowModalOpen(open);
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
