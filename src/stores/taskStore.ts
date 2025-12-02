import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fileStoreClient } from '@/utils/fileStore';

export type TaskStatus = 'draft' | 'published' | 'syncing';

export interface CachedTaskData {
  taskName: string;
  status: TaskStatus;
  lastSyncTime?: number;
  isLocalOnly: boolean;
}

export interface TaskDefinitionData {
  name: string;
  description?: string;
  retryCount?: number;
  timeoutSeconds?: number;
  inputKeys?: string[];
  outputKeys?: string[];
  responseTimeoutSeconds?: number;
  ownerEmail?: string;
  createdBy?: string;
  updatedBy?: string;
  createTime?: string | number;
  updateTime?: string | number;
  timeoutPolicy?: string;
  retryLogic?: string;
  executionNameSpace?: string;
  ownerApp?: string;
  retryDelaySeconds?: number;
  concurrentExecLimit?: number;
  rateLimitPerFrequency?: number;
  rateLimitFrequencyInSeconds?: number;
  isolationGroupId?: string;
  pollTimeoutSeconds?: number;
  backoffScaleFactor?: number;
  inputTemplate?: Record<string, unknown>;
  [key: string]: unknown;
}

interface TaskStoreState {
  // Task cache
  cachedTasks: Map<string, CachedTaskData>;

  // Full task definitions cache (from server)
  cachedTaskDefinitions: TaskDefinitionData[];

  // FileStore sync status
  isFileStoreSyncing: boolean;
  fileStoreSyncError: string | null;
  lastFileStoreSyncTime: number | null;

  // Actions
  markAsPublished: (taskName: string, syncTime?: number) => void;
  markAsDraft: (taskName: string) => void;
  markAsSyncing: (taskName: string) => void;
  getTaskStatus: (taskName: string) => CachedTaskData | null;
  getAllTasks: () => CachedTaskData[];
  markAllAsPublished: (taskNames: string[]) => void;
  clearCache: () => void;
  getSyncSummary: () => { published: number; draft: number; syncing: number };

  // Task definitions cache actions
  setTaskDefinitions: (definitions: TaskDefinitionData[]) => void;
  getTaskDefinitions: () => TaskDefinitionData[];
  clearTaskDefinitions: () => void;

  // FileStore actions
  syncToFileStore: () => Promise<boolean>;
  loadFromFileStore: () => Promise<boolean>;
  clearFileStore: () => Promise<boolean>;
  setFileStoreSyncing: (syncing: boolean) => void;
  setFileStoreSyncError: (error: string | null) => void;
}

// Custom serialize/deserialize for Map
const serializeMap = (map: Map<string, CachedTaskData>) => {
  return Array.from(map.entries());
};

const deserializeMap = (arr: Array<[string, CachedTaskData]>) => {
  return new Map(arr);
};

