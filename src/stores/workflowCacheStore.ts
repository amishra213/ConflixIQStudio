import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fileStoreClient } from '@/utils/fileStore';

export type WorkflowSyncStatus = 'local-only' | 'synced' | 'syncing';

export interface CachedWorkflowData {
  id: string;
  name: string;
  description?: string;
  syncStatus: WorkflowSyncStatus; // Conductor sync status (renamed from 'status')
  lastSyncTime?: number;
  isLocalOnly: boolean;
  cachedAt?: number;
  // Store the full workflow definition for offline editing
  definition?: {
    name: string;
    description?: string;
    version?: number;
    tasks?: unknown[];
    settings?: unknown;
    nodes?: unknown[];
    edges?: unknown[];
    [key: string]: unknown;
  };
}

interface WorkflowCacheStoreState {
  // Workflow cache
  cachedWorkflows: Map<string, CachedWorkflowData>;
  
  // FileStore sync status
  isFileStoreSyncing: boolean;
  fileStoreSyncError: string | null;
  lastFileStoreSyncTime: number | null;
  
  // Actions
  markAsPublished: (workflowId: string, syncTime?: number) => void;
  markAsDraft: (workflowId: string) => void;
  markAsSyncing: (workflowId: string) => void;
  getWorkflowStatus: (workflowId: string) => CachedWorkflowData | null;
  getAllWorkflows: () => CachedWorkflowData[];
  markAllAsPublished: (workflowIds: string[]) => void;
  clearCache: () => void;
  getSyncSummary: () => { synced: number; localOnly: number; syncing: number };
  saveWorkflowToCache: (workflow: CachedWorkflowData) => void;
  removeFromCache: (workflowId: string) => void;
  
  // FileStore actions
  syncToFileStore: () => Promise<boolean>;
  loadFromFileStore: () => Promise<boolean>;
  clearFileStore: () => Promise<boolean>;
  setFileStoreSyncing: (syncing: boolean) => void;
  setFileStoreSyncError: (error: string | null) => void;
}

// Custom serialize/deserialize for Map
const serializeMap = (map: Map<string, CachedWorkflowData>) => {
  return Array.from(map.entries());
};

const deserializeMap = (arr: Array<[string, CachedWorkflowData]>) => {
  return new Map(arr);
};

