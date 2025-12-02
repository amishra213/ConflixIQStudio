import { create } from 'zustand';

interface WorkflowStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
}

interface ExecutionStats {
  running: number;
  completed: number;
  failed: number;
  paused: number;
  total: number;
}

interface MetricsData {
  throughput: Array<{ time: string; value: number }>;
  latency: Array<{ time: string; value: number }>;
  successRate: Array<{ time: string; value: number }>;
}

interface DashboardStateWithErrors {
  taskQueues: Array<{
    id: string;
    name: string;
    pending: number;
    processing: number;
    capacity: number;
    rate: number;
  }>;
}

interface RecentError {
  id: string;
  message: string;
  workflow: string;
  severity: string;
  details: string;
  timestamp: string | number | Date;
}

interface DashboardState {
  workflowStats: WorkflowStats;
  executionStats: ExecutionStats;
  totalTasks: number;
  metricsData: MetricsData;
  workflowNodes: Record<string, unknown>[];
  fetchDashboardData: () => void;
}

interface MetricsData {
  throughput: Array<{ time: string; value: number }>;
  latency: Array<{ time: string; value: number }>;
  successRate: Array<{ time: string; value: number }>;
}

interface DashboardStateWithErrors {
  taskQueues: Array<{
    id: string;
    name: string;
    pending: number;
    processing: number;
    capacity: number;
    rate: number;
  }>;
}

interface RecentError {
  id: string;
  message: string;
  workflow: string;
  severity: string;
  details: string;
  timestamp: string | number | Date;
}

interface DashboardState {
  workflowStats: WorkflowStats;
  executionStats: ExecutionStats;
  totalTasks: number;
  metricsData: MetricsData;
  fetchDashboardData: () => void;
}
interface DashboardStateWithErrors extends DashboardState {
  recentErrors: RecentError[];
  addError: (error: RecentError) => void;
}
export const useDashboardStore = create<DashboardStateWithErrors>((set) => ({
  workflowStats: {
    total: 0,
    running: 0,
    completed: 0,
    failed: 0,
  },
  executionStats: {
    running: 12,
    completed: 145,
    failed: 3,
    paused: 2,
    total: 162,
  },
  totalTasks: 24,
  metricsData: {
    throughput: [],
    latency: [],
    successRate: [],
  },
  workflowNodes: [],
  taskQueues: [],
  recentErrors: [],
  addError: (error: RecentError) => {
    set((state) => ({
      recentErrors: [...state.recentErrors, error],
    }));
  },

  fetchDashboardData: () => {
    // This would fetch real data from Conductor API
    set({
      workflowStats: {
        total: 156,
        running: 23,
        completed: 128,
        failed: 5,
      },
      executionStats: {
        running: 12,
        completed: 145,
        failed: 3,
        paused: 2,
        total: 162,
      },
      totalTasks: 24,
    });
  },
}));