export const useTaskStore = create<TaskStoreState>()(
  persist(
    (set, get) => ({
      cachedTasks: new Map(),
      cachedTaskDefinitions: [],
      isFileStoreSyncing: false,
      fileStoreSyncError: null,
      lastFileStoreSyncTime: null,

      markAsPublished: (taskName: string, syncTime: number = Date.now()) => {
        set((state) => {
          const tasks = new Map(state.cachedTasks);
          const task = tasks.get(taskName) || {
            taskName,
            isLocalOnly: false,
            status: 'published' as TaskStatus,
          };
          task.status = 'published';
          task.lastSyncTime = syncTime;
          task.isLocalOnly = false;
          tasks.set(taskName, task);
          return { cachedTasks: tasks };
        });
      },

      markAsDraft: (taskName: string) => {
        set((state) => {
          const tasks = new Map(state.cachedTasks);
          const task = tasks.get(taskName) || {
            taskName,
            isLocalOnly: true,
            status: 'draft' as TaskStatus,
          };
          task.status = 'draft';
          task.isLocalOnly = true;
          tasks.set(taskName, task);
          return { cachedTasks: tasks };
        });
      },

      markAsSyncing: (taskName: string) => {
        set((state) => {
          const tasks = new Map(state.cachedTasks);
          const task = tasks.get(taskName) || {
            taskName,
            isLocalOnly: false,
            status: 'syncing' as TaskStatus,
          };
          task.status = 'syncing';
          tasks.set(taskName, task);
          return { cachedTasks: tasks };
        });
      },

      getTaskStatus: (taskName: string) => {
        return get().cachedTasks.get(taskName) || null;
      },

      getAllTasks: () => {
        return Array.from(get().cachedTasks.values());
      },

      markAllAsPublished: (taskNames: string[]) => {
        set((state) => {
          const tasks = new Map(state.cachedTasks);
          const now = Date.now();
          for (const name of taskNames) {
            const task = tasks.get(name) || {
              taskName: name,
              isLocalOnly: false,
              status: 'published' as TaskStatus,
            };
            task.status = 'published';
            task.lastSyncTime = now;
            task.isLocalOnly = false;
            tasks.set(name, task);
          }
          return { cachedTasks: tasks };
        });
      },

      clearCache: () => {
        // Clear the persist storage first
        localStorage.removeItem('task-cache-store');
        set({ cachedTasks: new Map() });
      },

      getSyncSummary: () => {
        const summary = { published: 0, draft: 0, syncing: 0 };
        for (const task of get().cachedTasks.values()) {
          if (task.status === 'published') summary.published++;
          else if (task.status === 'draft') summary.draft++;
          else if (task.status === 'syncing') summary.syncing++;
        }
        return summary;
      },

      setTaskDefinitions: (definitions: TaskDefinitionData[]) => {
        // Clear old data completely before setting new data
        set({ cachedTaskDefinitions: [] });
        // Then set the new definitions
        set({ cachedTaskDefinitions: definitions });
        console.log('[TaskStore] Updated task definitions cache with', definitions.length, 'tasks');
      },

      getTaskDefinitions: () => {
        const cached = get().cachedTaskDefinitions;
        console.log('[TaskStore] Retrieved', cached.length, 'cached task definitions');
        return cached;
      },

      clearTaskDefinitions: () => {
        // Clear the persist storage to ensure it doesn't re-hydrate
        localStorage.removeItem('task-cache-store');
        set({ cachedTaskDefinitions: [] });
        console.log('[TaskStore] Cleared task definitions cache');
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
          const tasks = Array.from(get().cachedTasks.values()).map((task) => ({
            ...task,
            cachedAt: Date.now(),
          }));
          const success = await fileStoreClient.saveCache(tasks);
          if (success) {
            set({ lastFileStoreSyncTime: Date.now(), isFileStoreSyncing: false });
          } else {
            set({
              fileStoreSyncError: 'Failed to save cache to filestore',
              isFileStoreSyncing: false,
            });
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
          const cachedData = await fileStoreClient.loadCache();
          if (Array.isArray(cachedData) && cachedData.length > 0) {
            const tasks = new Map<string, CachedTaskData>();
            for (const item of cachedData) {
              tasks.set(item.taskName, {
                taskName: item.taskName,
                status: item.status,
                lastSyncTime: item.lastSyncTime,
                isLocalOnly: item.isLocalOnly,
              });
            }
            set({
              cachedTasks: tasks,
              lastFileStoreSyncTime: Date.now(),
              isFileStoreSyncing: false,
            });
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
          const success = await fileStoreClient.clearCache();
          if (success) {
            // Clear both task cache AND task definitions
            set({
              cachedTasks: new Map(),
              cachedTaskDefinitions: [],
              lastFileStoreSyncTime: Date.now(),
              isFileStoreSyncing: false,
            });
            console.log('[TaskStore] Cleared filestore and local caches');
          } else {
            set({
              fileStoreSyncError: 'Failed to clear filestore cache',
              isFileStoreSyncing: false,
            });
          }
          return success;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('[TaskStore] Error clearing filestore:', errorMsg);
          set({ fileStoreSyncError: errorMsg, isFileStoreSyncing: false });
          return false;
        }
      },
    }),
    {
      name: 'task-cache-store',
      storage: {
        getItem: (name) => {
          const stored = localStorage.getItem(name);
          if (!stored) return null;
          try {
            const parsed = JSON.parse(stored);
            return {
              state: {
                ...parsed.state,
                cachedTasks: deserializeMap(parsed.state.cachedTasks || []),
                cachedTaskDefinitions: parsed.state.cachedTaskDefinitions || [],
              },
              version: parsed.version,
            };
          } catch (error) {
            console.error('Error parsing task cache from storage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            const serialized = {
              state: {
                ...value.state,
                cachedTasks: serializeMap(value.state.cachedTasks),
                cachedTaskDefinitions: value.state.cachedTaskDefinitions || [],
              },
              version: value.version,
            };
            localStorage.setItem(name, JSON.stringify(serialized));
          } catch (error) {
            console.error('Error saving task cache to storage:', error);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
