import { useEffect, useRef, useState } from 'react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { Trash2Icon, SettingsIcon, AlignCenterIcon, MaximizeIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

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
    
    // Modal configuration is now handled by dedicated modal components
    // imported in parent container from components/modals folder
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
          // Auto-connect nodes when shift-clicking
          const newEdge: CanvasEdge = {
            from: connectingFrom,
            to: nodeId
          };
          setEdges([...edges, newEdge]);
          setConnectingFrom(null);
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
      // Modal configuration is now handled by dedicated modal components
      // imported in parent container from components/modals folder
    } else {
      console.error('Node not found!');
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

  return (
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
  );
}
