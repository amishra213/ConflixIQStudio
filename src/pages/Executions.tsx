import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActivityIcon, CheckCircle2Icon, XCircleIcon, EyeIcon, ArrowLeftIcon, RefreshCwIcon } from 'lucide-react';
import { ExecutionSummary } from '@/services/executionService';
import { useToast } from '@/components/ui/use-toast';
import { useExecutionService } from '@/hooks/useExecutionService';

export function Executions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchExecutionSummaries } = useExecutionService();
  const [executions, setExecutions] = useState<ExecutionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50);
  const [totalHits, setTotalHits] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);

  const _loadExecutions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchExecutionSummaries(undefined, undefined, currentPage * pageSize, pageSize);
      
      // API returns { totalHits: number, results: ExecutionSummary[] }
      const executionList = response.results || [];
      const totalCount = response.totalHits || 0;
      
      console.log('[Executions] API Response:', { totalHits: response.totalHits, resultsCount: executionList.length, executions: executionList });
      
      setExecutions(executionList);
      setTotalHits(totalCount);
      setHasLoaded(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load executions';
      setError(errorMessage);
      console.error('[Executions] Error loading executions:', errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload when page changes (only if data has been loaded at least once)
  useEffect(() => {
    if (hasLoaded) {
      const reload = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const response = await fetchExecutionSummaries(undefined, undefined, currentPage * pageSize, pageSize);
          
          const executionList = response.results || [];
          const totalCount = response.totalHits || 0;
          
          setExecutions(executionList);
          setTotalHits(totalCount);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load executions';
          setError(errorMessage);
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      };
      reload();
    }
  }, [currentPage, pageSize, hasLoaded, fetchExecutionSummaries, toast]);

  const getStatusIcon = (status: string) => {
    // Map API status to icon
    const apiStatus = status.toUpperCase();
    if (apiStatus === 'COMPLETED') {
      return <CheckCircle2Icon className="w-5 h-5 text-success" />;
    } else if (['FAILED', 'TIMED_OUT', 'TERMINATED'].includes(apiStatus)) {
      return <XCircleIcon className="w-5 h-5 text-destructive" />;
    } else if (['RUNNING', 'PAUSED'].includes(apiStatus)) {
      return <ActivityIcon className="w-5 h-5 text-primary animate-pulse" />;
    }
    return null;
  };

  const getStatusBadge = (status: string) => {
    const apiStatus = status.toUpperCase();
    if (apiStatus === 'COMPLETED') {
      return <Badge className="bg-success text-white">Completed</Badge>;
    } else if (['FAILED', 'TIMED_OUT', 'TERMINATED'].includes(apiStatus)) {
      return <Badge className="bg-destructive text-white">Failed</Badge>;
    } else if (['RUNNING', 'PAUSED'].includes(apiStatus)) {
      return <Badge className="bg-primary text-primary-foreground">Running</Badge>;
    }
    return null;
  };

  const getDurationDisplay = (status: string, duration: string | null) => {
    const isRunning = status.toUpperCase() === 'RUNNING';
    if (isRunning) {
      return <span className="text-primary animate-pulse">Running...</span>;
    }
    if (duration) {
      return `${duration}s`;
    }
    return '-';
  };

  if (error && !isLoading) {
    return (
      <div className="p-8">
        <Card className="p-12 bg-card border-border text-center">
          <p className="text-destructive text-lg font-medium">Error loading executions</p>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button
            onClick={() => globalThis.location.reload()}
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary"
            title="Back to dashboard"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Executions</h1>
            <p className="text-base text-muted-foreground">Monitor workflow execution history</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Total Executions: <span className="text-foreground font-semibold">{totalHits}</span>
          </div>
          <Button
            onClick={() => _loadExecutions()}
            disabled={isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium flex items-center gap-2"
            title="Refresh executions list"
          >
            <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border overflow-hidden shadow-sm">
        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <ActivityIcon className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading executions...</p>
            </div>
          </div>
        )}
        {!isLoading && !hasLoaded && (
          <div className="flex items-center justify-center p-12">
            <div className="text-center space-y-6">
              <div>
                <p className="text-muted-foreground text-lg font-medium">No data loaded</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click the refresh button above to load executions
                </p>
              </div>
              <Button
                onClick={() => _loadExecutions()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium inline-flex items-center gap-2"
              >
                <RefreshCwIcon className="w-4 h-4" />
                Load Executions
              </Button>
            </div>
          </div>
        )}
        {!isLoading && hasLoaded && executions.length === 0 && (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <p className="text-muted-foreground text-lg">No executions found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start a workflow to see executions here
              </p>
            </div>
          </div>
        )}
        {!isLoading && executions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Workflow Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Execution ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Correlation ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Start Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {executions.map((execution) => {
                  const duration =
                    execution.endTime && execution.startTime
                      ? ((execution.endTime - execution.startTime) / 1000).toFixed(2)
                      : null;

                  return (
                    <tr
                      key={execution.workflowId}
                      className="hover:bg-secondary/30 transition-colors duration-150 ease-in"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(execution.status)}
                          {getStatusBadge(execution.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {execution.workflowType}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                        {execution.workflowId}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                        {execution.correlationId || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {new Date(execution.startTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {getDurationDisplay(execution.status, duration)}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/executions/${execution.workflowId}`)}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                        >
                          <EyeIcon className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!isLoading && executions.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalHits)} of{' '}
            {totalHits} executions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={(currentPage + 1) * pageSize >= totalHits}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
