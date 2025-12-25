import { useCallback, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  useWorkflowStore,
  WorkflowSettings,
  WorkflowEdge,
  WorkflowNode,
  Workflow,
} from '@/stores/workflowStore';
import { useWorkflowCacheStore } from '@/stores/workflowCacheStore';
import { SaveIcon, PlayIcon, EyeIcon, LayoutGridIcon, ArrowLeftIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { JsonTextarea } from '@/components/ui/json-textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useConductorApi } from '@/hooks/useConductorApi';
import { useExecutionService } from '@/hooks/useExecutionService';
import { ExecuteWorkflowModal } from '@/components/modals/ExecuteWorkflowModal';
import { HttpTaskModal } from '@/components/modals/system-tasks/HttpSystemTaskModal';
import {
  KafkaPublishTaskModal,
  KafkaPublishTaskConfig,
} from '@/components/modals/system-tasks/KafkaPublishSystemTaskModal';
import {
  JsonJqTransformTaskModal,
  JsonJqTransformTaskConfig,
} from '@/components/modals/system-tasks/JsonJqTransformSystemTaskModal';
import {
  NoopSystemTaskModal,
  NoopSystemTaskConfig,
} from '@/components/modals/system-tasks/NoopSystemTaskModal';
import {
  EventSystemTaskModal,
  EventSystemTaskConfig,
} from '@/components/modals/system-tasks/EventSystemTaskModal';
import {
  WaitSystemTaskModal,
  WaitSystemTaskConfig,
} from '@/components/modals/system-tasks/WaitSystemTaskModal';
import {
  TerminateSystemTaskModal,
  TerminateSystemTaskConfig,
} from '@/components/modals/system-tasks/TerminateSystemTaskModal';
import {
  InlineSystemTaskModal,
  InlineSystemTaskConfig,
} from '@/components/modals/system-tasks/InlineSystemTaskModal';
import {
  HumanSystemTaskModal,
  HumanTaskConfig,
} from '@/components/modals/system-tasks/HumanSystemTaskModal';
import { SimpleTaskModal, WorkflowTaskConfig } from '@/components/modals/SimpleTaskModal';
import { generateUniqueWorkflowName } from '@/utils/nameGenerator';

// Operator Modals
import { ForkJoinModal, ForkJoinConfig } from '@/components/modals/operators/ForkJoinModal';
import {
  DynamicForkModal,
  ForkJoinDynamicConfig,
} from '@/components/modals/operators/DynamicForkModal';
import { SwitchModal, SwitchConfig } from '@/components/modals/operators/SwitchModal';
import { DoWhileModal, DoWhileConfig } from '@/components/modals/operators/DoWhileModal';
import { DynamicModal, DynamicConfig } from '@/components/modals/operators/DynamicModal';
import { InlineModal, InlineConfig } from '@/components/modals/operators/InlineModal';
import { JoinModal, JoinConfig } from '@/components/modals/operators/JoinModal';
import {
  SubWorkflowModal,
  SubWorkflowConfig,
} from '@/components/modals/operators/SubWorkflowModal';
import {
  StartWorkflowModal,
  StartWorkflowConfig,
} from '@/components/modals/operators/StartWorkflowModal';

// Extracted modules
import { CustomNode } from '@/components/workflow/CustomNode';
import { TaskLibrarySidebar } from '@/components/workflow/TaskLibrarySidebar';
import { workerTasks, operators, systemTasks } from '@/constants/taskDefinitions';
import { formatDate, formatDateForInput, formatDateFromInput } from '@/utils/dateFormatters';
import { useTaskModals } from '@/hooks/useTaskModals';
import { conductorWorkflowToLocal, type ConductorWorkflow } from '@/lib/utils';

import logo from '../../resources/logo.svg';

const nodeTypes = {
  custom: CustomNode,
};

// Helper component to handle auto-fit view when fitView event is triggered
function FitViewListener() {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const handleFitView = () => {
      try {
        fitView({ padding: 0.2, duration: 300, maxZoom: 1, minZoom: 1 });
      } catch (error_) {
        // fitView may not be available in all contexts
        console.debug('fitView not available:', error_);
      }
    };

    globalThis.addEventListener('fitView', handleFitView as EventListener);
    return () => globalThis.removeEventListener('fitView', handleFitView as EventListener);
  }, [fitView]);

  return null;
}

