import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflowStore } from '@/stores/workflowStore';
import { ActivityIcon, CheckCircle2Icon, XCircleIcon, EyeIcon } from 'lucide-react';

export function Executions() {
  const navigate = useNavigate();
  const { executions } = useWorkflowStore();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2Icon className="w-5 h-5 text-success" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-destructive" />;
      case 'running':
        return <ActivityIcon className="w-5 h-5 text-primary animate-pulse" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-white">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-destructive text-white">Failed</Badge>;
      case 'running':
        return <Badge className="bg-primary text-primary-foreground">Running</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#0f1419]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Executions</h1>
          <p className="text-base text-gray-400">Monitor workflow execution history</p>
        </div>
        <div className="text-sm text-gray-400">
          Total Executions: <span className="text-white font-semibold">{executions.length}</span>
        </div>
      </div>

      <Card className="bg-[#1a1f2e] border-[#2a3142] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0f1419]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Workflow</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Execution ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Start Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Duration</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3142]">
              {executions.map((execution) => (
                <tr key={execution.id} className="hover:bg-[#2a3142]/30 transition-colors duration-150 ease-in">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      {getStatusBadge(execution.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-white">{execution.workflowName}</td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-400">{execution.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-white">
                    {new Date(execution.startTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {(() => {
                      if (execution.status === 'running') {
                        return <span className="text-cyan-400 animate-pulse">Running...</span>;
                      } else if (execution.duration) {
                        return `${(execution.duration / 1000).toFixed(2)}s`;
                      } else {
                        return '-';
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/executions/${execution.id}`)}
                      className="bg-cyan-500 text-white hover:bg-cyan-600 font-medium"
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
