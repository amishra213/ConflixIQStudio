import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SearchIcon,
  DownloadIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  ChevronLeftIcon,
} from 'lucide-react';
import { useLoggingStore } from '../stores/loggingStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function LogsViewer() {
  const { toast } = useToast();
  const navigate = useNavigate();
  // Subscribe to the store with proper selectors
  const logs = useLoggingStore((state) => state.logs);
  const clearLogs = useLoggingStore((state) => state.clearLogs);
  const exportLogs = useLoggingStore((state) => state.exportLogs);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Filter logs based on current filters - this will automatically update when logs change
  const filteredLogs = logs.filter((log) => {
    // Filter by type
    if (selectedType !== 'all' && log.type !== selectedType) return false;

    // Filter by operation name
    if (searchQuery && !log.operation.toLowerCase().includes(searchQuery.toLowerCase()))
      return false;

    return true;
  });

  const logStats = useMemo(() => {
    return {
      total: logs.length,
      requests: logs.filter((l) => l.type === 'request').length,
      responses: logs.filter((l) => l.type === 'response').length,
      errors: logs.filter((l) => l.type === 'error').length,
    };
  }, [logs]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'request':
        return 'bg-primary text-primary-foreground';
      case 'response':
        return 'bg-success text-success-foreground';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'request':
        return ArrowRightIcon;
      case 'response':
        return CheckCircle2Icon;
      case 'error':
        return AlertCircleIcon;
      default:
        return ClockIcon;
    }
  };

  const handleExport = () => {
    exportLogs();
    toast({
      title: 'Logs Exported',
      description: 'Log file has been downloaded successfully.',
    });
  };

  const handleClear = () => {
    clearLogs();
    setExpandedLog(null);
    setSearchQuery('');
    setSelectedType('all');
    toast({
      title: 'Logs Cleared',
      description: 'All log entries have been deleted.',
    });
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss.SSS');
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-foreground hover:bg-accent"
            title="Go back to previous page"
          >
            <ChevronLeftIcon className="h-5 w-5" strokeWidth={1.5} />
          </Button>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">API Logs</h1>
            <p className="text-muted-foreground mt-2">
              View and analyze GraphQL API calls to Netflix Conductor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={logs.length === 0}
            className="bg-transparent text-foreground border-border hover:bg-accent"
          >
            <DownloadIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Export
          </Button>
          <Button variant="destructive" onClick={handleClear} disabled={logs.length === 0}>
            <TrashIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Logs</p>
                <p className="text-2xl font-bold text-foreground">{logStats.total}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Requests</p>
                <p className="text-2xl font-bold text-primary">{logStats.requests}</p>
              </div>
              <ArrowRightIcon className="h-8 w-8 text-primary" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Responses</p>
                <p className="text-2xl font-bold text-success">{logStats.responses}</p>
              </div>
              <CheckCircle2Icon className="h-8 w-8 text-success" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-destructive">{logStats.errors}</p>
              </div>
              <AlertCircleIcon className="h-8 w-8 text-destructive" strokeWidth={1.5} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <SearchIcon
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.5}
              />
              <Input
                type="search"
                placeholder="Search by operation name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background text-foreground border-border"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('all')}
                className={
                  selectedType === 'all'
                    ? ''
                    : 'bg-transparent text-foreground border-border hover:bg-accent'
                }
              >
                All
              </Button>
              <Button
                variant={selectedType === 'request' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('request')}
                className={
                  selectedType === 'request'
                    ? ''
                    : 'bg-transparent text-foreground border-border hover:bg-accent'
                }
              >
                Requests
              </Button>
              <Button
                variant={selectedType === 'response' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('response')}
                className={
                  selectedType === 'response'
                    ? ''
                    : 'bg-transparent text-foreground border-border hover:bg-accent'
                }
              >
                Responses
              </Button>
              <Button
                variant={selectedType === 'error' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('error')}
                className={
                  selectedType === 'error'
                    ? ''
                    : 'bg-transparent text-foreground border-border hover:bg-accent'
                }
              >
                Errors
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator className="bg-border" />
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-28rem)]">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="text-center space-y-3">
                  <p className="text-lg font-medium text-muted-foreground">No logs found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? 'Try adjusting your search criteria'
                      : 'API logs will appear here when logging is enabled'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredLogs.map((log) => {
                  const TypeIcon = getTypeIcon(log.type);
                  const isExpanded = expandedLog === log.id;

                  return (
                    <div key={log.id} className="p-4 hover:bg-accent/50 transition-colors">
                      <button
                        className="w-full flex items-start justify-between gap-4 cursor-pointer bg-transparent border-0 p-0 text-left hover:bg-transparent"
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} log entry for ${log.operation}`}
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge className={cn('text-xs', getTypeColor(log.type))}>
                              <TypeIcon className="h-3 w-3 mr-1" strokeWidth={1.5} />
                              {log.type.toUpperCase()}
                            </Badge>
                            <span className="font-mono text-sm font-medium text-foreground">
                              {log.operation}
                            </span>
                            {log.status && (
                              <Badge variant="outline" className="text-xs">
                                {log.status}
                              </Badge>
                            )}
                            {log.duration && (
                              <Badge variant="outline" className="text-xs">
                                {log.duration}ms
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" strokeWidth={1.5} />
                              {formatTimestamp(log.timestamp)}
                            </span>
                            <span className="font-mono">{log.method}</span>
                            <span className="truncate max-w-md">{log.url}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUpIcon className="h-4 w-4" strokeWidth={1.5} />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" strokeWidth={1.5} />
                          )}
                        </Button>
                      </button>

                      {isExpanded && (
                        <div className="mt-4 space-y-4">
                          <Tabs defaultValue="request" className="w-full">
                            <TabsList className="bg-muted">
                              <TabsTrigger value="request">Request</TabsTrigger>
                              <TabsTrigger value="response">Response</TabsTrigger>
                              {log.requestHeaders && (
                                <TabsTrigger value="headers">Headers</TabsTrigger>
                              )}
                              {log.error && <TabsTrigger value="error">Error</TabsTrigger>}
                            </TabsList>

                            <TabsContent value="request" className="mt-4">
                              <div className="rounded-lg bg-background border border-border p-4">
                                <pre className="font-mono text-xs text-foreground overflow-x-auto">
                                  {JSON.stringify(log.requestBody, null, 2)}
                                </pre>
                              </div>
                            </TabsContent>

                            <TabsContent value="response" className="mt-4">
                              <div className="rounded-lg bg-background border border-border p-4">
                                <pre className="font-mono text-xs text-foreground overflow-x-auto">
                                  {JSON.stringify(log.responseBody, null, 2)}
                                </pre>
                              </div>
                            </TabsContent>

                            {log.requestHeaders && (
                              <TabsContent value="headers" className="mt-4">
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="text-sm font-medium text-foreground mb-2">
                                      Request Headers
                                    </h4>
                                    <div className="rounded-lg bg-background border border-border p-4">
                                      <pre className="font-mono text-xs text-foreground overflow-x-auto">
                                        {JSON.stringify(log.requestHeaders, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                  {log.responseHeaders && (
                                    <div>
                                      <h4 className="text-sm font-medium text-foreground mb-2">
                                        Response Headers
                                      </h4>
                                      <div className="rounded-lg bg-background border border-border p-4">
                                        <pre className="font-mono text-xs text-foreground overflow-x-auto">
                                          {JSON.stringify(log.responseHeaders, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                            )}

                            {log.error && (
                              <TabsContent value="error" className="mt-4">
                                <div className="space-y-3">
                                  <div className="rounded-lg bg-destructive/10 border border-destructive p-4">
                                    <h4 className="text-sm font-semibold text-destructive mb-2">
                                      Error Message
                                    </h4>
                                    <p className="font-mono text-sm text-destructive whitespace-pre-wrap">
                                      {log.error}
                                    </p>
                                  </div>
                                  {log.responseBody && (
                                    <div>
                                      <h4 className="text-sm font-medium text-foreground mb-2">
                                        Full Error Response
                                      </h4>
                                      <div className="rounded-lg bg-background border border-destructive p-4">
                                        <pre className="font-mono text-xs text-foreground overflow-x-auto">
                                          {JSON.stringify(log.responseBody, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                            )}
                          </Tabs>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