export function WorkflowDesigner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { workflows, updateWorkflow } = useWorkflowStore();
  const {
    saveWorkflowToCache,
    markAsDraft,
    markAsSyncing,
    markAsPublished,
    syncToFileStore,
    clearCache,
  } = useWorkflowCacheStore();
  const { toast } = useToast();
  const { saveWorkflow, fetchWorkflowByVersion } = useConductorApi({ enableFallback: false });
  const { startWorkflow } = useExecutionService();

  // Clear workflow cache for Internet Explorer users
  useEffect(() => {
    const isIE = /MSIE|Trident/.exec(globalThis.navigator?.userAgent || '');
    if (isIE) {
      // Clear Zustand workflow cache
      clearCache();
      // Remove persisted cache from localStorage
      localStorage.removeItem('workflow-cache-store');
      // Optionally, show a toast or log
      if (toast)
        toast({
          title: 'Workflow cache cleared for IE',
          description: 'IE detected, cache cleared.',
        });
    }
  }, [clearCache, toast]);

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
    createdBy: 'ConflixIQ Studio',
    updatedBy: 'ConflixIQ Studio',
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
  const nodesStateRef = useRef(nodes); // Keep track of nodes for handleEditNode

  // Update refs when state changes
  useEffect(() => {
    workflowRef.current = workflow;
    workflowNameRef.current = workflowName;
    workflowSettingsRef.current = workflowSettings;
    nodesRef.current = nodes;
    edgesRef.current = edges;
    nodesStateRef.current = nodes; // Update nodes state ref
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

  // Ref to track pending modal open action
  const pendingModalOpenRef = useRef<string | null>(null);

  // Define edit and delete handlers BEFORE useEffects that use them
  const handleEditNode = useCallback(
    (nodeId: string) => {
      console.log('handleEditNode called for:', nodeId);
      const node = nodesStateRef.current.find((n) => n.id === nodeId);
      if (node) {
        console.log(
          'Found node, opening modal for taskType:',
          node.data.taskType,
          'config:',
          node.data.config
        );

        // Store the taskType we want to open
        pendingModalOpenRef.current = node.data.taskType;

        // Set the selected node - this will trigger the effect below
        setSelectedNodeForConfig(node);
      } else {
        console.warn('Node not found:', nodeId);
      }
    },
    [setSelectedNodeForConfig]
  );

  // When selectedNodeForConfig is set (from handleEditNode), open the modal for that node's taskType
  useEffect(() => {
    if (selectedNodeForConfig && pendingModalOpenRef.current) {
      const taskTypeToOpen = pendingModalOpenRef.current;
      pendingModalOpenRef.current = null;

      console.log(
        'Effect: Opening modal for taskType:',
        taskTypeToOpen,
        'with config:',
        selectedNodeForConfig.data.config
      );
      modalActions.openModalForTaskType(taskTypeToOpen);
    }
  }, [selectedNodeForConfig, modalActions]);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
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
    },
    [setNodes, setEdges, workflow, updateWorkflow]
  );

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
      publicationStatus: 'LOCAL',
    };

    useWorkflowStore.getState().addWorkflow(newWorkflow);

    // DISABLED: persistWorkflows() was causing infinite loop
    // await persistWorkflows().catch(err => {
    //   console.warn('Failed to persist new workflow:', err);
    // });

    sessionStorage.setItem('lastActiveWorkflow', newWorkflow.id);
    navigate(`/workflows/${newWorkflow.id}`, { replace: true });
  }, [navigate]);

  // Helper function to load workflows from localStorage as fallback
  const loadWorkflowsFromLocalStorage = useCallback((): Workflow[] | null => {
    try {
      const localStorageData = localStorage.getItem('workflows');
      if (localStorageData) {
        const localWorkflows = JSON.parse(localStorageData) as Workflow[];
        if (localWorkflows && localWorkflows.length > 0) {
          console.log(`Loaded ${localWorkflows.length} workflows from localStorage`);
          return localWorkflows;
        }
      }
      return null;
    } catch (error_) {
      console.warn('Failed to load workflows from localStorage:', error_);
      return null;
    }
  }, []);

  // Helper function to sync workflows from fileStore and fallback to localStorage
  const syncWorkflowsFromFileStore = useCallback(async () => {
    try {
      const { fileStoreClient } = await import('@/utils/fileStore');
      const storedWorkflows = await fileStoreClient.loadWorkflows();

      if (storedWorkflows && storedWorkflows.length > 0) {
        console.log(
          `[syncWorkflowsFromFileStore] Found ${storedWorkflows.length} workflows in fileStore`
        );

        // Get current workflows to check for existing PUBLISHED status
        const currentWorkflows = useWorkflowStore.getState().workflows;
        const publishedWorkflowIds = new Set(
          currentWorkflows.filter((w) => w.publicationStatus === 'PUBLISHED').map((w) => w.id)
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const workflowsToLoad: Workflow[] = storedWorkflows.map((w: any) => {
          const existingPublished = publishedWorkflowIds.has(w.id);
          return {
            id: w.id,
            name: w.name || 'Unnamed',
            description: w.description,
            nodes: (w.nodes as WorkflowNode[]) || [],
            edges: (w.edges as WorkflowEdge[]) || [],
            createdAt: w.createdAt || new Date().toISOString(),
            status: (w.status as 'draft' | 'active' | 'paused') || 'draft',
            syncStatus: (w.syncStatus as 'local-only' | 'synced' | 'syncing') || 'local-only',
            // IMPORTANT: If this workflow was previously marked as PUBLISHED, keep it as PUBLISHED
            // This prevents fileStore from overwriting API workflows with wrong publication status
            publicationStatus: existingPublished
              ? 'PUBLISHED'
              : (w.publicationStatus as 'LOCAL' | 'PUBLISHED') || 'LOCAL',
            settings: w.settings,
            tasks: w.tasks, // Preserve original Conductor task definitions
          };
        });

        // MERGE with existing workflows instead of replacing, to preserve workflows just added from API
        const workflowIds = new Set(workflowsToLoad.map((w) => w.id));
        const existingWorkflowsNotInFileStore = currentWorkflows.filter(
          (w) => !workflowIds.has(w.id)
        );
        const mergedWorkflows = [...workflowsToLoad, ...existingWorkflowsNotInFileStore];

        console.log(
          `[syncWorkflowsFromFileStore] Merging: ${workflowsToLoad.length} from fileStore + ${existingWorkflowsNotInFileStore.length} existing = ${mergedWorkflows.length} total`
        );
        useWorkflowStore.getState().loadWorkflows(mergedWorkflows);
        return;
      }

      // Fallback to localStorage if fileStore is empty
      console.log('No workflows found in fileStore, checking localStorage...');
      const localWorkflows = loadWorkflowsFromLocalStorage();
      if (localWorkflows) {
        useWorkflowStore.getState().loadWorkflows(localWorkflows);
      }
    } catch (error_) {
      console.warn('Error syncing workflows from fileStore:', error_);
      // Try localStorage as final fallback
      const localWorkflows = loadWorkflowsFromLocalStorage();
      if (localWorkflows) {
        useWorkflowStore.getState().loadWorkflows(localWorkflows);
      }
    }
  }, [loadWorkflowsFromLocalStorage]);

  // Helper function to load nodes and edges from workflow
  // Helper function to load cached workflow from localStorage
  const loadCachedWorkflow = (workflowId: string) => {
    try {
      const cachedData = localStorage.getItem(`workflow-cache-${workflowId}`);
      if (!cachedData) return null;

      const cache = JSON.parse(cachedData);
      return cache.nodes?.length > 0 ? cache : null;
    } catch {
      return null;
    }
  };

  // Helper to check if workflow nodes are already arranged in snake pattern
  const _checkIfArranged = (wf: Workflow): boolean =>
    wf.nodes?.length && wf.nodes.length > 1
      ? wf.nodes.some(
          (node, idx) =>
            idx > 0 &&
            (node.position.x !== wf.nodes[0].position.x + idx * 300 || node.position.y !== 0)
        )
      : false;

  const checkIfArranged = _checkIfArranged;

  // Helper: Map a node with event handlers
  const mapNodeWithHandlers = useCallback(
    (node: WorkflowNode) => ({
      ...node,
      draggable: false,
      data: {
        ...node.data,
        onEdit: handleEditNode,
        onDelete: handleDeleteNode,
      },
    }),
    [handleEditNode, handleDeleteNode]
  );

  // Helper: Check if nodes are in linear layout
  const isNodesInLinearLayout = (nodeList: Node[]): boolean => {
    if (nodeList.length <= 1) return false;
    return nodeList.every((node, idx) => {
      if (idx === 0) return true;
      const firstNodeX = nodeList[0].position.x;
      const expectedLinearX = firstNodeX + idx * 300;
      return node.position.x === expectedLinearX && node.position.y === 0;
    });
  };

  // Helper: Arrange nodes in snake pattern
  const arrangeNodesInSnakePattern = (nodeList: Node[]): Node[] => {
    const sortedNodes = [...nodeList].sort((a, b) => {
      const seqA = a.data.sequenceNo || 0;
      const seqB = b.data.sequenceNo || 0;
      return seqA - seqB;
    });

    const nodesPerRow = 5;
    const horizontalSpacing = 200;
    const verticalSpacing = 120;
    const startX = 50;
    const startY = 50;

    return sortedNodes.map((node, index) => {
      const rowIndex = Math.floor(index / nodesPerRow);
      const colIndex = index % nodesPerRow;
      const isOddRow = rowIndex % 2 === 1;
      const actualColIndex = isOddRow ? nodesPerRow - 1 - colIndex : colIndex;

      return {
        ...node,
        position: {
          x: startX + actualColIndex * horizontalSpacing,
          y: startY + rowIndex * verticalSpacing,
        },
      } as Node;
    });
  };

  // Helper: Generate edges for arranged nodes
  const generateEdgesForArrangedNodes = (nodeList: Node[]): Edge[] => {
    const nodesPerRow = 5;
    const newEdges: Edge[] = [];

    for (let i = 0; i < nodeList.length - 1; i++) {
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
        id: `${nodeList[i].id}-${nodeList[i + 1].id}`,
        source: nodeList[i].id,
        sourceHandle: sourceHandle,
        target: nodeList[i + 1].id,
        targetHandle: targetHandle,
        type: 'straight',
        animated: true,
        style: { stroke: '#00bcd4', strokeWidth: 2 },
      });
    }

    return newEdges;
  };

  const loadNodesAndEdgesFromWorkflow = useCallback(
    (foundWorkflow: Workflow) => {
      console.log(
        `[WorkflowDesigner.loadNodesAndEdgesFromWorkflow] Loading workflow:`,
        foundWorkflow.name,
        `with ${foundWorkflow.nodes?.length || 0} nodes, status: ${foundWorkflow.publicationStatus}`
      );
      console.log(
        `[WorkflowDesigner.loadNodesAndEdgesFromWorkflow] Full workflow object:`,
        foundWorkflow
      );
      setWorkflowName(foundWorkflow.name);
      if (foundWorkflow.settings) {
        setWorkflowSettings(foundWorkflow.settings);
      }

      // Use the workflow's nodes and edges directly (they may already be from cache)
      let nodes: Node[] =
        foundWorkflow.nodes?.length > 0 ? foundWorkflow.nodes.map(mapNodeWithHandlers) : [];
      let edges: Edge[] = foundWorkflow.edges?.length > 0 ? (foundWorkflow.edges as Edge[]) : [];

      // For API-loaded workflows (PUBLISHED status) with linear node positions, apply auto-arrange
      // But only if nodes weren't already arranged (cache would have arranged nodes)
      const isLinearLayout = isNodesInLinearLayout(nodes);

      if (foundWorkflow.publicationStatus === 'PUBLISHED' && nodes.length > 0 && isLinearLayout) {
        console.log(
          `[WorkflowDesigner.loadNodesAndEdgesFromWorkflow] Auto-arranging PUBLISHED workflow with linear layout for better visibility`
        );
        nodes = arrangeNodesInSnakePattern(nodes);
        edges = generateEdgesForArrangedNodes(nodes);
      }

      console.log(
        `[WorkflowDesigner.loadNodesAndEdgesFromWorkflow] About to setNodes with ${nodes.length} nodes`
      );
      console.log(`[WorkflowDesigner.loadNodesAndEdgesFromWorkflow] Nodes being set:`, nodes);
      console.log(`[WorkflowDesigner.loadNodesAndEdgesFromWorkflow] Edges being set:`, edges);
      setNodes(nodes);
      setEdges(edges);

      // IMPORTANT: Only update the workflow in store if we performed auto-arrange
      // This avoids unnecessary store updates for already-arranged workflows
      if (foundWorkflow.publicationStatus === 'PUBLISHED' && nodes.length > 0 && isLinearLayout) {
        console.log(
          `[WorkflowDesigner.loadNodesAndEdgesFromWorkflow] Updating workflow in store with newly arranged nodes`
        );
        updateWorkflow(foundWorkflow.id, {
          nodes: nodes as WorkflowNode[],
          edges: edges as WorkflowEdge[],
        });
      }

      // Trigger fitView for proper canvas visualization of loaded workflows
      if (nodes.length > 0) {
        setTimeout(() => {
          globalThis.dispatchEvent(new CustomEvent('fitView'));
        }, 100);
      }

      // Verify state was updated
      setTimeout(() => {
        console.log(
          `[WorkflowDesigner.loadNodesAndEdgesFromWorkflow] AFTER setNodes - checking nodesRef:`,
          nodesRef.current
        );
      }, 100);
    },
    [mapNodeWithHandlers, setNodes, setEdges, updateWorkflow]
  );

  // Helper function to load published workflow from API
  const loadPublishedWorkflowFromApi = useCallback(
    async (workflowId: string): Promise<Workflow | null> => {
      try {
        console.log(
          `[WorkflowDesigner.loadPublishedWorkflowFromApi] Loading workflow ID: ${workflowId}`
        );
        // First, try to get workflow from local store
        const storedWorkflow = useWorkflowStore
          .getState()
          .workflows.find((w) => w.id === workflowId);
        console.log(
          `[WorkflowDesigner.loadPublishedWorkflowFromApi] Stored workflow found:`,
          storedWorkflow ? `YES (${storedWorkflow.nodes?.length || 0} nodes)` : 'NO'
        );

        // Extract workflow name and version from ID (format: {name}-v{version})
        let workflowName = '';
        let workflowVersion = 1;

        if (storedWorkflow?.name && storedWorkflow?.settings?.version) {
          workflowName = storedWorkflow.name;
          workflowVersion = storedWorkflow.settings.version;
          console.log(
            `[WorkflowDesigner.loadPublishedWorkflowFromApi] Using stored workflow: ${workflowName} version ${workflowVersion}`
          );
        } else {
          // Extract name and version from ID when workflow not in local store
          // ID format is: {name}-v{version}
          const lastDashV = workflowId.lastIndexOf('-v');
          if (lastDashV === -1) {
            console.warn(
              `[WorkflowDesigner.loadPublishedWorkflowFromApi] Cannot parse workflow ID: ${workflowId}`
            );
            return storedWorkflow || null;
          }
          workflowName = workflowId.substring(0, lastDashV);
          workflowVersion = Number.parseInt(workflowId.substring(lastDashV + 2), 10);
          console.log(
            `[WorkflowDesigner.loadPublishedWorkflowFromApi] Parsed workflow from ID: ${workflowName} version ${workflowVersion}`
          );
        }

        // Fetch the published workflow definition from Conductor API
        const workflowDef = await fetchWorkflowByVersion(workflowName, workflowVersion);

        console.log(
          `[WorkflowDesigner.loadPublishedWorkflowFromApi] API returned workflowDef:`,
          workflowDef
        );
        console.log(
          `[WorkflowDesigner.loadPublishedWorkflowFromApi] workflowDef?.tasks:`,
          workflowDef?.tasks
        );

        if (!workflowDef) {
          console.warn(
            `[WorkflowDesigner.loadPublishedWorkflowFromApi] Failed to fetch published workflow from API`
          );
          if (storedWorkflow) {
            console.warn(
              `[WorkflowDesigner.loadPublishedWorkflowFromApi] Falling back to local cache`
            );
            return storedWorkflow;
          }
          return null;
        }

        console.log(
          `[WorkflowDesigner.loadPublishedWorkflowFromApi] API returned workflow with ${(workflowDef as ConductorWorkflow).tasks?.length || 0} tasks`
        );

        // Convert to local workflow format
        const localWorkflow = conductorWorkflowToLocal(workflowDef as ConductorWorkflow);
        console.log(
          `[WorkflowDesigner.loadPublishedWorkflowFromApi] Converted workflow has ${localWorkflow.nodes?.length || 0} nodes`
        );

        // Preserve the original ID and mark as published
        localWorkflow.id = workflowId;
        localWorkflow.publicationStatus = 'PUBLISHED';
        if (storedWorkflow?.createdAt) {
          localWorkflow.createdAt = storedWorkflow.createdAt;
        }

        // IMPORTANT: Preserve stored workflow's arranged nodes if they exist
        // This ensures auto-arranged layouts persist across API refetches
        if (storedWorkflow?.nodes && storedWorkflow.nodes.length > 0) {
          // Check if stored nodes are arranged (not in linear positions)
          const isArranged = storedWorkflow.nodes.some((node, idx) => {
            if (idx === 0) return false;
            const firstNodeX = storedWorkflow.nodes[0].position.x;
            const expectedLinearX = firstNodeX + idx * 300;
            return node.position.x !== expectedLinearX || node.position.y !== 0;
          });

          if (isArranged) {
            console.log(
              `[WorkflowDesigner.loadPublishedWorkflowFromApi] Preserving stored arranged nodes instead of using fresh linear positions`
            );
            // Use the stored nodes (which are arranged) but update with fresh task data
            localWorkflow.nodes = storedWorkflow.nodes;
            localWorkflow.edges = storedWorkflow.edges;
          }
        }

        console.log(
          `[WorkflowDesigner.loadPublishedWorkflowFromApi] Returning workflow with ${localWorkflow.nodes?.length || 0} nodes`
        );
        return localWorkflow;
      } catch (error) {
        console.error('Error loading published workflow from API:', error);
        const stored = useWorkflowStore.getState().workflows.find((w) => w.id === workflowId);
        return stored || null;
      }
    },
    [fetchWorkflowByVersion]
  );

  // Initialize/Load workflow on component mount or when ID changes
  useEffect(() => {
    const loadWorkflow = async () => {
      if (!id) {
        console.log(`[WorkflowDesigner.loadWorkflow] No ID provided`);
        await handleNoWorkflowId();
        return;
      }

      console.log(
        `[WorkflowDesigner.loadWorkflow] Starting load for ID: ${id}, activeTab: ${activeTab}`
      );
      console.log(
        `[WorkflowDesigner.loadWorkflow] All workflows in store:`,
        useWorkflowStore
          .getState()
          .workflows.map((w) => ({ id: w.id, name: w.name, nodes: w.nodes?.length }))
      );

      sessionStorage.setItem('lastActiveWorkflow', id);

      await syncWorkflowsFromFileStore();
      console.log(
        `[WorkflowDesigner.loadWorkflow] After sync, workflows in store:`,
        useWorkflowStore
          .getState()
          .workflows.map((w) => ({ id: w.id, name: w.name, nodes: w.nodes?.length }))
      );

      let foundWorkflow = useWorkflowStore.getState().workflows.find((w) => w.id === id);
      console.log(
        `[WorkflowDesigner.loadWorkflow] Found in store:`,
        foundWorkflow
          ? { id: foundWorkflow.id, name: foundWorkflow.name, nodes: foundWorkflow.nodes?.length }
          : 'NO'
      );

      if (foundWorkflow) {
        // Check if there's a localStorage cache with recent changes
        const cached = loadCachedWorkflow(foundWorkflow.id);
        const hasCachedChanges = cached && cached.nodes?.length > 0;

        // Check if the stored workflow has already been auto-arranged (nodes have snake pattern positions)
        const hasArrangedNodes = checkIfArranged(foundWorkflow);

        // Priority: Use cache if available (preserves user's unsaved changes)
        if (hasCachedChanges) {
          console.log(
            `[WorkflowDesigner.loadWorkflow] Using cached workflow with ${cached.nodes.length} nodes to preserve unsaved changes`
          );
          // Update the workflow in store with cached data
          foundWorkflow = {
            ...foundWorkflow,
            nodes: cached.nodes,
            edges: cached.edges,
          };
          loadNodesAndEdgesFromWorkflow(foundWorkflow);
        } else if (hasArrangedNodes) {
          // Use stored version if it has arranged nodes (no cache needed)
          console.log(
            `[WorkflowDesigner.loadWorkflow] Workflow found with pre-arranged nodes, using stored version`
          );
          loadNodesAndEdgesFromWorkflow(foundWorkflow);
        } else {
          // No cache and nodes not arranged - fetch fresh from API
          console.log(
            `[WorkflowDesigner.loadWorkflow] Workflow found locally but nodes are in linear position, fetching latest from server...`
          );
          const apiWorkflow = await loadPublishedWorkflowFromApi(foundWorkflow.id);
          if (apiWorkflow) {
            foundWorkflow = apiWorkflow;
            console.log(`[WorkflowDesigner.loadWorkflow] Successfully fetched latest from server`);
          }
          loadNodesAndEdgesFromWorkflow(foundWorkflow);
        }
      } else {
        // Workflow not in local store - try to load from API by ID
        console.warn(
          `[WorkflowDesigner.loadWorkflow] Workflow not found in local store, attempting to load from server by ID: ${id}`
        );
        const apiWorkflow = await loadPublishedWorkflowFromApi(id);
        if (apiWorkflow) {
          console.log(`[WorkflowDesigner.loadWorkflow] Successfully loaded from server`);
          loadNodesAndEdgesFromWorkflow(apiWorkflow);
        } else {
          console.error(
            `[WorkflowDesigner.loadWorkflow] Failed to load workflow from server: ${id}`
          );
          setNodes([]);
          setEdges([]);
        }
      }
    };

    loadWorkflow();

    // Cleanup: Reset when component unmounts
    return () => {
      // Cleanup logic
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id, NOT on loadPublishedWorkflowFromApi

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
            publicationStatus: 'LOCAL',
            settings: workflowSettingsRef.current,
          };
          useWorkflowStore.getState().addWorkflow(newWorkflow);
        }

        // Get all workflows from store and persist IMMEDIATELY
        const workflows = useWorkflowStore.getState().workflows;

        // Save to localStorage for immediate persistence
        try {
          localStorage.setItem('workflows', JSON.stringify(workflows));
          console.log('Workflows persisted to localStorage on unmount');
        } catch (err) {
          console.warn('Failed to save to localStorage on unmount:', err);
        }

        // Also persist to fileStore asynchronously (non-blocking)
        // This ensures workflows are saved even if only localStorage is available initially
        (async () => {
          try {
            const { fileStoreClient } = await import('@/utils/fileStore');
            let savedCount = 0;
            for (const wf of workflows) {
              const workflowToSave = {
                id: wf.id,
                name: wf.name,
                description: wf.description,
                version: wf.version,
                schemaVersion: wf.schemaVersion,
                ownerEmail: wf.ownerEmail,
                ownerApp: wf.ownerApp,
                createdBy: wf.createdBy,
                updatedBy: wf.updatedBy,
                createTime: wf.createTime,
                updateTime: wf.updateTime,
                nodes: wf.nodes,
                edges: wf.edges,
                createdAt: wf.createdAt,
                status: wf.status,
                syncStatus: wf.syncStatus,
                restartable: wf.restartable,
                timeoutSeconds: wf.timeoutSeconds,
                timeoutPolicy: wf.timeoutPolicy,
                workflowStatusListenerEnabled: wf.workflowStatusListenerEnabled,
                failureWorkflow: wf.failureWorkflow,
                inputParameters: wf.inputParameters,
                outputParameters: wf.outputParameters,
                inputTemplate: wf.inputTemplate,
                accessPolicy: wf.accessPolicy,
                variables: wf.variables,
                tasks: wf.tasks,
                settings: wf.settings,
                publicationStatus: wf.publicationStatus,
              };
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const result = await fileStoreClient.saveWorkflow(workflowToSave as any);
              if (result) {
                savedCount++;
              }
            }
            if (savedCount > 0) {
              console.log(
                `Persisted ${savedCount}/${workflows.length} workflows to fileStore on unmount`
              );
            }
          } catch (err) {
            console.warn('Failed to persist workflows to fileStore on unmount:', err);
          }
        })();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on unmount, uses refs for latest values

  // Update node handlers after they're loaded or when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      // Check if any node is missing handlers
      const needsUpdate = nodes.some((node) => !node.data.onEdit || !node.data.onDelete);

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

  // DISABLED: Auto-arrange was causing nodes to disappear when dragging/dropping
  // The auto-arrange logic now only runs when user explicitly clicks "Auto Arrange" button
  // This prevents unwanted repositioning that was causing visual glitches
  // See handleAutoArrange() function for the actual implementation
  // useEffect(() => {
  //   // This effect has been disabled to fix drag-drop disappearing nodes issue
  // }, [nodes.length]);

  // Auto-save nodes and edges whenever they change
  useEffect(() => {
    if (workflow && (nodes.length > 0 || edges.length > 0)) {
      // Debounce the save to avoid too frequent updates
      const timeoutId = setTimeout(() => {
        updateWorkflow(workflow.id, {
          nodes: nodes,
          edges: edges as WorkflowEdge[],
        });

        // Also save to localStorage for local cache persistence
        try {
          const cacheData = {
            workflowId: workflow.id,
            workflowName: workflowName,
            nodes: nodes,
            edges: edges,
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem(`workflow-cache-${workflow.id}`, JSON.stringify(cacheData));
        } catch (err) {
          console.warn('Failed to save workflow to localStorage:', err);
        }

        // DISABLED: persistWorkflows() was causing performance issues by saving all 90+ workflows
        // This will be called manually on unmount instead
        // persistWorkflows().catch(err => {
        //   console.warn('Failed to persist workflows during auto-save:', err);
        // });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, workflow?.id, workflowName]); // Include workflowName for cache

  // Auto-fit view when nodes are added or removed (via drag/drop)
  // Store previous node count to detect when nodes are added/removed
  const prevNodeCountRef = useRef(nodes.length);
  useEffect(() => {
    // Trigger fit-view if nodes were added or removed
    if (nodes.length !== prevNodeCountRef.current && nodes.length > 0) {
      prevNodeCountRef.current = nodes.length;
      // Dispatch custom event that can be caught by ReactFlow component
      // We'll use a small delay to allow the DOM to update
      const fitTimer = setTimeout(() => {
        globalThis.dispatchEvent(new CustomEvent('fitView'));
      }, 50);
      return () => clearTimeout(fitTimer);
    }
    prevNodeCountRef.current = nodes.length;
  }, [nodes.length]);

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
      // IMPORTANT: Use original workflow.tasks if available (preserves all fields from API/fileStore)
      // Otherwise, reconstruct from nodes (for workflows created in designer)
      tasks:
        workflow?.tasks && Array.isArray(workflow.tasks) && workflow.tasks.length > 0
          ? workflow.tasks
          : [...nodes]
              .sort((a, b) => (a.data.sequenceNo || 0) - (b.data.sequenceNo || 0))
              .map((node) => {
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
  }, [nodes, workflowSettings, workflowName, workflow?.tasks]);

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
        restartable:
          parsedJson.restartable === undefined
            ? workflowSettings.restartable
            : parsedJson.restartable,
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
        workflowStatusListenerEnabled:
          parsedJson.workflowStatusListenerEnabled ||
          workflowSettings.workflowStatusListenerEnabled,
      };

      setWorkflowSettings(updatedSettings);

      // If the JSON contains tasks, create visual nodes from them
      if (parsedJson.tasks && Array.isArray(parsedJson.tasks) && parsedJson.tasks.length > 0) {
        // Helper function to get task color based on type
        const getTaskColor = (taskType: string): string => {
          // System tasks
          const systemTask = systemTasks.find((t) => t.type === taskType);
          if (systemTask) return systemTask.color;

          // Operators
          const operator = operators.find((t) => t.type === taskType);
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

        // Auto-arrange nodes immediately after creating them from JSON
        const arrangedNodes = performAutoArrange(newNodes);

        // Update workflow with tasks if we have an active workflow
        if (workflow) {
          updateWorkflow(workflow.id, {
            name: parsedJson.name || workflowName,
            settings: updatedSettings,
            tasks: parsedJson.tasks,
          });
        }

        // Trigger auto-fit after a short delay to allow DOM to update
        setTimeout(() => {
          globalThis.dispatchEvent(new CustomEvent('fitView'));
        }, 100);

        toast({
          title: 'JSON Saved & Imported',
          description: `Workflow updated with ${arrangedNodes.length} tasks and auto-arranged on canvas.`,
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
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      // Get sequence numbers
      const sourceSeq = sourceNode.data.sequenceNo || 0;
      const targetSeq = targetNode.data.sequenceNo || 0;

      // Only allow connecting to the next node in sequence
      if (targetSeq !== sourceSeq + 1) {
        toast({
          title: 'Invalid connection',
          description:
            'Tasks can only be connected in sequence order. Use Auto Arrange to reorganize.',
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
  const updateNodeWithConfig = useCallback(
    (node: Node, targetNodeId: string, config: unknown) => {
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
    },
    [handleEditNode, handleDeleteNode]
  );

  // Helper to extract workflow tasks from nodes
  const extractWorkflowTasks = (nodes: Node[]) => {
    const sortedNodes = [...nodes];
    sortedNodes.sort((a, b) => (a.data.sequenceNo || 0) - (b.data.sequenceNo || 0));
    return sortedNodes
      .map((node) => {
        if (!node.data.config) return null;
        // Remove sequenceNo from config as it's UI-only, not a Conductor field
        const { sequenceNo: _sequenceNo, ...cleanConfig } = node.data.config;
        return cleanConfig;
      })
      .filter(Boolean); // Remove nodes without config
  };

  // Helper function to perform auto-arrange logic (extracted for reuse)
  const performAutoArrange = useCallback(
    (nodesToArrange: Node[]) => {
      if (nodesToArrange.length === 0) return nodesToArrange;

      // Sort nodes by their sequence number to maintain logical order
      const sortedNodes = [...nodesToArrange].sort((a, b) => {
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
        const actualColIndex = isOddRow ? nodesPerRow - 1 - colIndex : colIndex;

        return {
          ...node,
          draggable: false,
          position: {
            x: startX + actualColIndex * horizontalSpacing,
            y: startY + rowIndex * verticalSpacing,
          },
        };
      });

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
        let targetHandle = 'left'; // Default: connect to left

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

      setNodes(arrangedNodes);
      setEdges(newEdges);

      return arrangedNodes;
    },
    [setNodes, setEdges]
  );

  // Helper to handle the config save logic - wrapped in useCallback to fix hook dependencies
  const saveTaskConfigLogic = useCallback(
    (config: unknown, setModalOpen: (open: boolean) => void) => {
      const cfg = config as Record<string, unknown>;
      // Check if this is a new drop (pendingTaskDrop exists) or editing existing node
      if (pendingTaskDrop) {
        // Creating a new node from drag & drop
        const taskRefId =
          (cfg.taskReferenceName as string) ||
          `${pendingTaskDrop.taskType.toLowerCase()}_${Date.now()}`;

        setNodes((nds) => {
          const sequenceNo = nds.length + 1;

          // Do NOT add sequenceNo to config - it's UI-only, stored in node.data
          // Config should only contain Conductor-supported fields

          const newNode: Node = {
            id: taskRefId,
            type: 'custom',
            position: pendingTaskDrop.position, // Use the actual drop position where user dragged the task
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

          // Auto-arrange nodes immediately after adding a new one
          return performAutoArrange(updatedNodes);
        });

        setPendingTaskDrop(null);
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
    },
    [
      selectedNodeForConfig,
      pendingNodeForAutoConfig,
      pendingTaskDrop,
      setNodes,
      workflow,
      updateWorkflow,
      handleEditNode,
      handleDeleteNode,
      setPendingNodeForAutoConfig,
      setPendingTaskDrop,
      setSelectedNodeForConfig,
      updateNodeWithConfig,
      performAutoArrange,
    ]
  );

  // Generic save handler for task configs
  const createTaskConfigHandler = useCallback(
    (setModalOpen: (open: boolean) => void) => {
      return (config: unknown) => {
        saveTaskConfigLogic(config, setModalOpen);
      };
    },
    [saveTaskConfigLogic]
  );

  const handleSaveHttpTaskConfig = useCallback(
    (config: unknown) => createTaskConfigHandler(modalActions.setIsHttpConfigModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveKafkaTaskConfig = useCallback(
    (config: KafkaPublishTaskConfig) =>
      createTaskConfigHandler(modalActions.setIsKafkaPublishModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveJsonJqTransformConfig = useCallback(
    (config: JsonJqTransformTaskConfig) =>
      createTaskConfigHandler(modalActions.setIsJsonJqTransformModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );
  const handleSaveNoopConfig = useCallback(
    (config: NoopSystemTaskConfig) =>
      createTaskConfigHandler(modalActions.setIsNoopModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveEventConfig = useCallback(
    (config: EventSystemTaskConfig) =>
      createTaskConfigHandler(modalActions.setIsEventModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveWaitConfig = useCallback(
    (config: WaitSystemTaskConfig) =>
      createTaskConfigHandler(modalActions.setIsWaitModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveTerminateConfig = useCallback(
    (config: TerminateSystemTaskConfig) =>
      createTaskConfigHandler(modalActions.setIsTerminateModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveInlineConfig = useCallback(
    (config: InlineSystemTaskConfig) =>
      createTaskConfigHandler(modalActions.setIsInlineModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveHumanTaskConfig = useCallback(
    (config: HumanTaskConfig) =>
      createTaskConfigHandler(modalActions.setIsHumanTaskModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  // Operator Modal Handlers
  const handleSaveForkJoinConfig = useCallback(
    (config: ForkJoinConfig) =>
      createTaskConfigHandler(modalActions.setIsForkJoinModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveForkJoinDynamicConfig = useCallback(
    (config: ForkJoinDynamicConfig) =>
      createTaskConfigHandler(modalActions.setIsForkJoinDynamicModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveSwitchConfig = useCallback(
    (config: SwitchConfig) => createTaskConfigHandler(modalActions.setIsSwitchModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveDoWhileConfig = useCallback(
    (config: DoWhileConfig) => createTaskConfigHandler(modalActions.setIsDoWhileModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveDynamicConfig = useCallback(
    (config: DynamicConfig) => createTaskConfigHandler(modalActions.setIsDynamicModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveOperatorInlineConfig = useCallback(
    (config: InlineConfig) =>
      createTaskConfigHandler(modalActions.setIsOperatorInlineModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveJoinConfig = useCallback(
    (config: JoinConfig) => createTaskConfigHandler(modalActions.setIsJoinModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveOperatorSubWorkflowConfig = useCallback(
    (config: SubWorkflowConfig) =>
      createTaskConfigHandler(modalActions.setIsOperatorSubWorkflowModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveStartWorkflowConfig = useCallback(
    (config: StartWorkflowConfig) =>
      createTaskConfigHandler(modalActions.setIsStartWorkflowModalOpen)(config),
    [createTaskConfigHandler, modalActions]
  );

  const handleSaveSimpleTaskConfig = useCallback(
    (config: WorkflowTaskConfig) => {
      saveTaskConfigLogic(config, modalActions.setIsSimpleTaskModalOpen);
    },
    [saveTaskConfigLogic, modalActions]
  );

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
      const task =
        systemTasks.find((t) => t.id === taskId) ||
        workerTasks.find((t) => t.id === taskId) ||
        operators.find((t) => t.id === taskId);
      if (!task) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 62.5,
        y: event.clientY - reactFlowBounds.top - 25,
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

    performAutoArrange(nodes);
  }, [nodes, performAutoArrange, toast]);

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
        publicationStatus: 'LOCAL' as const,
      };
      useWorkflowStore.getState().addWorkflow(tempWorkflow);
      navigate(`/diagram/${tempWorkflow.id}?mode=preview`);
    }
  };

  // Helper: Create new workflow object from current state
  const createNewWorkflow = () => ({
    id: `workflow-${Date.now()}`,
    name: workflowName,
    description: workflowSettings.description,
    nodes: nodes,
    edges: edges as WorkflowEdge[],
    createdAt: new Date().toISOString(),
    status: workflowSettings.status.toLowerCase() as 'draft' | 'active' | 'paused',
    settings: workflowSettings,
  });

  // Helper: Save workflow to local store and cache
  const saveToLocalStoreAndCache = (wf: typeof workflow, isNew: boolean) => {
    if (isNew) {
      useWorkflowStore.getState().addWorkflow(wf!);
    } else {
      updateWorkflow(wf!.id, {
        name: workflowName,
        description: workflowSettings.description,
        settings: workflowSettings,
        nodes: nodes,
        edges: edges as WorkflowEdge[],
      });
    }

    saveWorkflowToCache({
      id: wf!.id,
      name: workflowName,
      description: workflowSettings.description,
      syncStatus: 'local-only',
      isLocalOnly: isNew,
      definition: {
        name: workflowName,
        description: workflowSettings.description,
        version: workflowSettings.version,
        settings: workflowSettings,
        nodes: nodes,
        edges: edges,
      },
    });
  };

  // Helper: Sync workflow to filestore and Conductor API
  const syncWorkflowToConductor = async (wf: typeof workflow): Promise<boolean> => {
    await syncToFileStore().catch((err) => {
      console.warn('Failed to sync to filestore:', err);
    });

    markAsSyncing(wf!.id);
    const { localWorkflowToConductor } = await import('@/utils/workflowConverter');
    const conductorWorkflow = localWorkflowToConductor(wf!);

    try {
      const success = await saveWorkflow(conductorWorkflow);

      // If saveWorkflow returns false, it means there was an error
      // The error details are already logged to dashboard and logging store
      if (!success) {
        throw new Error('Failed to save workflow to Conductor server');
      }

      return success;
    } catch (error) {
      console.error('Failed to sync workflow to Conductor:', error);
      // Re-throw to allow handleSave to catch and display error details
      throw error;
    }
  };

  // Helper: Handle successful Conductor publication
  const handlePublishSuccess = (wf: typeof workflow, isNew: boolean) => {
    markAsPublished(wf!.id);
    updateWorkflow(wf!.id, { publicationStatus: 'PUBLISHED' });
    toast({
      title: 'Workflow saved',
      description: `Workflow "${workflowName}" has been ${isNew ? 'created' : 'updated'} and published to Conductor`,
    });

    if (isNew) {
      navigate(`/workflows/${wf!.id}`);
    }
  };

  // Helper: Handle Conductor publication failure
  const handlePublishFailure = (wf: typeof workflow, isNew: boolean) => {
    markAsDraft(wf!.id);
    toast({
      title: 'Saved to cache',
      description: `Workflow "${workflowName}" saved locally. Connection to Conductor server failed. You can publish it later.`,
      variant: 'default',
    });

    if (isNew) {
      navigate(`/workflows/${wf!.id}`);
    }
  };

  // Helper: Handle save errors
  const handleSaveError = (wf: typeof workflow | null) => {
    if (wf) {
      saveWorkflowToCache({
        id: wf.id,
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
      markAsDraft(wf.id);
    }

    toast({
      title: 'Saved to cache',
      description: 'Workflow saved locally due to an error. You can try publishing later.',
      variant: 'default',
    });
  };

  // Improved save logic with offline caching support
  // Workflow changes are cached even if Conductor publish fails
  const handleSave = async (): Promise<void> => {
    try {
      const isNew = !workflow;
      const wf = isNew ? createNewWorkflow() : workflow;

      saveToLocalStoreAndCache(wf, isNew);
      const success = await syncWorkflowToConductor(wf);

      if (success) {
        handlePublishSuccess(wf, isNew);
      } else {
        handlePublishFailure(wf, isNew);
      }
    } catch (error) {
      console.error('Error saving workflow:', error);

      // Import dashboard store to check for recent errors
      const { useDashboardStore } = await import('@/stores/dashboardStore');
      const recentErrors = useDashboardStore.getState().recentErrors;

      // Get the most recent error (should be the one we just encountered)
      const latestError = recentErrors.at(-1);

      // Extract detailed error message
      let errorTitle = 'Failed to save workflow';
      let errorDescription =
        error instanceof Error ? error.message : 'An unexpected error occurred';

      // Use the detailed error from dashboard store if available
      if (latestError?.workflow === workflowName) {
        errorTitle = latestError.message;
        errorDescription = latestError.details;
      }

      // Show detailed error to user with all available information
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
        duration: 10000, // Show for 10 seconds so user has time to read
      });

      // Save to cache as fallback
      handleSaveError(workflow);
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

  const handleExecuteWorkflow = async (workflowId: string, input: unknown) => {
    try {
      // Find the workflow name from the local store
      const workflow = useWorkflowStore.getState().workflows.find((w) => w.id === workflowId);
      if (!workflow) {
        toast({
          title: 'Workflow not found',
          description: 'Could not find the workflow to execute.',
          variant: 'destructive',
        });
        return;
      }

      // Call the real Conductor API to start the workflow
      // Use the workflow version if available, defaults to 1
      const executionId = await startWorkflow(
        workflow.name,
        input as Record<string, unknown>,
        workflow.version || 1
      );

      toast({
        title: 'Workflow execution started',
        description: `Execution ID: ${executionId}`,
      });

      // Navigate to the execution details page with the returned execution ID
      setTimeout(() => {
        navigate(`/executions/${executionId}`);
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
        const configWithSequence = {
          ...config,
          sequenceNo: selectedNodeForConfig.data.sequenceNo,
        };
        return configWithSequence;
      }

      return nodeConfig;
    }

    // For auto-config during creation - return the pending node's config
    if (pendingNodeForAutoConfig?.data?.taskType === taskType) {
      const config = pendingNodeForAutoConfig.data.config;

      if (config) {
        const configWithSequence = {
          ...(config as Record<string, unknown>),
          sequenceNo: pendingNodeForAutoConfig.data.sequenceNo,
        };
        return configWithSequence;
      }

      return config;
    }

    return undefined;
  };

  return (
    <>
      <div className="h-full flex flex-col bg-card">
        {/* Top Bar */}
        <div className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/workflows')}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary"
              title="Go back to workflows"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>

            {/* Logo and App Name */}
            <img
              src={logo}
              alt="ConflixIQ Studio Logo"
              className="h-8 w-8 mr-3 select-none"
              draggable={false}
              style={{ minWidth: 32 }}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-foreground">ConflixIQ Studio</span>
                <span className="text-base font-semibold text-foreground">/</span>
                <span className="text-base font-semibold text-foreground">{workflowName}</span>
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
              className="text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
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
          <div className="flex-1 flex flex-col bg-background">
            {/* Canvas Toolbar */}
            <div className="h-14 bg-card border-b border-border px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('design')}
                  className={`font-medium h-8 px-4 ${
                    activeTab === 'design'
                      ? 'text-foreground bg-cyan-500 hover:bg-cyan-600'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
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
                      ? 'text-foreground bg-cyan-500 hover:bg-cyan-600'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
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
                      ? 'text-foreground bg-cyan-500 hover:bg-cyan-600'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
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
                      ? 'text-foreground bg-cyan-500 hover:bg-cyan-600'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
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
                  <div className="bg-card border-b border-border px-4 py-2">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Tip:</span> Drop tasks on canvas to add them •
                      Tasks are automatically organized in a snake pattern (5 per row)
                      <br />
                      <span className="font-medium">Note:</span> Nodes auto-arrange on every drop
                      for optimal layout. Edit/Delete: Hover over task and click blue/red buttons
                    </p>
                  </div>

                  {/* Canvas */}
                  <section
                    className="flex-1 relative"
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    aria-label="Workflow canvas"
                  >
                    {(() => {
                      console.log(`[WorkflowDesigner RENDER] nodes.length: ${nodes.length}`);
                      return null;
                    })()}
                    {nodes.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center max-w-md">
                          <div className="w-16 h-16 bg-[#2a3142] rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            Start Building Your Workflow
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Click on tasks from the Task Library to add them to your workflow canvas
                          </p>
                        </div>
                      </div>
                    ) : (
                      <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={(changes) => {
                          // Filter out position changes to prevent users from moving nodes
                          const filteredChanges = changes.filter(
                            (change) => change.type !== 'position'
                          );
                          if (filteredChanges.length > 0) {
                            onNodesChange(filteredChanges);
                          }
                        }}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-background"
                        defaultEdgeOptions={{
                          type: 'bezier',
                          animated: true,
                          style: { stroke: '#00bcd4', strokeWidth: 2 },
                        }}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        panOnScroll={false}
                        panOnDrag={false}
                        zoomOnScroll={false}
                        zoomOnDoubleClick={false}
                        zoomOnPinch={false}
                      >
                        <FitViewListener />
                        <Background
                          color="hsl(220, 13%, 96%)"
                          gap={20}
                          size={2}
                          variant={'dots' as BackgroundVariant}
                        />
                        <Controls
                          className="bg-card border border-border rounded-lg overflow-hidden"
                          showInteractive={false}
                        />
                      </ReactFlow>
                    )}
                  </section>
                </div>
              )}

              {activeTab === 'summary' && (
                <div className="h-full overflow-y-auto p-6 bg-background">
                  <Card className="max-w-4xl mx-auto p-6 bg-card border-border">
                    <h3 className="text-xl font-semibold text-foreground mb-6">Workflow Summary</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground text-sm">Name</Label>
                          <p className="text-foreground mt-1">{workflowName}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-sm">Status</Label>
                          <Badge className="mt-1">{workflowSettings.status}</Badge>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-sm">Version</Label>
                          <p className="text-foreground mt-1">{workflowSettings.version}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-sm">Total Tasks</Label>
                          <p className="text-foreground mt-1">{nodes.length}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-sm">Timeout</Label>
                          <p className="text-foreground mt-1">{workflowSettings.timeoutSeconds}s</p>
                        </div>
                      </div>
                      <Separator className="bg-border" />
                      <div>
                        <Label className="text-muted-foreground text-sm">Description</Label>
                        <p className="text-foreground mt-1">{workflowSettings.description}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="h-full overflow-y-auto p-6 bg-background">
                  <Card className="max-w-4xl mx-auto p-6 bg-card border-border">
                    <h3 className="text-xl font-semibold text-foreground mb-6">Workflow Settings</h3>

                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-foreground">Basic Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label className="text-foreground">Workflow Name *</Label>
                            <Input
                              value={workflowName}
                              onChange={(e) => setWorkflowName(e.target.value)}
                              className="mt-2 bg-background text-foreground border-border"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-foreground">Description</Label>
                            <Textarea
                              value={workflowSettings.description}
                              onChange={(e) =>
                                setWorkflowSettings({
                                  ...workflowSettings,
                                  description: e.target.value,
                                })
                              }
                              className="mt-2 bg-background text-foreground border-border"
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-border" />

                      {/* Ownership & Authorship */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-foreground">Ownership & Authorship</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-foreground">
                              Created By (Default: ConflixIQ Studio)
                            </Label>
                            <Input
                              value={workflowSettings.createdBy || 'ConflixIQ Studio'}
                              onChange={(e) =>
                                setWorkflowSettings({
                                  ...workflowSettings,
                                  createdBy: e.target.value,
                                })
                              }
                              className="mt-2 bg-background text-foreground border-border"
                            />
                          </div>
                          <div>
                            <Label className="text-foreground">
                              Updated By (Default: ConflixIQ Studio)
                            </Label>
                            <Input
                              value={workflowSettings.updatedBy || 'ConflixIQ Studio'}
                              onChange={(e) =>
                                setWorkflowSettings({
                                  ...workflowSettings,
                                  updatedBy: e.target.value,
                                })
                              }
                              className="mt-2 bg-background text-foreground border-border"
                            />
                          </div>
                          <div>
                            <Label className="text-foreground">Owner Email</Label>
                            <Input
                              type="email"
                              value={workflowSettings.ownerEmail || ''}
                              onChange={(e) =>
                                setWorkflowSettings({
                                  ...workflowSettings,
                                  ownerEmail: e.target.value,
                                })
                              }
                              placeholder="dev-team@example.com"
                              className="mt-2 bg-background text-foreground border-border"
                            />
                          </div>
                          <div>
                            <Label className="text-foreground">Owner Application</Label>
                            <Input
                              value={workflowSettings.ownerApp || ''}
                              onChange={(e) =>
                                setWorkflowSettings({
                                  ...workflowSettings,
                                  ownerApp: e.target.value,
                                })
                              }
                              placeholder="data_service_api"
                              className="mt-2 bg-background text-foreground border-border"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-border" />

                      {/* Version & Organization */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-foreground">Version & Organization</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-foreground">Version</Label>
                            <Input
                              type="number"
                              value={workflowSettings.version}
                              onChange={(e) =>
                                setWorkflowSettings({
                                  ...workflowSettings,
                                  version: Number.parseInt(e.target.value) || 1,
                                })
                              }
                              className="mt-2 bg-background text-foreground border-border"
                            />
                          </div>
                          <div>
                            <Label className="text-foreground">Schema Version</Label>
                            <Input
                              type="number"
                              value={workflowSettings.schemaVersion}
                              onChange={(e) =>
                                setWorkflowSettings({
                                  ...workflowSettings,
                                  schemaVersion: Number.parseInt(e.target.value) || 2,
                                })
                              }
                              className="mt-2 bg-background text-foreground border-border"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-border" />

                      {/* Status & Dates */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-foreground">Status & Dates</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-foreground">Status</Label>
                            <Select
                              value={workflowSettings.status}
                              onValueChange={(value: 'DRAFT' | 'ACTIVE' | 'PAUSED') =>
                                setWorkflowSettings({ ...workflowSettings, status: value })
                              }
                            >
                              <SelectTrigger className="mt-2 bg-background text-foreground border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-card text-foreground border-border">
                                <SelectItem value="DRAFT">DRAFT</SelectItem>
                                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                                <SelectItem value="PAUSED">PAUSED</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-foreground">Effective Date (MM-DD-YYYY)</Label>
                            <Input
                              type="date"
                              value={formatDateForInput(workflowSettings.effectiveDate)}
                              onChange={(e) =>
                                setWorkflowSettings({
                                  ...workflowSettings,
                                  effectiveDate: formatDateFromInput(e.target.value),
                                })
                              }
                              className="mt-2 bg-background text-foreground border-border"
                            />
                          </div>
                          <div>
                            <Label className="text-foreground">End Date (MM-DD-YYYY)</Label>
                            <Input
                              type="date"
                              value={formatDateForInput(workflowSettings.endDate)}
                              onChange={(e) =>
                                setWorkflowSettings({
                                  ...workflowSettings,
                                  endDate: formatDateFromInput(e.target.value),
                                })
                              }
                              className="mt-2 bg-background text-foreground border-border"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-border" />

                      {/* Execution Settings */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-foreground">Execution Settings</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-foreground">Timeout (seconds)</Label>
                            <Input
                              type="number"
                              value={workflowSettings.timeoutSeconds}
                              onChange={(e) =>
                                setWorkflowSettings({
                                  ...workflowSettings,
                                  timeoutSeconds: Number.parseInt(e.target.value) || 3600,
                                })
                              }
                              className="mt-2 bg-background text-foreground border-border"
                            />
                          </div>
                          <div>
                            <Label className="text-foreground">Timeout Policy</Label>
                            <Select
                              value={workflowSettings.timeoutPolicy || 'TIME_OUT_WF'}
                              onValueChange={(value: 'TIME_OUT_WF' | 'ALERT_ONLY') =>
                                setWorkflowSettings({ ...workflowSettings, timeoutPolicy: value })
                              }
                            >
                              <SelectTrigger className="mt-2 bg-background text-foreground border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-card text-foreground border-border">
                                <SelectItem value="TIME_OUT_WF">TIME_OUT_WF</SelectItem>
                                <SelectItem value="ALERT_ONLY">ALERT_ONLY</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center justify-between pt-4">
                            <Label className="text-foreground">Restartable</Label>
                            <Switch
                              checked={workflowSettings.restartable}
                              onCheckedChange={(checked) =>
                                setWorkflowSettings({ ...workflowSettings, restartable: checked })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between pt-4">
                            <Label className="text-foreground">Workflow Status Listener Enabled</Label>
                            <Switch
                              checked={workflowSettings.workflowStatusListenerEnabled || false}
                              onCheckedChange={(checked) =>
                                setWorkflowSettings({
                                  ...workflowSettings,
                                  workflowStatusListenerEnabled: checked,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-[#2a3142]" />

                      {/* Failure Workflow */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-foreground">Failure Handling</h4>
                        <div>
                          <Label className="text-foreground">Failure/Compensation Workflow</Label>
                          <Input
                            value={workflowSettings.failureWorkflow || ''}
                            onChange={(e) =>
                              setWorkflowSettings({
                                ...workflowSettings,
                                failureWorkflow: e.target.value,
                              })
                            }
                            placeholder="compensation_workflow_v1"
                            className="mt-2 bg-background text-foreground border-border"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Optional workflow to execute on failure
                          </p>
                        </div>
                      </div>

                      <Separator className="bg-border" />

                      {/* Parameters */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-foreground">Parameters</h4>
                        <div>
                          <Label className="text-foreground">Input Parameters (comma-separated)</Label>
                          <Input
                            value={workflowSettings.inputParameters.join(', ')}
                            onChange={(e) =>
                              setWorkflowSettings({
                                ...workflowSettings,
                                inputParameters: e.target.value
                                  .split(',')
                                  .map((p) => p.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="param1, param2, param3"
                            className="mt-2 bg-background text-foreground border-border"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground">Input Template (JSON)</Label>
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
                            className="mt-2 bg-background text-foreground border-border font-mono text-sm"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label className="text-foreground">Output Parameters (JSON)</Label>
                          <Textarea
                            value={JSON.stringify(workflowSettings.outputParameters, null, 2)}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                setWorkflowSettings({
                                  ...workflowSettings,
                                  outputParameters: parsed,
                                });
                              } catch {
                                // Invalid JSON - silently ignore to allow editing
                              }
                            }}
                            placeholder="{}"
                            className="mt-2 bg-background text-foreground border-border font-mono text-sm"
                            rows={3}
                          />
                        </div>
                      </div>

                      <Separator className="bg-border" />

                      {/* Access Control & Variables */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-foreground">
                          Access Control & Variables
                        </h4>
                        <div>
                          <Label className="text-foreground">Access Policy (JSON)</Label>
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
                            className="mt-2 bg-background text-foreground border-border font-mono text-sm"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label className="text-foreground">Workflow Variables (JSON)</Label>
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
                            className="mt-2 bg-background text-foreground border-border font-mono text-sm"
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
                <div className="h-full overflow-y-auto p-6 bg-background">
                  <Card
                    className="max-w-4xl mx-auto p-6 bg-card border-border"
                    style={{ '--line-height': '1.5rem' } as React.CSSProperties}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-foreground">
                        Workflow Definition (JSON)
                      </h3>
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
                          className="text-cyan-500 border-border"
                        >
                          Copy JSON
                        </Button>
                      </div>
                    </div>
                    <JsonTextarea
                      value={jsonText}
                      onChange={handleJsonChange}
                      className="font-mono text-xs bg-background text-foreground"
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== pendingNodeForAutoConfig.id &&
                    e.target !== pendingNodeForAutoConfig.id
                )
              );
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

