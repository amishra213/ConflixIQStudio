import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { cn } from '@/lib/utils';

type ErrorItem = {
  id: string;
  message: string;
  workflow: string;
  severity: string;
  details: string;
  timestamp: string | number | Date;
};

export default function ErrorMonitor() {
  const { recentErrors } = useDashboardStore();
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-warning text-warning-foreground';
      case 'medium':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="h-full border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="font-heading text-xl text-foreground">Error Monitor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentErrors.map((error: ErrorItem) => (
          <div
            key={error.id}
            className="space-y-2 rounded-lg border border-border bg-background p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <AlertCircleIcon
                  className="h-5 w-5 flex-shrink-0 text-destructive"
                  strokeWidth={1.5}
                />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">{error.message}</p>
                  <p className="text-xs text-muted-foreground">{error.workflow}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn('text-xs', getSeverityColor(error.severity))}>
                  {error.severity}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandedError(expandedError === error.id ? null : error.id)}
                  className="h-6 w-6 bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"
                  aria-label={expandedError === error.id ? 'Collapse details' : 'Expand details'}
                >
                  {expandedError === error.id ? (
                    <ChevronUpIcon className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </Button>
              </div>
            </div>
            {expandedError === error.id && (
              <div className="mt-3 rounded bg-muted p-3">
                <p className="font-mono text-xs text-muted-foreground">{error.details}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Occurred at: {new Date(error.timestamp).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
