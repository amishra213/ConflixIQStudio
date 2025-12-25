import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStore } from '../stores/dashboardStore';

export default function WorkflowGraph() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { workflowNodes } = useDashboardStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.innerHTML = '';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '400');
    svg.setAttribute('viewBox', '0 0 800 400');
    svg.style.background = 'transparent';

    const nodes = [
      { id: 1, x: 100, y: 200, label: 'Start', status: 'completed' },
      { id: 2, x: 250, y: 150, label: 'Process A', status: 'running' },
      { id: 3, x: 250, y: 250, label: 'Process B', status: 'completed' },
      { id: 4, x: 400, y: 200, label: 'Validate', status: 'pending' },
      { id: 5, x: 550, y: 200, label: 'Deploy', status: 'pending' },
      { id: 6, x: 700, y: 200, label: 'End', status: 'pending' },
    ];

    const edges = [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 6 },
    ];

    for (const edge of edges) {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);
      if (!fromNode || !toNode) continue;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', fromNode.x.toString());
      line.setAttribute('y1', fromNode.y.toString());
      line.setAttribute('x2', toNode.x.toString());
      line.setAttribute('y2', toNode.y.toString());
      line.setAttribute('stroke', 'hsl(220, 9%, 38%)');
      line.setAttribute('stroke-width', '2');
      svg.appendChild(line);
    }

    for (const node of nodes) {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x.toString());
      circle.setAttribute('cy', node.y.toString());
      circle.setAttribute('r', '30');

      const fillColor = 'hsl(220, 13%, 20%)';
      let strokeColor = 'hsl(187, 72%, 42%)';

      if (node.status === 'completed') {
        strokeColor = 'hsl(152, 58%, 42%)';
      } else if (node.status === 'running') {
        strokeColor = 'hsl(38, 90%, 55%)';
      } else if (node.status === 'failed') {
        strokeColor = 'hsl(313, 75%, 55%)';
      }

      circle.setAttribute('fill', fillColor);
      circle.setAttribute('stroke', strokeColor);
      circle.setAttribute('stroke-width', '2');
      group.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x.toString());
      text.setAttribute('y', (node.y + 50).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'hsl(220, 10%, 96%)');
      text.setAttribute('font-size', '12');
      text.textContent = node.label;
      group.appendChild(text);

      svg.appendChild(group);
    }

    canvas.appendChild(svg);
  }, [workflowNodes]);

  return (
    <Card className="h-full border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="font-heading text-xl text-foreground">
          Workflow Visualization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={canvasRef} className="w-full overflow-x-auto" />
      </CardContent>
    </Card>
  );
}
