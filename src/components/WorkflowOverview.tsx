import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityIcon, CheckCircle2Icon, XCircleIcon, ClockIcon } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboardStore';

export default function WorkflowOverview() {
  const { workflowStats } = useDashboardStore();

  const stats = [
    {
      label: 'Total Workflows',
      value: workflowStats.total,
      icon: ActivityIcon,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Running',
      value: workflowStats.running,
      icon: ClockIcon,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Completed',
      value: workflowStats.completed,
      icon: CheckCircle2Icon,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Failed',
      value: workflowStats.failed,
      icon: XCircleIcon,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <Card className="h-full border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="font-heading text-xl text-foreground">Workflow Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}
                >
                  <Icon className={`h-5 w-5 ${stat.color}`} strokeWidth={1.5} />
                </div>
                <span className="text-sm font-normal text-foreground">{stat.label}</span>
              </div>
              <span className="font-heading text-2xl font-bold text-foreground">{stat.value}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
