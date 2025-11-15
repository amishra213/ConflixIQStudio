import { useEffect, useRef, useState } from 'react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { Trash2Icon, SettingsIcon, AlignCenterIcon, MaximizeIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import {
  TaskConfigurationModal,
  LambdaTaskConfigModal,
  DecisionTaskConfigModal,
  MapperTaskConfigModal,
  ScheduledWaitTaskConfigModal,
  SignalOrScheduledWaitTaskConfigModal,
  SignalTaskConfigModal,
  SignalWaitTaskConfigModal,
  TerminateTaskConfigModal,
  PassThroughTaskConfigModal,
  DoWhileTaskConfigModal,
  ForkAndConvergeTaskConfigModal, // Import new modal
  FallbackJsonTaskModal,
} from './task-modals';

interface CanvasNode {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config?: any;
}

interface CanvasEdge {
  from: string;
  to: string;
}

export default function WorkflowCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { 
    canvasNodes, 
    canvasEdges, 
    setCanvasNodes, 
    setCanvasEdges 
  } = useWorkflowStore();
  const [nodes, setNodes] = useState<CanvasNode[]>(canvasNodes);
  const [edges, setEdges] = useState<CanvasEdge[]>(canvasEdges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configuringNode, setConfiguringNode] = useState<CanvasNode | null>(null);
  const [lambdaModalOpen, setLambdaModalOpen] = useState(false);
  const [configuringLambdaNode, setConfiguringLambdaNode] = useState<CanvasNode | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [configuringDecisionNode, setConfiguringDecisionNode] = useState<CanvasNode | null>(null);
  const [configuringMapperNode, setConfiguringMapperNode] = useState<CanvasNode | null>(null);
  const [mapperModalOpen, setMapperModalOpen] = useState(false);
  const [configuringScheduledWaitNode, setConfiguringScheduledWaitNode] = useState<CanvasNode | null>(null);
  const [scheduledWaitModalOpen, setScheduledWaitModalOpen] = useState(false);
  const [configuringSignalOrScheduledWaitNode, setConfiguringSignalOrScheduledWaitNode] = useState<CanvasNode | null>(null);
  const [signalOrScheduledWaitModalOpen, setSignalOrScheduledWaitModalOpen] = useState(false);
  const [configuringSignalNode, setConfiguringSignalNode] = useState<CanvasNode | null>(null);
  const [signalModalOpen, setSignalModalOpen] = useState(false);
  const [configuringSignalWaitNode, setConfiguringSignalWaitNode] = useState<CanvasNode | null>(null);
  const [signalWaitModalOpen, setSignalWaitModalOpen] = useState(false);
  const [configuringPassThroughNode, setConfiguringPassThroughNode] = useState<CanvasNode | null>(null);
  const [passThroughModalOpen, setPassThroughModalOpen] = useState(false);
  const [configuringDoWhileNode, setConfiguringDoWhileNode] = useState<CanvasNode | null>(null);
  const [doWhileModalOpen, setDoWhileModalOpen] = useState(false);
  const [configuringForkAndConvergeNode, setConfiguringForkAndConvergeNode] = useState<CanvasNode | null>(null); // New state
  const [forkAndConvergeModalOpen, setForkAndConvergeModalOpen] = useState(false); // New state

  // Terminate modal state
  const [terminateModalOpen, setTerminateModalOpen] = useState(false);
  const [configuringTerminateNode, setConfiguringTerminateNode] = useState<CanvasNode | null>(null);

  // Fallback modal state
  const [fallbackModalOpen, setFallbackModalOpen] = useState(false);
  const [configuringFallbackNode, setConfiguringFallbackNode] = useState<CanvasNode | null>(null);

  // Load persisted nodes and edges on mount
  useEffect(() => {
    if (canvasNodes.length > 0) {
      setNodes(canvasNodes);
    }
    if (canvasEdges.length > 0) {
      setEdges(canvasEdges);
    }
  }, []);

  // Persist nodes and edges to store whenever they change
  useEffect(() => {
    setCanvasNodes(nodes);
  }, [nodes, setCanvasNodes]);

  useEffect(() => {
    setCanvasEdges(edges);
  }, [edges, setCanvasEdges]);

  useEffect(() => {
    drawCanvas();
  }, [nodes, edges, selectedNode, connectingFrom]);

  useEffect(() => {
    console.log('=== State Change Detected ===');
    console.log('configModalOpen:', configModalOpen);
    console.log('configuringNode:', configuringNode);
    console.log('lambdaModalOpen:', lambdaModalOpen);
    console.log('configuringLambdaNode:', configuringLambdaNode);
    console.log('decisionModalOpen:', decisionModalOpen);
    console.log('configuringDecisionNode:', configuringDecisionNode);
  }, [configModalOpen, configuringNode, lambdaModalOpen, configuringLambdaNode, decisionModalOpen, configuringDecisionNode]);


  const drawCanvas = () => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    svg.innerHTML = '';

    edges.forEach((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);
      if (!fromNode || !toNode) return;

      const fromX = fromNode.x + fromNode.width;
      const fromY = fromNode.y + fromNode.height / 2;
      const toX = toNode.x;
      const toY = toNode.y + toNode.height / 2;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const midX = (fromX + toX) / 2;
      const d = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
      path.setAttribute('d', d);
      path.setAttribute('stroke', 'hsl(187, 72%, 42%)');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      path.setAttribute('marker-end', 'url(#arrowhead)');
      svg.appendChild(path);
    });

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3, 0 6');
    polygon.setAttribute('fill', 'hsl(187, 72%, 42%)');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.insertBefore(defs, svg.firstChild);
  };

  const autoArrangeNodes = (nodesToArrange: CanvasNode[]) => {
    const startX = 100;
    const startY = 200;
    const horizontalSpacing = 200;
    const verticalSpacing = 150;
    const nodesPerRow = 4;

    return nodesToArrange.map((node, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;
      
      return {
        ...node,
        x: startX + (col * horizontalSpacing),
        y: startY + (row * verticalSpacing),
      };
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const taskData = e.dataTransfer.getData('task');
    let taskType = 'GENERIC';
    let taskName = 'Generic Task';

    if (taskData) {
      try {
        const parsedTask = JSON.parse(taskData);
        taskType = parsedTask.id;
        taskName = parsedTask.name;
        console.log('Parsed task data:', { taskType, taskName });
      } catch (err) {
        console.error('Failed to parse task data:', err);
      }
    }

    const newNode: CanvasNode = {
      id: `task_${Date.now()}`,
      type: taskType,
      name: taskName,
      x: 0,
      y: 0,
      width: 120,
      height: 60
    };

    const updatedNodes = [...nodes, newNode];
    const arrangedNodes = autoArrangeNodes(updatedNodes);
    setNodes(arrangedNodes);

    if (arrangedNodes.length > 1) {
      const lastNode = arrangedNodes[arrangedNodes.length - 2];
      const newEdge: CanvasEdge = {
        from: lastNode.id,
        to: newNode.id
      };
      setEdges([...edges, newEdge]);
    }

    // Auto-scroll to show the new task
    if (canvasRef.current) {
      const newNodeArranged = arrangedNodes[arrangedNodes.length - 1];
      const containerWidth = canvasRef.current.clientWidth;
      const containerHeight = canvasRef.current.clientHeight;
      
      canvasRef.current.scrollTo({
        left: newNodeArranged.x - containerWidth / 2 + newNodeArranged.width / 2,
        top: newNodeArranged.y - containerHeight / 2 + newNodeArranged.height / 2,
        behavior: 'smooth',
      });
    }

    // Open configuration modal immediately for the new task
    const newNodeArranged = arrangedNodes[arrangedNodes.length - 1];
    console.log('=== Opening modal for new node ===');
    console.log('New node:', newNodeArranged);
    console.log('New node type:', newNodeArranged.type);
    console.log('Sequence number:', arrangedNodes.length);
    
    // Use setTimeout to ensure state is updated before opening modal
    setTimeout(() => {
      console.log('=== Inside setTimeout - opening modal ===');
      console.log('Task type check:', newNodeArranged.type);
      
      if (newNodeArranged.type === 'LAMBDA') {
        console.log('Setting Lambda modal state');
        setConfiguringLambdaNode(newNodeArranged);
        setLambdaModalOpen(true);
      } else if (newNodeArranged.type === 'DECISION') {
        console.log('Setting Decision modal state');
        setConfiguringDecisionNode(newNodeArranged);
        setDecisionModalOpen(true);
      } else if (newNodeArranged.type === 'MAPPER') {
        console.log('Setting Mapper modal state');
        setConfiguringMapperNode(newNodeArranged);
        setMapperModalOpen(true);
      } else if (newNodeArranged.type === 'SCHEDULED_WAIT') {
        console.log('Setting Scheduled Wait modal state');
        setConfiguringScheduledWaitNode(newNodeArranged);
        setScheduledWaitModalOpen(true);
      } else if (newNodeArranged.type === 'SIGNAL_OR_SCHEDULED_WAIT') {
        console.log('Setting Signal or Scheduled Wait modal state');
        setConfiguringSignalOrScheduledWaitNode(newNodeArranged);
        setSignalOrScheduledWaitModalOpen(true);
      } else if (newNodeArranged.type === 'SIGNAL') {
        console.log('Setting Signal modal state');
        setConfiguringSignalNode(newNodeArranged);
        setSignalModalOpen(true);
      } else if (newNodeArranged.type === 'SIGNAL_WAIT') {
        console.log('Setting Signal Wait modal state');
        setConfiguringSignalWaitNode(newNodeArranged);
        setSignalWaitModalOpen(true);
      } else if (newNodeArranged.type === 'TERMINATE') {
        console.log('Setting Terminate modal state');
        setConfiguringTerminateNode(newNodeArranged);
        setTerminateModalOpen(true);
      } else if (newNodeArranged.type === 'PASS_THROUGH') {
        console.log('Setting Pass Through modal state');
        setConfiguringPassThroughNode(newNodeArranged);
        setPassThroughModalOpen(true);
      } else if (newNodeArranged.type === 'DO_WHILE') {
        console.log('Setting Do While modal state');
        setConfiguringDoWhileNode(newNodeArranged);
        setDoWhileModalOpen(true);
      } else if (newNodeArranged.type === 'FORK_AND_CONVERGE') { // New Fork and Converge task type
        console.log('Setting Fork and Converge modal state');
        setConfiguringForkAndConvergeNode(newNodeArranged);
        setForkAndConvergeModalOpen(true);
      } else if (['GENERIC', 'HTTP'].includes(newNodeArranged.type)) {
        console.log('Setting Generic/HTTP modal state');
        console.log('Setting configuringNode to:', newNodeArranged);
        console.log('Setting configModalOpen to: true');
        console.log('Modal state set - configModalOpen: true, configuringNode:', newNodeArranged);
        setConfiguringNode(newNodeArranged);
        setConfigModalOpen(true);
      } else {
        console.log('No specialized modal found - using fallback JSON modal for type:', newNodeArranged.type);
        setConfiguringFallbackNode(newNodeArranged);
        setFallbackModalOpen(true);
      }
    }, 100);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    // Check if click is on a button
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }

    if (e.shiftKey) {
      if (connectingFrom === null) {
        setConnectingFrom(nodeId);
      } else {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          console.log('No specialized modal found - using fallback JSON modal for type:', node.type);
          setConfiguringFallbackNode(node);
          setFallbackModalOpen(true);
        }
      }
    } else {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        setDraggedNode(nodeId);
        setDragOffset({
          x: e.clientX - node.x,
          y: e.clientY - node.y
        });
      }
      setSelectedNode(nodeId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      setNodes(nodes.map(node =>
        node.id === draggedNode ? { ...node, x, y } : node
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = nodes.filter(n => n.id !== nodeId);
    const updatedEdges = edges.filter(e => e.from !== nodeId && e.to !== nodeId);
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    setSelectedNode(null);
  };

  const handleConfigureNode = (nodeId: string, e?: React.MouseEvent) => {
    console.log('=== handleConfigureNode called ===');
    console.log('Node ID:', nodeId);
    
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    const node = nodes.find(n => n.id === nodeId);
    console.log('Found node:', node);
    
    if (node) {
      setSelectedNode(nodeId);
      
      // Reset all modal states first to ensure only one is open
      setConfigModalOpen(false);
      setConfiguringNode(null);
      setLambdaModalOpen(false);
      setConfiguringLambdaNode(null);
      setDecisionModalOpen(false);
      setConfiguringDecisionNode(null);
      setMapperModalOpen(false);
      setConfiguringMapperNode(null);
      setScheduledWaitModalOpen(false);
      setConfiguringScheduledWaitNode(null);
      setSignalOrScheduledWaitModalOpen(false);
      setConfiguringSignalOrScheduledWaitNode(null);
      setSignalModalOpen(false);
      setConfiguringSignalNode(null);
      setSignalWaitModalOpen(false);
      setConfiguringSignalWaitNode(null);
      setTerminateModalOpen(false);
      setConfiguringTerminateNode(null);
      setPassThroughModalOpen(false);
      setConfiguringPassThroughNode(null);
      setDoWhileModalOpen(false);
      setConfiguringDoWhileNode(null);
      setForkAndConvergeModalOpen(false);
      setConfiguringForkAndConvergeNode(null);
      setFallbackModalOpen(false);
      setConfiguringFallbackNode(null);

      // Then open the correct modal
      if (node.type === 'LAMBDA') {
        console.log('Opening Lambda modal');
        setConfiguringLambdaNode(node);
        setLambdaModalOpen(true);
      } else if (node.type === 'DECISION') {
        console.log('Opening Decision modal');
        setConfiguringDecisionNode(node);
        setDecisionModalOpen(true);
      } else if (node.type === 'MAPPER') {
        console.log('Opening Mapper modal');
        setConfiguringMapperNode(node);
        setMapperModalOpen(true);
      } else if (node.type === 'SCHEDULED_WAIT') {
        console.log('Opening Scheduled Wait modal');
        setConfiguringScheduledWaitNode(node);
        setScheduledWaitModalOpen(true);
      } else if (node.type === 'SIGNAL_OR_SCHEDULED_WAIT') {
        console.log('Opening Signal or Scheduled Wait modal');
        setConfiguringSignalOrScheduledWaitNode(node);
        setSignalOrScheduledWaitModalOpen(true);
      } else if (node.type === 'SIGNAL') {
        console.log('Opening Signal modal');
        setConfiguringSignalNode(node);
        setSignalModalOpen(true);
      } else if (node.type === 'SIGNAL_WAIT') {
        console.log('Opening Signal Wait modal');
        setConfiguringSignalWaitNode(node);
        setSignalWaitModalOpen(true);
      } else if (node.type === 'TERMINATE') {
        console.log('Opening Terminate modal');
        setConfiguringTerminateNode(node);
        setTerminateModalOpen(true);
      } else if (node.type === 'PASS_THROUGH') {
        console.log('Opening Pass Through modal');
        setConfiguringPassThroughNode(node);
        setPassThroughModalOpen(true);
      } else if (node.type === 'DO_WHILE') {
        console.log('Opening Do While modal');
        setConfiguringDoWhileNode(node);
        setDoWhileModalOpen(true);
      } else if (node.type === 'FORK_AND_CONVERGE') {
        console.log('Opening Fork and Converge modal');
        setConfiguringForkAndConvergeNode(node);
        setForkAndConvergeModalOpen(true);
      } else if (['GENERIC', 'HTTP'].includes(node.type)) {
        console.log('Opening Generic/HTTP modal for type:', node.type);
        setConfiguringNode(node);
        setConfigModalOpen(true);
      } else {
        console.log('No specialized modal found - using fallback JSON modal for type:', node.type);
        setConfiguringFallbackNode(node);
        setFallbackModalOpen(true);
      }
    } else {
      console.error('Node not found!');
    }
  };

  const handleSaveNodeConfig = (config: any) => {
    if (configuringNode) {
      const updatedNodes = nodes.map(node =>
        node.id === configuringNode.id
          ? { ...node, config }
          : node
      );
      setNodes(updatedNodes);
    }
  };

  const handleSaveLambdaNodeConfig = (config: any) => {
    if (configuringLambdaNode) {
      const updatedNodes = nodes.map(node =>
        node.id === configuringLambdaNode.id
          ? { ...node, config }
          : node
      );
      setNodes(updatedNodes);
    }
  };

  const handleSaveDecisionNodeConfig = (config: any) => {
    console.log('=== handleSaveDecisionNodeConfig ===');
    console.log('Configuring Decision Node:', configuringDecisionNode);
    console.log('Config to save:', config);
    
    if (configuringDecisionNode) {
      const updatedNodes = nodes.map(node => {
        if (node.id === configuringDecisionNode.id) {
          console.log('Updating node with config:', config);
          return { ...node, config };
        }
        return node;
      });
      
      console.log('Updated nodes:', updatedNodes);
      setNodes(updatedNodes);
    }
  };

  const handleSaveMapperNodeConfig = (config: any) => {
    console.log('=== handleSaveMapperNodeConfig ===');
    console.log('Configuring Mapper Node:', configuringMapperNode);
    console.log('Config to save:', config);
    
    if (configuringMapperNode) {
      const updatedNodes = nodes.map(node => {
        if (node.id === configuringMapperNode.id) {
          console.log('Updating node with config:', config);
          return { ...node, config };
        }
        return node;
      });
      
      console.log('Updated nodes:', updatedNodes);
      setNodes(updatedNodes);
    }
  };

  const handleSaveScheduledWaitNodeConfig = (config: any) => {
    console.log('=== handleSaveScheduledWaitNodeConfig ===');
    console.log('Configuring Scheduled Wait Node:', configuringScheduledWaitNode);
    console.log('Config to save:', config);
    
    if (configuringScheduledWaitNode) {
      const updatedNodes = nodes.map(node => {
        if (node.id === configuringScheduledWaitNode.id) {
          console.log('Updating node with config:', config);
          return { ...node, config };
        }
        return node;
      });
      
      console.log('Updated nodes:', updatedNodes);
      setNodes(updatedNodes);
    }
  };

  const handleSaveSignalOrScheduledWaitNodeConfig = (config: any) => {
    console.log('=== handleSaveSignalOrScheduledWaitNodeConfig ===');
    console.log('Configuring Signal or Scheduled Wait Node:', configuringSignalOrScheduledWaitNode);
    console.log('Config to save:', config);
    
    if (configuringSignalOrScheduledWaitNode) {
      const updatedNodes = nodes.map(node => {
        if (node.id === configuringSignalOrScheduledWaitNode.id) {
          console.log('Updating node with config:', config);
          return { ...node, config };
        }
        return node;
      });
      
      console.log('Updated nodes:', updatedNodes);
      setNodes(updatedNodes);
    }
  };

  const handleSaveSignalNodeConfig = (config: any) => {
    console.log('=== handleSaveSignalNodeConfig ===');
    console.log('Configuring Signal Node:', configuringSignalNode);
    console.log('Config to save:', config);
    
    if (configuringSignalNode) {
      const updatedNodes = nodes.map(node => {
        if (node.id === configuringSignalNode.id) {
          console.log('Updating node with config:', config);
          return { ...node, config };
        }
        return node;
      });
      
      console.log('Updated nodes:', updatedNodes);
      setNodes(updatedNodes);
    }
  };

  const handleSaveSignalWaitNodeConfig = (config: any) => {
    console.log('=== handleSaveSignalWaitNodeConfig called ===');
    console.log('Configuring Signal Wait Node:', configuringSignalWaitNode);
    console.log('Config to save:', config);
    
    if (configuringSignalWaitNode) {
      const updatedNodes = nodes.map(node => {
        if (node.id === configuringSignalWaitNode.id) {
          console.log('Updating node with config:', config);
          return { ...node, config };
        }
        return node;
      });
      
      console.log('Updated nodes:', updatedNodes);
      setNodes(updatedNodes);
    }
  };

  const handleSaveTerminateNodeConfig = (config: any) => {
    console.log('=== handleSaveTerminateNodeConfig called ===');
    console.log('Configuring Terminate Node:', configuringTerminateNode);
    console.log('Config to save:', config);
    
    if (configuringTerminateNode) {
      const updatedNodes = nodes.map(node => {
        if (node.id === configuringTerminateNode.id) {
          console.log('Updating node with config:', config);
          return { ...node, config };
        }
        return node;
      });
      
      console.log('Updated nodes:', updatedNodes);
      setNodes(updatedNodes);
    }
  };

  const handleSavePassThroughNodeConfig = (config: any) => {
    console.log('=== handleSavePassThroughNodeConfig called ===');
    console.log('Configuring Pass Through Node:', configuringPassThroughNode);
    console.log('Config to save:', config);
    
    if (configuringPassThroughNode) {
      const updatedNodes = nodes.map(node => {
        if (node.id === configuringPassThroughNode.id) {
          console.log('Updating node with config:', config);
          return { ...node, config };
        }
        return node;
      });
      
      console.log('Updated nodes:', updatedNodes);
      setNodes(updatedNodes);
    }
  };

  const handleSaveDoWhileNodeConfig = (config: any) => {
    console.log('=== handleSaveDoWhileNodeConfig called ===');
    console.log('Configuring Do While Node:', configuringDoWhileNode);
    console.log('Config to save:', config);
    
    if (configuringDoWhileNode) {
      const updatedNodes = nodes.map(node => {
        if (node.id === configuringDoWhileNode.id) {
          console.log('Updating node with config:', config);
          return { ...node, config };
        }
        return node;
      });
      
      console.log('Updated nodes:', updatedNodes);
      setNodes(updatedNodes);
    }
  };

  const handleAutoArrange = () => {
    if (nodes.length === 0) return;

    const arrangedNodes = autoArrangeNodes(nodes);
    setNodes(arrangedNodes);

    // Scroll to center
    if (canvasRef.current) {
      canvasRef.current.scrollTo({
        left: 0,
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  const handleCenterView = () => {
    if (nodes.length === 0 || !canvasRef.current) return;

    // Calculate bounding box of all nodes
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x + n.width));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y + n.height));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const containerWidth = canvasRef.current.clientWidth;
    const containerHeight = canvasRef.current.clientHeight;

    canvasRef.current.scrollTo({
      left: centerX - containerWidth / 2,
      top: centerY - containerHeight / 2,
      behavior: 'smooth',
    });
  };

  console.log('=== WorkflowCanvas RENDER ===');
  console.log('Rendering with configModalOpen:', configModalOpen);
  console.log('Rendering with configuringNode:', configuringNode);

  return (
    <>
    <div
      ref={canvasRef}
      className="relative h-full w-full bg-background rounded-lg border border-border overflow-auto"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        minHeight: '100%',
        minWidth: '100%',
      }}
    >
      <div className="relative" style={{ minHeight: '1000px', minWidth: '1500px' }}>
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-muted-foreground">Empty Canvas</p>
            <p className="text-sm text-muted-foreground">Drag tasks from the library to start building your workflow</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4">
        <div className="bg-card border border-border rounded-lg p-3 text-xs text-muted-foreground space-y-1">
          <p><strong>Tip:</strong> Drag tasks from library (auto-connects)</p>
          <p><strong>Shift+Click:</strong> Manually connect tasks</p>
          <p><strong>Click:</strong> Select & move tasks</p>
          <p><strong>Delete:</strong> Select task and click trash icon</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoArrange}
            disabled={nodes.length === 0}
            className="bg-card text-foreground border-border hover:bg-accent"
            aria-label="Auto arrange tasks"
            title="Auto arrange tasks"
          >
            <AlignCenterIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Auto Arrange
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCenterView}
            disabled={nodes.length === 0}
            className="bg-card text-foreground border-border hover:bg-accent"
            aria-label="Center view"
            title="Center view"
          >
            <MaximizeIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Center View
          </Button>
        </div>
      </div>

        {nodes.map((node, index) => (
          <div
            key={node.id}
            role="button"
            tabIndex={0}
            aria-label={`Task: ${node.name}`}
            className={cn(
              'absolute flex flex-col items-center justify-center rounded-lg border-2 cursor-move transition-all',
              selectedNode === node.id
                ? 'border-primary shadow-lg shadow-primary/20'
                : 'border-border',
              connectingFrom === node.id && 'border-tertiary shadow-lg shadow-tertiary/20',
              'bg-card'
            )}
            style={{
              left: node.x,
              top: node.y,
              width: node.width,
              height: node.height,
              zIndex: selectedNode === node.id ? 10 : 1
            }}
            onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedNode(node.id);
              }
            }}
          >
            <div className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md border-2 border-background">
              {index + 1}
            </div>
            <p className="text-sm font-medium text-foreground text-center px-2 truncate max-w-full">{node.name}</p>
            <p className="text-xs text-muted-foreground">{node.type === 'SIMPLE' ? 'GENERIC' : node.type}</p>

            {selectedNode === node.id && (
              <>
                <div className="absolute -top-8 right-0 flex gap-1 z-10">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-6 w-6 bg-card border-border hover:bg-accent"
                    aria-label="Configure task"
                    title="Configure task"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfigureNode(node.id, e);
                    }}
                  >
                    <SettingsIcon className="h-3 w-3" strokeWidth={1.5} />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-6 w-6"
                    aria-label="Delete task"
                    title="Delete task"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                  >
                    <Trash2Icon className="h-3 w-3" strokeWidth={1.5} />
                  </Button>
                </div>
                <div 
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 bg-primary rounded-full cursor-ew-resize"
                  style={{ width: 'calc(100% - 8px)' }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    // Horizontal resize handle - can be implemented if needed
                  }}
                />
              </>
            )}
            {node.config && (
              <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-success border-2 border-background">
                <SettingsIcon className="h-2 w-2 text-success-foreground" strokeWidth={2} />
              </div>
            )}
          </div>
        ))}
      </div>

    </div>

    {console.log('=== Rendering Modal Components ===')}
    {console.log('About to render TaskConfigurationModal with open:', configModalOpen && configuringNode !== null)}
    
    <TaskConfigurationModal
      open={configModalOpen && configuringNode !== null}
      onClose={() => {
        console.log('Closing task configuration modal');
        setConfigModalOpen(false);
        setConfiguringNode(null);
      }}
      onSave={handleSaveNodeConfig}
      taskType={configuringNode?.type || 'GENERIC'}
      taskName={configuringNode?.name || 'Generic Task'}
      initialConfig={configuringNode?.config}
      sequenceNo={configuringNode ? nodes.findIndex(n => n.id === configuringNode.id) + 1 : 1}
    />

    {console.log('About to render LambdaTaskConfigModal with open:', lambdaModalOpen && configuringLambdaNode !== null)}
    
    <LambdaTaskConfigModal
      open={lambdaModalOpen && configuringLambdaNode !== null}
      onClose={() => {
        console.log('Closing Lambda task configuration modal');
        setLambdaModalOpen(false);
        setConfiguringLambdaNode(null);
      }}
      onSave={handleSaveLambdaNodeConfig}
      taskName={configuringLambdaNode?.name || 'Lambda Task'}
      initialConfig={configuringLambdaNode?.config}
      sequenceNo={configuringLambdaNode ? nodes.findIndex(n => n.id === configuringLambdaNode.id) + 1 : 1}
    />

    {console.log('About to render DecisionTaskConfigModal with open:', decisionModalOpen && configuringDecisionNode !== null)}
    
    <DecisionTaskConfigModal
      open={decisionModalOpen && configuringDecisionNode !== null}
      onClose={() => {
        console.log('Closing Decision task configuration modal');
        setDecisionModalOpen(false);
        setConfiguringDecisionNode(null);
      }}
      onSave={handleSaveDecisionNodeConfig}
      taskName={configuringDecisionNode?.name || 'Decision Task'}
      initialConfig={configuringDecisionNode?.config}
      sequenceNo={configuringDecisionNode ? nodes.findIndex(n => n.id === configuringDecisionNode.id) + 1 : 1}
    />

    {console.log('About to render MapperTaskConfigModal with open:', mapperModalOpen && configuringMapperNode !== null)}
    
    <MapperTaskConfigModal
      open={mapperModalOpen && configuringMapperNode !== null}
      onClose={() => {
        console.log('Closing Mapper task configuration modal');
        setMapperModalOpen(false);
        setConfiguringMapperNode(null);
      }}
      onSave={handleSaveMapperNodeConfig}
      taskName={configuringMapperNode?.name || 'Mapper Task'}
      initialConfig={configuringMapperNode?.config}
      sequenceNo={configuringMapperNode ? nodes.findIndex(n => n.id === configuringMapperNode.id) + 1 : 1}
    />

    {console.log('About to render ScheduledWaitTaskConfigModal with open:', scheduledWaitModalOpen && configuringScheduledWaitNode !== null)}
    
    <ScheduledWaitTaskConfigModal
      open={scheduledWaitModalOpen && configuringScheduledWaitNode !== null}
      onClose={() => {
        console.log('Closing Scheduled Wait task configuration modal');
        setScheduledWaitModalOpen(false);
        setConfiguringScheduledWaitNode(null);
      }}
      onSave={handleSaveScheduledWaitNodeConfig}
      taskName={configuringScheduledWaitNode?.name || 'Scheduled Wait Task'}
      initialConfig={configuringScheduledWaitNode?.config}
      sequenceNo={configuringScheduledWaitNode ? nodes.findIndex(n => n.id === configuringScheduledWaitNode.id) + 1 : 1}
    />

    {console.log('About to render SignalOrScheduledWaitTaskConfigModal with open:', signalOrScheduledWaitModalOpen && configuringSignalOrScheduledWaitNode !== null)}
    
      <SignalOrScheduledWaitTaskConfigModal
        open={signalOrScheduledWaitModalOpen && configuringSignalOrScheduledWaitNode !== null}
        onClose={() => {
          console.log('Closing Signal or Scheduled Wait task configuration modal');
          setSignalOrScheduledWaitModalOpen(false);
          setConfiguringSignalOrScheduledWaitNode(null);
        }}
        onSave={handleSaveSignalOrScheduledWaitNodeConfig}
        taskName={configuringSignalOrScheduledWaitNode?.name || 'Signal or Scheduled Wait Task'}
        initialConfig={configuringSignalOrScheduledWaitNode?.config}
        sequenceNo={configuringSignalOrScheduledWaitNode ? nodes.findIndex(n => n.id === configuringSignalOrScheduledWaitNode.id) + 1 : 1}
      />

      {console.log('About to render SignalTaskConfigModal with open:', signalModalOpen && configuringSignalNode !== null)}
      
      <SignalTaskConfigModal
        open={signalModalOpen && configuringSignalNode !== null}
        onClose={() => {
          console.log('Closing Signal task configuration modal');
          setSignalModalOpen(false);
          setConfiguringSignalNode(null);
        }}
        onSave={handleSaveSignalNodeConfig}
        taskName={configuringSignalNode?.name || 'Signal Task'}
        initialConfig={configuringSignalNode?.config}
        sequenceNo={configuringSignalNode ? nodes.findIndex(n => n.id === configuringSignalNode.id) + 1 : 1}
      />

      {console.log('About to render SignalWaitTaskConfigModal with open:', signalWaitModalOpen && configuringSignalWaitNode !== null)}
      
      <SignalWaitTaskConfigModal
        open={signalWaitModalOpen && configuringSignalWaitNode !== null}
        onClose={() => {
          console.log('Closing Signal Wait task configuration modal');
          setSignalWaitModalOpen(false);
          setConfiguringSignalWaitNode(null);
        }}
        onSave={handleSaveSignalWaitNodeConfig}
        taskName={configuringSignalWaitNode?.name || 'Signal Wait Task'}
        initialConfig={configuringSignalWaitNode?.config}
        sequenceNo={configuringSignalWaitNode ? nodes.findIndex(n => n.id === configuringSignalWaitNode.id) + 1 : 1}
      />

      {/* Terminate Modal */}
      <TerminateTaskConfigModal
        open={terminateModalOpen && configuringTerminateNode !== null}
        onClose={() => {
          setTerminateModalOpen(false);
          setConfiguringTerminateNode(null);
        }}
        onSave={handleSaveTerminateNodeConfig}
        taskName={configuringTerminateNode?.name || 'Terminate Task'}
        initialConfig={configuringTerminateNode?.config}
        sequenceNo={configuringTerminateNode ? nodes.findIndex(n => n.id === configuringTerminateNode.id) + 1 : 1}
      />

      {/* Pass Through Modal */}
      <PassThroughTaskConfigModal
        open={passThroughModalOpen && configuringPassThroughNode !== null}
        onClose={() => {
          setPassThroughModalOpen(false);
          setConfiguringPassThroughNode(null);
        }}
        onSave={handleSavePassThroughNodeConfig}
        taskName={configuringPassThroughNode?.name || 'Pass Through Task'}
        initialConfig={configuringPassThroughNode?.config}
        sequenceNo={configuringPassThroughNode ? nodes.findIndex(n => n.id === configuringPassThroughNode.id) + 1 : 1}
      />

      {/* Do While Modal */}
      <DoWhileTaskConfigModal
        open={doWhileModalOpen && configuringDoWhileNode !== null}
        onClose={() => {
          setDoWhileModalOpen(false);
          setConfiguringDoWhileNode(null);
        }}
        onSave={handleSaveDoWhileNodeConfig}
        taskName={configuringDoWhileNode?.name || 'Do While Task'}
        initialConfig={configuringDoWhileNode?.config}
        sequenceNo={configuringDoWhileNode ? nodes.findIndex(n => n.id === configuringDoWhileNode.id) + 1 : 1}
      />

      {/* Fork and Converge Modal */}
      <ForkAndConvergeTaskConfigModal
        open={forkAndConvergeModalOpen && configuringForkAndConvergeNode !== null}
        onClose={() => {
          setForkAndConvergeModalOpen(false);
          setConfiguringForkAndConvergeNode(null);
        }}
        onSave={(config: any) => {
          if (configuringForkAndConvergeNode) {
            const updatedNodes = nodes.map(node =>
              node.id === configuringForkAndConvergeNode.id
                ? { ...node, config }
                : node
            );
            setNodes(updatedNodes);
          }
        }}
        taskName={configuringForkAndConvergeNode?.name || 'Fork and Converge Task'}
        initialConfig={configuringForkAndConvergeNode?.config}
        sequenceNo={configuringForkAndConvergeNode ? nodes.findIndex(n => n.id === configuringForkAndConvergeNode.id) + 1 : 1}
      />

      {/* Fallback JSON Modal */}
      <FallbackJsonTaskModal
        open={fallbackModalOpen && configuringFallbackNode !== null}
        onClose={() => {
          setFallbackModalOpen(false);
          setConfiguringFallbackNode(null);
        }}
        onSave={(config: any) => {
          if (configuringFallbackNode) {
            const updatedNodes = nodes.map(node =>
              node.id === configuringFallbackNode.id
                ? { ...node, config }
                : node
            );
            setNodes(updatedNodes);
          }
        }}
        taskType={configuringFallbackNode?.type || 'GENERIC'}
        taskName={configuringFallbackNode?.name || 'Generic Task'}
        initialConfig={configuringFallbackNode?.config}
        sequenceNo={configuringFallbackNode ? nodes.findIndex(n => n.id === configuringFallbackNode.id) + 1 : 1}
      />
    </>
  );
}
