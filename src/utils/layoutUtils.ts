/**
 * Layout utilities for auto-arranging workflow nodes
 * Provides hierarchical and grid-based layout algorithms
 */

export interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  data?: {
    inputs?: Array<{ id: string }>;
    outputs?: Array<{ id: string }>;
  };
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
}

// Constants for fixed node sizing
export const NODE_CONFIG = {
  WIDTH: 200,
  HEIGHT: 80,
  HORIZONTAL_SPACING: 80, // Space between nodes horizontally
  VERTICAL_SPACING: 120, // Space between nodes vertically
  GRID_COLUMNS: 4, // Number of columns in grid layout
};

/**
 * Assign levels to nodes using BFS based on their dependencies
 */
function assignNodeLevels(
  incoming: Map<string, string[]>,
  outgoing: Map<string, string[]>,
  nodeIds: string[]
): Map<string, number> {
  const levels = new Map<string, number>();
  const queue: string[] = [];

  // Find root nodes (nodes with no incoming edges)
  const rootNodes = nodeIds.filter((id) => (incoming.get(id)?.length ?? 0) === 0);

  // Determine starting nodes
  let startNodes: string[] = [];
  if (rootNodes.length > 0) {
    startNodes = rootNodes;
  } else if (nodeIds.length > 0) {
    startNodes = [nodeIds[0]];
  }

  // Initialize root nodes
  for (const nodeId of startNodes) {
    levels.set(nodeId, 0);
    queue.push(nodeId);
  }

  // BFS to assign levels
  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId) break;

    const currentLevel = levels.get(nodeId) ?? 0;
    const nextNodes = outgoing.get(nodeId) ?? [];

    for (const nextId of nextNodes) {
      const existingLevel = levels.get(nextId);
      if (existingLevel === undefined) {
        levels.set(nextId, currentLevel + 1);
        queue.push(nextId);
      } else if (existingLevel <= currentLevel) {
        levels.set(nextId, currentLevel + 1);
      }
    }
  }

  return levels;
}

/**
 * Group nodes by their assigned levels
 */
function groupNodesByLevel(levels: Map<string, number>): Map<number, string[]> {
  const levelMap = new Map<number, string[]>();
  for (const [nodeId, level] of levels) {
    if (!levelMap.has(level)) {
      levelMap.set(level, []);
    }
    levelMap.get(level)!.push(nodeId);
  }
  return levelMap;
}

/**
 * Position nodes based on their levels
 */
function positionNodesByLevel(
  levelMap: Map<number, string[]>
): Map<string, { x: number; y: number }> {
  const nodePositions = new Map<string, { x: number; y: number }>();

  for (const [level, nodeIds] of levelMap) {
    const y = level * (NODE_CONFIG.HEIGHT + NODE_CONFIG.VERTICAL_SPACING) + 50;
    const levelWidth = nodeIds.length * (NODE_CONFIG.WIDTH + NODE_CONFIG.HORIZONTAL_SPACING);
    const startX = Math.max(50, (1920 - levelWidth) / 2);

    for (let index = 0; index < nodeIds.length; index += 1) {
      const nodeId = nodeIds[index];
      const x = startX + index * (NODE_CONFIG.WIDTH + NODE_CONFIG.HORIZONTAL_SPACING);
      nodePositions.set(nodeId, { x, y });
    }
  }

  return nodePositions;
}

/**
 * Arrange nodes in a hierarchical layout based on their connections
 * Builds a dependency graph and arranges nodes level by level
 */
export function arrangeNodesHierarchical(nodes: LayoutNode[], edges: LayoutEdge[]): LayoutNode[] {
  if (nodes.length === 0) return nodes;

  // Build adjacency maps
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  const nodeIds = nodes.map((n) => n.id);

  for (const node of nodes) {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  }

  for (const edge of edges) {
    outgoing.get(edge.source)?.push(edge.target);
    incoming.get(edge.target)?.push(edge.source);
  }

  // Assign levels using BFS
  const levels = assignNodeLevels(incoming, outgoing, nodeIds);

  // Group nodes by level
  const levelMap = groupNodesByLevel(levels);

  // Position nodes level by level
  const nodePositions = positionNodesByLevel(levelMap);

  // Create positioned nodes
  const positionedNodes: LayoutNode[] = [];
  for (const node of nodes) {
    const position = nodePositions.get(node.id) ?? { x: 0, y: 0 };
    positionedNodes.push({
      ...node,
      position,
      width: NODE_CONFIG.WIDTH,
      height: NODE_CONFIG.HEIGHT,
    });
  }

  return positionedNodes;
}

/**
 * Arrange nodes in a simple grid layout
 * Useful for workflows without clear dependency structure
 */
export function arrangeNodesGrid(nodes: LayoutNode[]): LayoutNode[] {
  if (nodes.length === 0) return nodes;

  const positionedNodes: LayoutNode[] = [];
  const cols = NODE_CONFIG.GRID_COLUMNS;
  const colWidth = NODE_CONFIG.WIDTH + NODE_CONFIG.HORIZONTAL_SPACING;
  const rowHeight = NODE_CONFIG.HEIGHT + NODE_CONFIG.VERTICAL_SPACING;

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = 50 + col * colWidth;
    const y = 50 + row * rowHeight;

    positionedNodes.push({
      ...node,
      position: { x, y },
      width: NODE_CONFIG.WIDTH,
      height: NODE_CONFIG.HEIGHT,
    });
  }

  return positionedNodes;
}

/**
 * Arrange nodes based on their type and connections
 * Attempts to create a more natural layout for complex workflows
 */
export function arrangeNodesAuto(nodes: LayoutNode[], edges: LayoutEdge[]): LayoutNode[] {
  // If workflow is simple (few nodes), use grid layout
  if (nodes.length <= 6) {
    return arrangeNodesGrid(nodes);
  }

  // For complex workflows, use hierarchical layout
  return arrangeNodesHierarchical(nodes, edges);
}

/**
 * Check if a node position is within valid canvas bounds
 */
export function isValidPosition(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x <= 10000 && y <= 10000;
}

/**
 * Center the diagram in the viewport by adjusting all node positions
 */
export function centerDiagram(nodes: LayoutNode[]): LayoutNode[] {
  if (nodes.length === 0) return nodes;

  // Find bounds
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const x = node.position.x;
    const y = node.position.y;
    const width = node.width ?? NODE_CONFIG.WIDTH;
    const height = node.height ?? NODE_CONFIG.HEIGHT;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  // Calculate offset to center (assuming 1920x1080 viewport)
  const viewportWidth = 1920;
  const viewportHeight = 1080;
  const diagramWidth = maxX - minX;
  const diagramHeight = maxY - minY;

  const offsetX = (viewportWidth - diagramWidth) / 2 - minX;
  const offsetY = (viewportHeight - diagramHeight) / 2 - minY;

  // Apply offset
  return nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x + offsetX,
      y: node.position.y + offsetY,
    },
  }));
}

/**
 * Calculate minimum bounding box for nodes
 */
export function getBoundingBox(
  nodes: LayoutNode[]
): { x: number; y: number; width: number; height: number } | null {
  if (nodes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const width = node.width ?? NODE_CONFIG.WIDTH;
    const height = node.height ?? NODE_CONFIG.HEIGHT;

    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
