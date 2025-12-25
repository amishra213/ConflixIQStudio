import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDashboardStore } from '@/stores/dashboardStore';

export default function TaskQueuePanel() {
  const { taskQueues } = useDashboardStore();

  return (
    <Card className="h-full border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="font-heading text-xl text-foreground">Task Queues</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {taskQueues.map((queue) => (
          <div key={queue.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-foreground">{queue.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {queue.pending} pending · {queue.processing} processing
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{queue.capacity}</p>
                <p className="text-xs text-muted-foreground">capacity</p>
              </div>
            </div>
            <Progress value={(queue.processing / queue.capacity) * 100} className="h-2 bg-muted" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Processing rate</span>
              <span className="font-medium text-primary">{queue.rate}/min</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
