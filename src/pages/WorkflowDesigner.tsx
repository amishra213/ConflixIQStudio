import { useCallback, useState, useEffect, useRef } from 'react';
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
import { useWorkflowStore, WorkflowSettings, WorkflowEdge, WorkflowNode, Workflow } from '@/stores/workflowStore';
import { useWorkflowCacheStore } from '@/stores/workflowCacheStore';
import { SaveIcon, PlayIcon, EyeIcon, LayoutGridIcon, ArrowLeftIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { JsonTextarea } from '@/components/ui/json-textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useConductorApi } from '@/hooks/useConductorApi';
import { ExecuteWorkflowModal } from '@/components/modals/ExecuteWorkflowModal';
import { HttpTaskModal } from '@/components/modals/system-tasks/HttpSystemTaskModal';
import { KafkaPublishTaskModal, KafkaPublishTaskConfig } from '@/components/modals/system-tasks/KafkaPublishSystemTaskModal';
import { JsonJqTransformTaskModal, JsonJqTransformTaskConfig } from '@/components/modals/system-tasks/JsonJqTransformSystemTaskModal';
import { NoopSystemTaskModal, NoopSystemTaskConfig } from '@/components/modals/system-tasks/NoopSystemTaskModal';
import { EventSystemTaskModal, EventSystemTaskConfig } from '@/components/modals/system-tasks/EventSystemTaskModal';
import { WaitSystemTaskModal, WaitSystemTaskConfig } from '@/components/modals/system-tasks/WaitSystemTaskModal';
import { TerminateSystemTaskModal, TerminateSystemTaskConfig } from '@/components/modals/system-tasks/TerminateSystemTaskModal';
import { InlineSystemTaskModal, InlineSystemTaskConfig } from '@/components/modals/system-tasks/InlineSystemTaskModal';
import { HumanSystemTaskModal, HumanTaskConfig } from '@/components/modals/system-tasks/HumanSystemTaskModal';
import { SimpleTaskModal, WorkflowTaskConfig } from '@/components/modals/SimpleTaskModal';
import { generateUniqueWorkflowName } from '@/utils/nameGenerator';

// Operator Modals
import { ForkJoinModal, ForkJoinConfig } from '@/components/modals/operators/ForkJoinModal';
import { DynamicForkModal, ForkJoinDynamicConfig } from '@/components/modals/operators/DynamicForkModal';
import { SwitchModal, SwitchConfig } from '@/components/modals/operators/SwitchModal';
import { DoWhileModal, DoWhileConfig } from '@/components/modals/operators/DoWhileModal';
import { DynamicModal, DynamicConfig } from '@/components/modals/operators/DynamicModal';
import { InlineModal, InlineConfig } from '@/components/modals/operators/InlineModal';
import { JoinModal, JoinConfig } from '@/components/modals/operators/JoinModal';
import { SubWorkflowModal, SubWorkflowConfig } from '@/components/modals/operators/SubWorkflowModal';
import { StartWorkflowModal, StartWorkflowConfig } from '@/components/modals/operators/StartWorkflowModal';

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
  const { workflows, updateWorkflow, executeWorkflow, persistWorkflows } = useWorkflowStore();
  const { saveWorkflowToCache, markAsDraft, markAsSyncing, markAsPublished, syncToFileStore } = useWorkflowCacheStore();
  const { toast } = useToast();
  const { saveWorkflow } = useConductorApi({ enableFallback: false });

  const workflow = id ? workflows.find((w) => w.id === id) : null;
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [workflowSettings, setWorkflowSettings] = useState<WorkflowSettings>({
    description: 'A new workflow definition',
    version: 1,
    timeoutSeconds: 3600,
    timeoutPolicy: 'TIME_OUT_WF',
    restartable: true,
    schemaVersion: 2,
    effectiveDate: formatDate(new Date()),
    endDate: formatDate(new Date(new Date().setFullYear(new Date().getFullYear() + 10))),
    status: 'DRAFT',
    inputParameters: [],
    outputParameters: {},
    inputTemplate: {},
    createdBy: 'ConductorHub',
    updatedBy: 'ConductorHub',
    ownerEmail: '',
    ownerApp: '',
    accessPolicy: {},
    variables: {},
    failureWorkflow: '',
    workflowStatusListenerEnabled: false,
  });
  const [activeTab, setActiveTab] = useState('design');
  const [searchQuery, setSearchQuery] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Declare nodes and edges state before useEffect hooks that depend on them
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Refs to track latest state for cleanup on unmount
  const workflowRef = useRef(workflow);
  const workflowNameRef = useRef(workflowName);
  const workflowSettingsRef = useRef(workflowSettings);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  // Update refs when state changes
  useEffect(() => {
    workflowRef.current = workflow;
    workflowNameRef.current = workflowName;
    workflowSettingsRef.current = workflowSettings;
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [workflow, workflowName, workflowSettings, nodes, edges]);

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
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNodeForConfig(node);
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
      
      // Recalculate sequence numbers after deletion (for UI only)
      const updatedNodes = filteredNodes.map((node, index) => {
        const newSequenceNo = index + 1;
        return {
          ...node,
          data: {
            ...node.data,
            sequenceNo: newSequenceNo,
            // Keep config as-is, sequenceNo is only for UI ordering
          },
        };
      });

      // Update workflow tasks array
      if (workflow) {
        const workflowTasks = extractWorkflowTasks(updatedNodes);
        updateWorkflow(workflow.id, { tasks: workflowTasks });
      }

      return updatedNodes;
    });
    
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges, workflow, updateWorkflow]);

  // Helper function to handle loading workflow without an ID
  const handleNoWorkflowId = useCallback(async () => {
    const lastActiveWorkflowId = sessionStorage.getItem('lastActiveWorkflow');
    
    if (lastActiveWorkflowId) {
      navigate(`/workflows/${lastActiveWorkflowId}`, { replace: true });
      return;
    }
    
    // No last active workflow - create a new workflow and redirect to it
    const uniqueName = generateUniqueWorkflowName();
    
    const newWorkflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: uniqueName,
      description: 'A new workflow definition',
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      status: 'draft',
      syncStatus: 'local-only',
    };
    
    useWorkflowStore.getState().addWorkflow(newWorkflow);
    
    await persistWorkflows().catch(err => {
      console.warn('Failed to persist new workflow:', err);
    });
    
    sessionStorage.setItem('lastActiveWorkflow', newWorkflow.id);
    navigate(`/workflows/${newWorkflow.id}`, { replace: true });
  }, [navigate, persistWorkflows]);

  // Helper function to sync workflows from fileStore
  const syncWorkflowsFromFileStore = useCallback(async () => {
    try {
      const { fileStoreClient } = await import('@/utils/fileStore');
      const storedWorkflows = await fileStoreClient.loadWorkflows();
      
      if (storedWorkflows && storedWorkflows.length > 0) {
        const workflowsToLoad: Workflow[] = storedWorkflows.map((w) => ({
          id: w.id,
          name: w.name || 'Unnamed',
          description: w.description,
          nodes: (w.nodes as WorkflowNode[]) || [],
          edges: (w.edges as WorkflowEdge[]) || [],
          createdAt: w.createdAt || new Date().toISOString(),
          status: (w.status as 'draft' | 'active' | 'paused') || 'draft',
        }));
        useWorkflowStore.getState().loadWorkflows(workflowsToLoad);
      }
    } catch (err) {
      console.warn('Error syncing workflows from fileStore:', err);
    }
  }, []);

  // Helper function to load nodes and edges from workflow
  const loadNodesAndEdgesFromWorkflow = useCallback((foundWorkflow: Workflow) => {
    setWorkflowName(foundWorkflow.name);
    if (foundWorkflow.settings) {
      setWorkflowSettings(foundWorkflow.settings);
    }
    
    if (foundWorkflow.nodes && foundWorkflow.nodes.length > 0) {
      setNodes(foundWorkflow.nodes.map(node => ({ 
        ...node, 
        draggable: false,
        data: {
          ...node.data,
          onEdit: handleEditNode,
          onDelete: handleDeleteNode,
        }
      })));
    } else {
      setNodes([]);
    }
    
    if (foundWorkflow.edges && foundWorkflow.edges.length > 0) {
      setEdges(foundWorkflow.edges as Edge[]);
    } else {
      setEdges([]);
    }
  }, [handleEditNode, handleDeleteNode, setNodes, setEdges]);

  // Initialize/Load workflow on component mount or when ID changes
  useEffect(() => {
    const loadWorkflow = async () => {
      if (!id) {
        await handleNoWorkflowId();
        return;
      }

      sessionStorage.setItem('lastActiveWorkflow', id);
      
      await syncWorkflowsFromFileStore();
      
      const foundWorkflow = useWorkflowStore.getState().workflows.find((w) => w.id === id);
      
      if (foundWorkflow) {
        loadNodesAndEdgesFromWorkflow(foundWorkflow);
      } else {
        console.warn('Workflow not found after fileStore sync:', id);
        setNodes([]);
        setEdges([]);
      }
    };

    loadWorkflow();

    // Cleanup: Reset when component unmounts
    return () => {
      // Cleanup logic
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id

  // Persist workflow state when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // Save current workflow state before unmounting using refs to get latest values
      // Use the ID from URL params, not the workflow ref which might be null
      if (id && nodesRef.current.length > 0) {
        // Check if workflow exists in store
        const existingWorkflow = useWorkflowStore.getState().workflows.find((w) => w.id === id);
        
        if (existingWorkflow) {
          // Update the workflow in store
          updateWorkflow(id, {
            name: workflowNameRef.current,
            settings: workflowSettingsRef.current,
            nodes: nodesRef.current,
            edges: edgesRef.current as WorkflowEdge[],
          });
        } else {
          // Workflow doesn't exist in store, add it
          const newWorkflow: Workflow = {
            id: id,
            name: workflowNameRef.current,
            description: workflowSettingsRef.current.description,
            nodes: nodesRef.current,
            edges: edgesRef.current as WorkflowEdge[],
            createdAt: new Date().toISOString(),
            status: 'draft',
            syncStatus: 'local-only',
            settings: workflowSettingsRef.current,
          };
          useWorkflowStore.getState().addWorkflow(newWorkflow);
        }
        
        // Get all workflows from store and persist IMMEDIATELY
        const workflows = useWorkflowStore.getState().workflows;
        
        // Save directly to localStorage for immediate persistence (fileStore may take longer)
        try {
          localStorage.setItem('workflows', JSON.stringify(workflows));
        } catch (err) {
          console.warn('Failed to save to localStorage on unmount:', err);
        }
        
        // Also start an async persist to fileStore (fire and forget, since unmount can't wait)
        persistWorkflows().catch(err => {
          console.warn('Failed to persist workflows to fileStore on unmount:', err);
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on unmount, uses refs for latest values

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
          data: {
            ...node.data,
            onEdit: handleEditNode,
            onDelete: handleDeleteNode,
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
          edges: edges as WorkflowEdge[],
        });
        // Also persist to storage so changes aren't lost on navigation
        persistWorkflows().catch(err => {
          console.warn('Failed to persist workflows during auto-save:', err);
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, workflow?.id]); // Only depend on workflow.id, not the entire workflow object

  // Sync JSON text when nodes, settings, or workflowName change
  useEffect(() => {
    const workflowJson = {
      name: workflowName,
      description: workflowSettings.description,
      version: workflowSettings.version,
      createdBy: workflowSettings.createdBy,
      updatedBy: workflowSettings.updatedBy,
      ownerEmail: workflowSettings.ownerEmail,
      ownerApp: workflowSettings.ownerApp,
      tasks: [...nodes]
        .sort((a, b) => (a.data.sequenceNo || 0) - (b.data.sequenceNo || 0))
        .map(node => {
          if (node.data.config) {
            // Remove sequenceNo from config as it's UI-only, not a Conductor field
            const { sequenceNo: _sequenceNo, ...cleanConfig } = node.data.config;
            return cleanConfig;
          }
          return {
            name: node.data.taskName,
            taskReferenceName: node.id,
            type: node.data.taskType,
            inputParameters: {},
            optional: false,
          };
        }),
      inputParameters: workflowSettings.inputParameters,
      inputTemplate: workflowSettings.inputTemplate,
      outputParameters: workflowSettings.outputParameters,
      timeoutSeconds: workflowSettings.timeoutSeconds,
      timeoutPolicy: workflowSettings.timeoutPolicy || 'TIME_OUT_WF',
      restartable: workflowSettings.restartable,
      schemaVersion: workflowSettings.schemaVersion,
      accessPolicy: workflowSettings.accessPolicy,
      failureWorkflow: workflowSettings.failureWorkflow,
      variables: workflowSettings.variables,
      workflowStatusListenerEnabled: workflowSettings.workflowStatusListenerEnabled || false,
    };
    setJsonText(JSON.stringify(workflowJson, null, 2));
  }, [nodes, workflowSettings, workflowName]);

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    try {
      JSON.parse(value);
      setJsonError('');
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
    }
  };

  const handleSaveJson = () => {
    try {
      const parsedJson = JSON.parse(jsonText);
      
      // Update workflow name and settings from JSON
      setWorkflowName(parsedJson.name || workflowName);
      
      // Parse and update all workflow settings fields
      const updatedSettings: WorkflowSettings = {
        description: parsedJson.description || workflowSettings.description,
        version: parsedJson.version || workflowSettings.version,
        timeoutSeconds: parsedJson.timeoutSeconds || workflowSettings.timeoutSeconds,
        timeoutPolicy: parsedJson.timeoutPolicy || workflowSettings.timeoutPolicy,
        restartable: parsedJson.restartable === undefined ? workflowSettings.restartable : parsedJson.restartable,
        schemaVersion: parsedJson.schemaVersion || workflowSettings.schemaVersion,
        effectiveDate: workflowSettings.effectiveDate,
        endDate: workflowSettings.endDate,
        status: workflowSettings.status,
        inputParameters: parsedJson.inputParameters || workflowSettings.inputParameters,
        outputParameters: parsedJson.outputParameters || workflowSettings.outputParameters,
        inputTemplate: parsedJson.inputTemplate || workflowSettings.inputTemplate,
        createdBy: parsedJson.createdBy || workflowSettings.createdBy,
        updatedBy: parsedJson.updatedBy || workflowSettings.updatedBy,
        ownerEmail: parsedJson.ownerEmail || workflowSettings.ownerEmail,
        ownerApp: parsedJson.ownerApp || workflowSettings.ownerApp,
        accessPolicy: parsedJson.accessPolicy || workflowSettings.accessPolicy,
        variables: parsedJson.variables || workflowSettings.variables,
        failureWorkflow: parsedJson.failureWorkflow || workflowSettings.failureWorkflow,
        workflowStatusListenerEnabled: parsedJson.workflowStatusListenerEnabled || workflowSettings.workflowStatusListenerEnabled,
      };
      
      setWorkflowSettings(updatedSettings);

      // If the JSON contains tasks, create visual nodes from them
      if (parsedJson.tasks && Array.isArray(parsedJson.tasks) && parsedJson.tasks.length > 0) {
        // Helper function to get task color based on type
        const getTaskColor = (taskType: string): string => {
          // System tasks
          const systemTask = systemTasks.find(t => t.type === taskType);
          if (systemTask) return systemTask.color;
          
          // Operators
          const operator = operators.find(t => t.type === taskType);
          if (operator) return operator.color;
          
          // Worker tasks or default
          return '#10b981'; // Default green for worker tasks
        };

        // Convert tasks from JSON to visual nodes
        const newNodes: Node[] = parsedJson.tasks.map((task: unknown, index: number) => {
          const taskConfig = task as Record<string, unknown>;
          const taskType = (taskConfig.type as string) || 'SIMPLE';
          const taskRefName = (taskConfig.taskReferenceName as string) || `task_${index + 1}`;
          const taskName = (taskConfig.name as string) || taskRefName;

          return {
            id: taskRefName,
            type: 'custom',
            position: { x: 0, y: 0 }, // Will be auto-arranged
            draggable: false,
            data: {
              label: taskRefName,
              taskType: taskType,
              taskName: taskName,
              color: getTaskColor(taskType),
              sequenceNo: index + 1,
              config: taskConfig, // Store the full task config
              onEdit: handleEditNode,
              onDelete: handleDeleteNode,
            },
          };
        });

        setNodes(newNodes);
        
        // Update workflow with tasks if we have an active workflow
        if (workflow) {
          updateWorkflow(workflow.id, {
            name: parsedJson.name || workflowName,
            settings: updatedSettings,
            tasks: parsedJson.tasks,
          });
        }

        toast({
          title: 'JSON Saved & Imported',
          description: `Workflow updated with ${newNodes.length} tasks. Click "Auto Arrange" to organize them on the canvas.`,
        });
        setJsonError('');
        setActiveTab('design');
      } else {
        // No tasks in JSON, just update settings
        toast({
          title: 'JSON Saved',
          description: 'Workflow settings updated from JSON.',
        });
        setJsonError('');
        setActiveTab('settings');
      }
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description: error instanceof Error ? error.message : 'Failed to parse JSON.',
        variant: 'destructive',
      });
    }
  };

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
  const updateNodeWithConfig = useCallback((node: Node, targetNodeId: string, config: unknown) => {
    if (node.id === targetNodeId) {
      const cfg = config as Record<string, unknown>;
      return {
        ...node,
        data: {
          ...node.data,
          config: config,
          label: (cfg.taskReferenceName as string) || (cfg.name as string),
          onEdit: handleEditNode,
          onDelete: handleDeleteNode,
        },
      };
    }
    return node;
  }, [handleEditNode, handleDeleteNode]);

  // Helper to extract workflow tasks from nodes
  const extractWorkflowTasks = (nodes: Node[]) => {
    const sortedNodes = [...nodes];
    sortedNodes.sort((a, b) => (a.data.sequenceNo || 0) - (b.data.sequenceNo || 0));
    return sortedNodes
      .map(node => {
        if (!node.data.config) return null;
        // Remove sequenceNo from config as it's UI-only, not a Conductor field
        const { sequenceNo: _sequenceNo, ...cleanConfig } = node.data.config;
        return cleanConfig;
      })
      .filter(Boolean); // Remove nodes without config
  };

  // Helper to handle the config save logic - wrapped in useCallback to fix hook dependencies
  const saveTaskConfigLogic = useCallback((
    config: unknown,
    setModalOpen: (open: boolean) => void
  ) => {
    const cfg = config as Record<string, unknown>;
    // Check if this is a new drop (pendingTaskDrop exists) or editing existing node
    if (pendingTaskDrop) {
      // Creating a new node from drag & drop
      const taskRefId = (cfg.taskReferenceName as string) || `${pendingTaskDrop.taskType.toLowerCase()}_${Date.now()}`;
      
      setNodes((nds) => {
        const sequenceNo = nds.length + 1;
        
        // Do NOT add sequenceNo to config - it's UI-only, stored in node.data
        // Config should only contain Conductor-supported fields
        
        const newNode: Node = {
          id: taskRefId,
          type: 'custom',
          position: { x: 0, y: 0 }, // Temporary position - will be arranged automatically
          draggable: false,
          data: {
            label: (cfg.taskReferenceName as string) || (cfg.name as string),
            taskType: pendingTaskDrop.taskType,
            taskName: pendingTaskDrop.taskName,
            color: pendingTaskDrop.color,
            sequenceNo: sequenceNo, // UI-only field for ordering
            config: config, // Clean config without sequenceNo
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
        const updatedNodes = nds.map((node) => {
          if (node.id === targetNode.id) {
            // Update node config without including sequenceNo in config
            // sequenceNo is maintained in node.data for UI ordering only
            return updateNodeWithConfig(node, targetNode.id, config);
          }
          return node;
        });

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
  }, [selectedNodeForConfig, pendingNodeForAutoConfig, pendingTaskDrop, setNodes, workflow, updateWorkflow, handleEditNode, handleDeleteNode, setPendingNodeForAutoConfig, setPendingTaskDrop, setSelectedNodeForConfig, updateNodeWithConfig]);

  // Generic save handler for task configs
  const createTaskConfigHandler = useCallback((
    setModalOpen: (open: boolean) => void
  ) => {
    return (config: unknown) => {
      saveTaskConfigLogic(config, setModalOpen);
    };
  }, [saveTaskConfigLogic]);

  const handleSaveHttpTaskConfig = useCallback((config: unknown) =>
    createTaskConfigHandler(modalActions.setIsHttpConfigModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveKafkaTaskConfig = useCallback((config: KafkaPublishTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsKafkaPublishModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveJsonJqTransformConfig = useCallback((config: JsonJqTransformTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsJsonJqTransformModalOpen)(config),
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

  const handleSaveTerminateConfig = useCallback((config: TerminateSystemTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsTerminateModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveInlineConfig = useCallback((config: InlineSystemTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsInlineModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveHumanTaskConfig = useCallback((config: HumanTaskConfig) =>
    createTaskConfigHandler(modalActions.setIsHumanTaskModalOpen)(config),
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

  const handleSaveOperatorInlineConfig = useCallback((config: InlineConfig) =>
    createTaskConfigHandler(modalActions.setIsOperatorInlineModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveJoinConfig = useCallback((config: JoinConfig) =>
    createTaskConfigHandler(modalActions.setIsJoinModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveOperatorSubWorkflowConfig = useCallback((config: SubWorkflowConfig) =>
    createTaskConfigHandler(modalActions.setIsOperatorSubWorkflowModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveStartWorkflowConfig = useCallback((config: StartWorkflowConfig) =>
    createTaskConfigHandler(modalActions.setIsStartWorkflowModalOpen)(config),
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
  }, [nodes, setNodes, setEdges, toast]);

  const handlePreview = () => {
    // Save current state temporarily
    if (workflow) {
      useWorkflowStore.getState().updateWorkflow(workflow.id, {
        nodes: nodes,
        edges: edges as WorkflowEdge[],
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
        edges: edges as WorkflowEdge[],
        createdAt: new Date().toISOString(),
        status: 'draft' as const,
      };
      useWorkflowStore.getState().addWorkflow(tempWorkflow);
      navigate(`/diagram/${tempWorkflow.id}?mode=preview`);
    }
  };

  // Improved save logic with offline caching support
  // Workflow changes are cached even if Conductor publish fails
  const handleSave = async (): Promise<void> => {
    try {
      // First save to local store and cache
      if (!workflow) {
        // Create new workflow if accessed from standalone designer
        const newWorkflow = {
          id: `workflow-${Date.now()}`,
          name: workflowName,
          description: workflowSettings.description,
          nodes: nodes,
          edges: edges as WorkflowEdge[],
          createdAt: new Date().toISOString(),
          status: workflowSettings.status.toLowerCase() as 'draft' | 'active' | 'paused',
          settings: workflowSettings,
        };
        useWorkflowStore.getState().addWorkflow(newWorkflow);
        
        // Save to Zustand cache (for offline support)
        saveWorkflowToCache({
          id: newWorkflow.id,
          name: newWorkflow.name,
          description: newWorkflow.description,
          syncStatus: 'local-only',
          isLocalOnly: true,
          definition: {
            name: newWorkflow.name,
            description: newWorkflow.description,
            version: newWorkflow.settings.version,
            settings: newWorkflow.settings,
            nodes: newWorkflow.nodes,
            edges: newWorkflow.edges,
          },
        });
        
        // Persist to local storage
        await persistWorkflows();
        
        // Sync cache to filestore
        await syncToFileStore().catch(err => {
          console.warn('Failed to sync to filestore:', err);
        });
        
        // Mark as syncing while attempting to save to Conductor
        markAsSyncing(newWorkflow.id);
        
        // Now save to Conductor via proxy
        const { localWorkflowToConductor } = await import('@/utils/workflowToMermaid');
        const conductorWorkflow = localWorkflowToConductor(newWorkflow);
        
        // Save via GraphQL proxy
        const success = await saveWorkflow(conductorWorkflow);
        if (!success) {
          // Conductor save failed, but workflow is cached
          markAsDraft(newWorkflow.id);
          toast({
            title: 'Saved to cache',
            description: `Workflow "${workflowName}" saved locally. Connection to Conductor server failed. You can publish it later.`,
            variant: 'default',
          });
          navigate(`/workflows/${newWorkflow.id}`);
          return;
        }
        
        // Successfully saved to Conductor
        markAsPublished(newWorkflow.id);
        toast({
          title: 'Workflow saved',
          description: `Workflow "${workflowName}" has been created and published to Conductor`,
        });
        
        navigate(`/workflows/${newWorkflow.id}`);
        return;
      }

      // Update existing workflow
      const updatedWorkflow = {
        ...workflow,
        name: workflowName,
        description: workflowSettings.description,
        settings: workflowSettings,
        nodes: nodes,
        edges: edges,
      };
      
      updateWorkflow(workflow.id, {
        name: workflowName,
        description: workflowSettings.description,
        settings: workflowSettings,
        nodes: nodes,
        edges: edges as WorkflowEdge[],
      });
      
      // Save to Zustand cache
      saveWorkflowToCache({
        id: workflow.id,
        name: workflowName,
        description: workflowSettings.description,
        syncStatus: 'local-only',
        isLocalOnly: false,
        definition: {
          name: workflowName,
          description: workflowSettings.description,
          version: workflowSettings.version,
          settings: workflowSettings,
          nodes: nodes,
          edges: edges,
        },
      });
      
      // Persist to local storage
      await persistWorkflows();
      
      // Sync cache to filestore
      await syncToFileStore().catch(err => {
        console.warn('Failed to sync to filestore:', err);
      });
      
      // Mark as syncing while attempting to save to Conductor
      markAsSyncing(workflow.id);
      
      // Now save to Conductor via proxy
      const { localWorkflowToConductor } = await import('@/utils/workflowToMermaid');
      const conductorWorkflow = localWorkflowToConductor(updatedWorkflow);
      
      // Save via GraphQL proxy
      const success = await saveWorkflow(conductorWorkflow);
      if (!success) {
        // Conductor save failed, but workflow is cached
        markAsDraft(workflow.id);
        toast({
          title: 'Saved to cache',
          description: `Workflow "${workflowName}" updated locally. Connection to Conductor server failed. You can publish it later.`,
          variant: 'default',
        });
        return;
      }
      
      // Successfully saved to Conductor
      markAsPublished(workflow.id);
      toast({
        title: 'Workflow saved',
        description: `Workflow "${workflowName}" has been updated and published to Conductor successfully`,
      });
    } catch (error) {
      console.error('Error saving workflow:', error);
      
      // Ensure workflow is cached even on error
      if (workflow) {
        saveWorkflowToCache({
          id: workflow.id,
          name: workflowName,
          description: workflowSettings.description,
          syncStatus: 'local-only',
          isLocalOnly: true,
          definition: {
            name: workflowName,
            description: workflowSettings.description,
            version: workflowSettings.version,
            settings: workflowSettings,
            nodes: nodes,
            edges: edges,
          },
        });
        markAsDraft(workflow.id);
      }
      
      toast({
        title: 'Saved to cache',
        description: 'Workflow saved locally due to an error. You can try publishing later.',
        variant: 'default',
      });
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
      modalActions.setExecuteModalOpen(true);
    } else {
      toast({
        title: 'Please save first',
        description: 'Save the workflow before executing.',
        variant: 'destructive',
      });
    }
  };

  const handleExecuteWorkflow = (workflowId: string, input: unknown) => {
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
    // For editing existing node - retrieve the complete config including all child tasks and references
    if (selectedNodeForConfig?.data?.taskType === taskType) {
      const nodeConfig = selectedNodeForConfig.data.config;
      
      if (nodeConfig) {
        // Return the full node config which contains all task details including:
        // - taskReferenceName
        // - type (task type)
        // - All input/output parameter mappings
        // - For complex operators (Switch, Fork-Join, Do-While, etc.): child tasks and branches
        // - All other Conductor-supported configuration fields
        const config = nodeConfig as Record<string, unknown>;
        
        // Add sequenceNo from node data for UI ordering (not stored in config itself)
        return {
          ...config,
          sequenceNo: selectedNodeForConfig.data.sequenceNo,
        };
      }
      
      return nodeConfig;
    }
    
    // For auto-config during creation - return the pending node's config
    if (pendingNodeForAutoConfig?.data?.taskType === taskType) {
      const config = pendingNodeForAutoConfig.data.config;
      
      if (config) {
        return {
          ...(config as Record<string, unknown>),
          sequenceNo: pendingNodeForAutoConfig.data.sequenceNo,
        };
      }
      
      return config;
    }
    
    return undefined;
  };

  return (
    <>
      <div className="h-full flex flex-col bg-[#1a1f2e]">
        {/* Top Bar */}
        <div className="h-16 bg-[#1a1f2e] border-b border-[#2a3142] px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/workflows')}
              className="text-gray-400 hover:text-white hover:bg-[#2a3142]"
              title="Go back to workflows"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
            
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
              onClick={() => handleSave()}
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

                    {/* Ownership & Authorship */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-white">Ownership & Authorship</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Created By (Default: ConductorHub)</Label>
                          <Input
                            value={workflowSettings.createdBy || 'ConductorHub'}
                            onChange={(e) => setWorkflowSettings({ ...workflowSettings, createdBy: e.target.value })}
                            className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Updated By (Default: ConductorHub)</Label>
                          <Input
                            value={workflowSettings.updatedBy || 'ConductorHub'}
                            onChange={(e) => setWorkflowSettings({ ...workflowSettings, updatedBy: e.target.value })}
                            className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Owner Email</Label>
                          <Input
                            type="email"
                            value={workflowSettings.ownerEmail || ''}
                            onChange={(e) => setWorkflowSettings({ ...workflowSettings, ownerEmail: e.target.value })}
                            placeholder="dev-team@example.com"
                            className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Owner Application</Label>
                          <Input
                            value={workflowSettings.ownerApp || ''}
                            onChange={(e) => setWorkflowSettings({ ...workflowSettings, ownerApp: e.target.value })}
                            placeholder="data_service_api"
                            className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
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
                        <div>
                          <Label className="text-white">Timeout Policy</Label>
                          <Select
                            value={workflowSettings.timeoutPolicy || 'TIME_OUT_WF'}
                            onValueChange={(value: 'TIME_OUT_WF' | 'ALERT_ONLY') => 
                              setWorkflowSettings({ ...workflowSettings, timeoutPolicy: value })
                            }
                          >
                            <SelectTrigger className="mt-2 bg-[#0f1419] text-white border-[#2a3142]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                              <SelectItem value="TIME_OUT_WF">TIME_OUT_WF</SelectItem>
                              <SelectItem value="ALERT_ONLY">ALERT_ONLY</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                          <Label className="text-white">Restartable</Label>
                          <Switch
                            checked={workflowSettings.restartable}
                            onCheckedChange={(checked) => setWorkflowSettings({ ...workflowSettings, restartable: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between pt-4">
                          <Label className="text-white">Workflow Status Listener Enabled</Label>
                          <Switch
                            checked={workflowSettings.workflowStatusListenerEnabled || false}
                            onCheckedChange={(checked) => setWorkflowSettings({ ...workflowSettings, workflowStatusListenerEnabled: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-[#2a3142]" />

                    {/* Failure Workflow */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-white">Failure Handling</h4>
                      <div>
                        <Label className="text-white">Failure/Compensation Workflow</Label>
                        <Input
                          value={workflowSettings.failureWorkflow || ''}
                          onChange={(e) => setWorkflowSettings({ ...workflowSettings, failureWorkflow: e.target.value })}
                          placeholder="compensation_workflow_v1"
                          className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
                        />
                        <p className="text-xs text-gray-400 mt-1">Optional workflow to execute on failure</p>
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
                        <Label className="text-white">Input Template (JSON)</Label>
                        <Textarea
                          value={JSON.stringify(workflowSettings.inputTemplate, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setWorkflowSettings({ ...workflowSettings, inputTemplate: parsed });
                            } catch {
                              // Invalid JSON - silently ignore to allow editing
                            }
                          }}
                          placeholder="{}"
                          className="mt-2 bg-[#0f1419] text-white border-[#2a3142] font-mono text-sm"
                          rows={3}
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
                          placeholder="{}"
                          className="mt-2 bg-[#0f1419] text-white border-[#2a3142] font-mono text-sm"
                          rows={3}
                        />
                      </div>
                    </div>

                    <Separator className="bg-[#2a3142]" />

                    {/* Access Control & Variables */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-white">Access Control & Variables</h4>
                      <div>
                        <Label className="text-white">Access Policy (JSON)</Label>
                        <Textarea
                          value={JSON.stringify(workflowSettings.accessPolicy, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setWorkflowSettings({ ...workflowSettings, accessPolicy: parsed });
                            } catch {
                              // Invalid JSON - silently ignore to allow editing
                            }
                          }}
                          placeholder='{"read_group": "readers", "write_group": "writers"}'
                          className="mt-2 bg-[#0f1419] text-white border-[#2a3142] font-mono text-sm"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label className="text-white">Workflow Variables (JSON)</Label>
                        <Textarea
                          value={JSON.stringify(workflowSettings.variables, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setWorkflowSettings({ ...workflowSettings, variables: parsed });
                            } catch {
                              // Invalid JSON - silently ignore to allow editing
                            }
                          }}
                          placeholder='{"run_count": 1, "status": "active"}'
                          className="mt-2 bg-[#0f1419] text-white border-[#2a3142] font-mono text-sm"
                          rows={3}
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
                <Card className="max-w-4xl mx-auto p-6 bg-[#1a1f2e] border-[#2a3142]" style={{ '--line-height': '1.5rem' } as React.CSSProperties}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">Workflow Definition (JSON)</h3>
                    <div className="flex items-center gap-2">
                      {jsonError && (
                        <div className="flex items-center gap-2 text-destructive mr-4">
                          <span className="text-sm font-medium">Invalid JSON</span>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveJson}
                        disabled={!!jsonError}
                        className="bg-cyan-500 text-white hover:bg-cyan-600 border-cyan-500 disabled:opacity-50"
                      >
                        <SaveIcon className="w-4 h-4 mr-2" />
                        Save JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(jsonText);
                          toast({
                            title: 'Copied',
                            description: 'JSON copied to clipboard.',
                          });
                        }}
                        className="text-cyan-500 border-[#2a3142]"
                      >
                        Copy JSON
                      </Button>
                    </div>
                  </div>
                  <JsonTextarea
                    value={jsonText}
                    onChange={handleJsonChange}
                    className="font-mono text-xs bg-[#0f1419] text-white"
                  />
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
        initialConfig={getInitialConfig('KAFKA_PUBLISH')}
        onSave={handleSaveKafkaTaskConfig}
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
        initialConfig={getInitialConfig('JSON_JQ_TRANSFORM')}
        onSave={handleSaveJsonJqTransformConfig}
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
        initialConfig={getInitialConfig('NOOP')}
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
        initialConfig={getInitialConfig('EVENT')}
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
        initialConfig={getInitialConfig('WAIT')}
        onSave={handleSaveWaitConfig}
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
        initialConfig={getInitialConfig('TERMINATE')}
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
        initialConfig={getInitialConfig('INLINE')}
        onSave={handleSaveInlineConfig}
      />

      <HumanSystemTaskModal
        open={modalStates.isHumanTaskModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsHumanTaskModalOpen(open);
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
        initialConfig={getInitialConfig('HUMAN')}
        onSave={handleSaveHumanTaskConfig}
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
        initialConfig={getInitialConfig('SIMPLE') as WorkflowTaskConfig | undefined}
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
        initialConfig={getInitialConfig('FORK_JOIN')}
        onSave={handleSaveForkJoinConfig}
      />

      <DynamicForkModal
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
        initialConfig={getInitialConfig('FORK_JOIN_DYNAMIC')}
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
        initialConfig={getInitialConfig('SWITCH')}
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
        initialConfig={getInitialConfig('DO_WHILE')}
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
        initialConfig={getInitialConfig('DYNAMIC')}
        onSave={handleSaveDynamicConfig}
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
        initialConfig={getInitialConfig('INLINE')}
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
        initialConfig={getInitialConfig('JOIN')}
        onSave={handleSaveJoinConfig}
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

      <StartWorkflowModal
        open={modalStates.isStartWorkflowModalOpen}
        onOpenChange={(open) => {
          modalActions.setIsStartWorkflowModalOpen(open);
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
        initialConfig={getInitialConfig('START_WORKFLOW')}
        onSave={handleSaveStartWorkflowConfig}
      />
    </>
  );
}
