import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWorkflowStore } from '@/stores/workflowStore';
import { ArrowLeftIcon, RefreshCwIcon, AlertCircleIcon } from 'lucide-react';
import { WorkflowDiagramViewer } from '@/components/workflow/WorkflowDiagramViewer';
import { useConductorApi } from '@/hooks/useConductorApi';
import { localWorkflowToConductor } from '@/utils/workflowToMermaid';

export function WorkflowDiagram() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { workflows } = useWorkflowStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [conductorWorkflow, setConductorWorkflow] = useState<any>(null);
  const [dataSource, setDataSource] = useState<'api' | 'local'>('local');
  
  const { fetchWorkflowByName, loading, error } = useConductorApi({
    baseUrl: 'http://localhost:8080/api',
    enableFallback: true,
  });

  const workflow = workflows.find((w) => w.id === id);

  useEffect(() => {
    if (workflow) {
      loadWorkflow();
    }
  }, [workflow]);

  const loadWorkflow = async () => {
    if (!workflow) return;

    try {
      // Try to fetch from Conductor API first
      const apiWorkflow = await fetchWorkflowByName(workflow.name);
      
      if (apiWorkflow) {
        setConductorWorkflow(apiWorkflow);
        setDataSource('api');
      } else {
        // Fallback to local workflow
        const converted = localWorkflowToConductor(workflow);
        setConductorWorkflow(converted);
        setDataSource('local');
      }
    } catch (err) {
      // Use local workflow as fallback
      const converted = localWorkflowToConductor(workflow);
      setConductorWorkflow(converted);
      setDataSource('local');
    }
  };

  const handleRefresh = () => {
    loadWorkflow();
  };

  if (!workflow) {
    return (
      <div className="p-8">
        <Card className="p-12 bg-card border-border text-center">
          <p className="text-foreground">Workflow not found</p>
          <Button
            onClick={() => navigate('/workflows')}
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Back to Workflows
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'p-8'} space-y-8`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/workflows')}
            className="bg-transparent text-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-medium text-foreground">{workflow.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">Workflow Definition Diagram</p>
              {dataSource === 'local' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/50 rounded text-xs text-yellow-400">
                  <AlertCircleIcon className="w-3 h-3" />
                  <span>Local Data</span>
                </div>
              )}
              {dataSource === 'api' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/50 rounded text-xs text-green-400">
                  <span>Conductor API</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="text-foreground border-border hover:bg-muted"
          >
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-primary text-primary-foreground' : 'text-foreground border-border hover:bg-muted'}
          >
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
        </div>
      </div>

      <WorkflowDiagramViewer
        workflow={conductorWorkflow}
        type="definition"
        autoRefresh={autoRefresh}
        onRefresh={handleRefresh}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />
    </div>
  );
}