export const useWorkflowCacheStore = create<WorkflowCacheStoreState>()(
  persist(
    (set, get) => ({
      cachedWorkflows: new Map(),
      isFileStoreSyncing: false,
      fileStoreSyncError: null,
      lastFileStoreSyncTime: null,

      markAsPublished: (workflowId: string, syncTime: number = Date.now()) => {
        set((state) => {
          const workflows = new Map(state.cachedWorkflows);
          const workflow = workflows.get(workflowId) || {
            id: workflowId,
            name: 'Unnamed Workflow',
            isLocalOnly: false,
            syncStatus: 'synced' as WorkflowSyncStatus,
          };
          workflow.syncStatus = 'synced';
          workflow.lastSyncTime = syncTime;
          workflow.isLocalOnly = false;
          workflows.set(workflowId, workflow);
          return { cachedWorkflows: workflows };
        });
      },

      markAsDraft: (workflowId: string) => {
        set((state) => {
          const workflows = new Map(state.cachedWorkflows);
          const workflow = workflows.get(workflowId) || {
            id: workflowId,
            name: 'Unnamed Workflow',
            isLocalOnly: true,
            syncStatus: 'local-only' as WorkflowSyncStatus,
          };
          workflow.syncStatus = 'local-only';
          workflow.isLocalOnly = true;
          workflows.set(workflowId, workflow);
          return { cachedWorkflows: workflows };
        });
      },

      markAsSyncing: (workflowId: string) => {
        set((state) => {
          const workflows = new Map(state.cachedWorkflows);
          const workflow = workflows.get(workflowId) || {
            id: workflowId,
            name: 'Unnamed Workflow',
            isLocalOnly: false,
            syncStatus: 'syncing' as WorkflowSyncStatus,
          };
          workflow.syncStatus = 'syncing';
          workflows.set(workflowId, workflow);
          return { cachedWorkflows: workflows };
        });
      },

      getWorkflowStatus: (workflowId: string) => {
        return get().cachedWorkflows.get(workflowId) || null;
      },

      getAllWorkflows: () => {
        return Array.from(get().cachedWorkflows.values());
      },

      markAllAsPublished: (workflowIds: string[]) => {
        set((state) => {
          const workflows = new Map(state.cachedWorkflows);
          const now = Date.now();
          for (const id of workflowIds) {
            const workflow = workflows.get(id) || {
              id,
              name: 'Unnamed Workflow',
              isLocalOnly: false,
              syncStatus: 'synced' as WorkflowSyncStatus,
            };
            workflow.syncStatus = 'synced';
            workflow.lastSyncTime = now;
            workflow.isLocalOnly = false;
            workflows.set(id, workflow);
          }
          return { cachedWorkflows: workflows };
        });
      },

      saveWorkflowToCache: (workflow: CachedWorkflowData) => {
        set((state) => {
          const workflows = new Map(state.cachedWorkflows);
          workflows.set(workflow.id, {
            ...workflow,
            cachedAt: Date.now(),
          });
          return { cachedWorkflows: workflows };
        });
      },

      removeFromCache: (workflowId: string) => {
        set((state) => {
          const workflows = new Map(state.cachedWorkflows);
          workflows.delete(workflowId);
          return { cachedWorkflows: workflows };
        });
      },

      clearCache: () => {
        set({ cachedWorkflows: new Map() });
      },

      getSyncSummary: () => {
        const summary = { synced: 0, localOnly: 0, syncing: 0 };
        for (const workflow of get().cachedWorkflows.values()) {
          if (workflow.syncStatus === 'synced') summary.synced++;
          else if (workflow.syncStatus === 'local-only') summary.localOnly++;
          else if (workflow.syncStatus === 'syncing') summary.syncing++;
        }
        return summary;
      },

      setFileStoreSyncing: (syncing: boolean) => {
        set({ isFileStoreSyncing: syncing });
      },

      setFileStoreSyncError: (error: string | null) => {
        set({ fileStoreSyncError: error });
      },

      syncToFileStore: async () => {
        set({ isFileStoreSyncing: true, fileStoreSyncError: null });
        try {
          const workflows = Array.from(get().cachedWorkflows.values()).map((workflow) => ({
            ...workflow,
            cachedAt: Date.now(),
          }));
          const success = await fileStoreClient.saveWorkflows(workflows as Parameters<typeof fileStoreClient.saveWorkflows>[0]);
          if (success) {
            set({ lastFileStoreSyncTime: Date.now(), isFileStoreSyncing: false });
          } else {
            set({ fileStoreSyncError: 'Failed to save workflows to filestore', isFileStoreSyncing: false });
          }
          return success;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          set({ fileStoreSyncError: errorMsg, isFileStoreSyncing: false });
          return false;
        }
      },

      loadFromFileStore: async () => {
        set({ isFileStoreSyncing: true, fileStoreSyncError: null });
        try {
          const cachedData = await fileStoreClient.loadWorkflows();
          if (Array.isArray(cachedData) && cachedData.length > 0) {
            const workflows = new Map<string, CachedWorkflowData>();
            for (const item of cachedData) {
              const cachedItem = item as Record<string, unknown>;
              workflows.set(item.id, {
                id: item.id,
                name: item.name || 'Unnamed Workflow',
                description: item.description,
                syncStatus: (cachedItem.syncStatus as WorkflowSyncStatus) || 'local-only',
                lastSyncTime: cachedItem.lastSyncTime as number | undefined,
                isLocalOnly: (cachedItem.isLocalOnly as boolean) || false,
                definition: {
                  description: item.description,
                  nodes: item.nodes,
                  edges: item.edges,
                  ...item,
                },
              });
            }
            set({ cachedWorkflows: workflows, lastFileStoreSyncTime: Date.now(), isFileStoreSyncing: false });
            return true;
          }
          set({ isFileStoreSyncing: false });
          return false;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          set({ fileStoreSyncError: errorMsg, isFileStoreSyncing: false });
          return false;
        }
      },

      clearFileStore: async () => {
        set({ isFileStoreSyncing: true, fileStoreSyncError: null });
        try {
          // Note: FileStore doesn't have a dedicated clearWorkflows, but we'll clear the cache locally
          set({ cachedWorkflows: new Map(), lastFileStoreSyncTime: Date.now(), isFileStoreSyncing: false });
          return true;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          set({ fileStoreSyncError: errorMsg, isFileStoreSyncing: false });
          return false;
        }
      },
    }),
    {
      name: 'workflow-cache-store',
      storage: {
        getItem: (name) => {
          const stored = localStorage.getItem(name);
          if (!stored) return null;
          try {
            const parsed = JSON.parse(stored);
            return {
              state: {
                ...parsed.state,
                cachedWorkflows: deserializeMap(parsed.state.cachedWorkflows || []),
              },
              version: parsed.version,
            };
          } catch (error) {
            console.error('Error parsing workflow cache from storage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            const serialized = {
              state: {
                ...value.state,
                cachedWorkflows: serializeMap(value.state.cachedWorkflows),
              },
              version: value.version,
            };
            localStorage.setItem(name, JSON.stringify(serialized));
          } catch (error) {
            console.error('Error saving workflow cache to storage:', error);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
