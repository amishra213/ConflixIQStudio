import React, { useState, useMemo } from 'react';
import { TaskDefinition, TaskDefinitionFilter } from '@/types/taskDefinition';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

interface TaskDefinitionsTableProps {
  readonly tasks: TaskDefinition[];
  readonly error?: Error | null;
}

const ITEMS_PER_PAGE = 10;

export function TaskDefinitionsTable({ tasks, error = null }: TaskDefinitionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<TaskDefinitionFilter>({});
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    name: true,
    description: true,
    retryCount: true,
    timeoutSeconds: true,
    timeoutPolicy: true,
    retryLogic: true,
    concurrentExecLimit: true,
    createdBy: true,
  });

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.name && !task.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      if (filters.description && !task.description?.toLowerCase().includes(filters.description.toLowerCase())) {
        return false;
      }
      if (filters.timeoutPolicy && task.timeoutPolicy !== filters.timeoutPolicy) {
        return false;
      }
      if (filters.retryLogic && task.retryLogic !== filters.retryLogic) {
        return false;
      }
      return true;
    });
  }, [tasks, filters]);

  // Paginate
  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTasks, currentPage]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const uniqueTimeoutPolicies = useMemo(() => {
    const policies = new Set(tasks.map(t => t.timeoutPolicy).filter(Boolean));
    return Array.from(policies);
  }, [tasks]);

  const uniqueRetryLogics = useMemo(() => {
    const logics = new Set(tasks.map(t => t.retryLogic).filter(Boolean));
    return Array.from(logics);
  }, [tasks]);

  const handleFilterChange = (key: keyof TaskDefinitionFilter, value: string) => {
    if (value === '') {
      const newFilters = { ...filters };
      delete newFilters[key];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [key]: value });
    }
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns({
      ...visibleColumns,
      [column]: !visibleColumns[column],
    });
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  if (error) {
    return (
      <Card className="p-6 bg-[#1a1f2e] border-[#2a3142]">
        <div className="text-red-400 flex items-center gap-2">
          <span>Error loading tasks:</span>
          <span className="font-mono text-sm">{error.message}</span>
        </div>
      </Card>
    );
  }

  const renderTableContent = () => {
    if (filteredTasks.length === 0) {
      return <div className="p-8 text-center text-gray-400">No task definitions found.</div>;
    }

    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a3142] bg-[#0f1419]">
                {visibleColumns.name && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Name</th>
                )}
                {visibleColumns.description && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Description</th>
                )}
                {visibleColumns.retryCount && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400">Retry Count</th>
                )}
                {visibleColumns.timeoutSeconds && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400">Timeout (s)</th>
                )}
                {visibleColumns.timeoutPolicy && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400">Timeout Policy</th>
                )}
                {visibleColumns.retryLogic && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400">Retry Logic</th>
                )}
                {visibleColumns.concurrentExecLimit && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400">Concurrent Limit</th>
                )}
                {visibleColumns.createdBy && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400">Created By</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedTasks.map((task, index) => (
                <tr
                  key={task.name}
                  className={`border-b border-[#2a3142] hover:bg-[#0f1419]/50 transition-colors ${
                    index % 2 === 0 ? 'bg-[#0f1419]/30' : ''
                  }`}
                >
                  {visibleColumns.name && (
                    <td className="px-4 py-3 text-white font-medium">{task.name}</td>
                  )}
                  {visibleColumns.description && (
                    <td className="px-4 py-3 text-gray-300 max-w-xs truncate" title={task.description}>
                      {task.description || '-'}
                    </td>
                  )}
                  {visibleColumns.retryCount && (
                    <td className="px-4 py-3 text-center text-gray-300">{task.retryCount ?? '-'}</td>
                  )}
                  {visibleColumns.timeoutSeconds && (
                    <td className="px-4 py-3 text-center text-gray-300">{task.timeoutSeconds ?? '-'}</td>
                  )}
                  {visibleColumns.timeoutPolicy && (
                    <td className="px-4 py-3 text-center">
                      {task.timeoutPolicy ? (
                        <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/50 text-xs">
                          {task.timeoutPolicy}
                        </Badge>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.retryLogic && (
                    <td className="px-4 py-3 text-center">
                      {task.retryLogic ? (
                        <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/50 text-xs">
                          {task.retryLogic}
                        </Badge>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.concurrentExecLimit && (
                    <td className="px-4 py-3 text-center text-gray-300">
                      {task.concurrentExecLimit ?? '-'}
                    </td>
                  )}
                  {visibleColumns.createdBy && (
                    <td className="px-4 py-3 text-center text-gray-300 text-xs">{task.createdBy ?? '-'}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2a3142] bg-[#0f1419]/50">
            <div className="text-xs text-gray-400">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredTasks.length)} of {filteredTasks.length}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                    }
                    if (pageNum > totalPages) {
                      pageNum = totalPages - (4 - i);
                    }
                  }
                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-8 w-8 p-0 text-xs"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <Card className="p-4 bg-[#1a1f2e] border-[#2a3142] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Filters</h3>
          {Object.keys(filters).length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearFilters}
              className="text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label htmlFor="name-filter" className="text-xs font-medium text-gray-400">Name</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
              <Input
                id="name-filter"
                placeholder="Search by name..."
                className="pl-8 h-8 text-sm bg-[#0f1419] border-[#2a3142] text-white placeholder:text-gray-600"
                value={filters.name || ''}
                onChange={(e) => handleFilterChange('name', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="description-filter" className="text-xs font-medium text-gray-400">Description</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
              <Input
                id="description-filter"
                placeholder="Search by description..."
                className="pl-8 h-8 text-sm bg-[#0f1419] border-[#2a3142] text-white placeholder:text-gray-600"
                value={filters.description || ''}
                onChange={(e) => handleFilterChange('description', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="timeout-policy-filter" className="text-xs font-medium text-gray-400">Timeout Policy</label>
            <Select value={filters.timeoutPolicy || ''} onValueChange={(value) => handleFilterChange('timeoutPolicy', value)}>
              <SelectTrigger id="timeout-policy-filter" className="h-8 text-sm bg-[#0f1419] border-[#2a3142] text-white">
                <SelectValue placeholder="All policies" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                <SelectItem value="">All policies</SelectItem>
                {uniqueTimeoutPolicies.map((policy) => (
                  <SelectItem key={policy} value={policy || ''}>
                    {policy || 'None'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label htmlFor="retry-logic-filter" className="text-xs font-medium text-gray-400">Retry Logic</label>
            <Select value={filters.retryLogic || ''} onValueChange={(value) => handleFilterChange('retryLogic', value)}>
              <SelectTrigger id="retry-logic-filter" className="h-8 text-sm bg-[#0f1419] border-[#2a3142] text-white">
                <SelectValue placeholder="All logics" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                <SelectItem value="">All logics</SelectItem>
                {uniqueRetryLogics.map((logic) => (
                  <SelectItem key={logic} value={logic || ''}>
                    {logic || 'None'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Column Visibility Toggle */}
      <Card className="p-3 bg-[#1a1f2e] border-[#2a3142]">
        <div className="flex flex-wrap gap-2">
          {Object.entries(visibleColumns).map(([column, isVisible]) => (
            <Button
              key={column}
              size="sm"
              variant={isVisible ? 'default' : 'outline'}
              onClick={() => toggleColumn(column)}
              className="text-xs h-7"
            >
              {column}
            </Button>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card className="bg-[#1a1f2e] border-[#2a3142] overflow-hidden">
        {renderTableContent()}
      </Card>
    </div>
  );
}
