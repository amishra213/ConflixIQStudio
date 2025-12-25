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

export interface ServerWorkflowDefinition {
  name: string;
  description?: string;
  version?: number;
  createTime?: string | number;
  updateTime?: string | number;
  createdBy?: string;
  updatedBy?: string;
  ownerEmail?: string;
  ownerApp?: string;
  timeoutSeconds?: number;
  timeoutPolicy?: string;
  tasks?: unknown[];
  inputParameters?: string[];
  outputParameters?: Record<string, unknown>;
  restartable?: boolean;
  schemaVersion?: number;
  failureWorkflow?: string;
  workflowStatusListenerEnabled?: boolean;
  accessPolicy?: Record<string, unknown>;
  inputTemplate?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  [key: string]: unknown;
}

interface WorkflowCacheStoreState {
  // Workflow cache
  cachedWorkflows: Map<string, CachedWorkflowData>;

  // Full workflow definitions from server (cached)
  cachedServerWorkflows: ServerWorkflowDefinition[];

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

  // Server workflows caching
  setServerWorkflows: (workflows: ServerWorkflowDefinition[]) => void;
  getServerWorkflows: () => ServerWorkflowDefinition[];
  clearServerWorkflows: () => void;

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
      cachedServerWorkflows: [],
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
        // Clear the persist storage first
        localStorage.removeItem('workflow-cache-store');
        set({ cachedWorkflows: new Map(), cachedServerWorkflows: [] });
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

      setServerWorkflows: (workflows: ServerWorkflowDefinition[]) => {
        // Clear old data completely before setting new data
        set({ cachedServerWorkflows: [] });
        // Then set the new workflows
        set({ cachedServerWorkflows: workflows });
        console.log(
          '[WorkflowCacheStore] Updated server workflows cache with',
          workflows.length,
          'workflows'
        );
      },

      getServerWorkflows: () => {
        const cached = get().cachedServerWorkflows;
        console.log('[WorkflowCacheStore] Retrieved', cached.length, 'cached server workflows');
        return cached;
      },

      clearServerWorkflows: () => {
        // Clear the persist storage to ensure it doesn't re-hydrate
        localStorage.removeItem('workflow-cache-store');
        set({ cachedServerWorkflows: [] });
        console.log('[WorkflowCacheStore] Cleared server workflows cache');
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
          const success = await fileStoreClient.saveWorkflows(
            workflows as Parameters<typeof fileStoreClient.saveWorkflows>[0]
          );
          if (success) {
            set({ lastFileStoreSyncTime: Date.now(), isFileStoreSyncing: false });
          } else {
            set({
              fileStoreSyncError: 'Failed to save workflows to filestore',
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
          // Load all workflows from separate files in multi-file architecture for scalability and Git compatibility
          const cachedData = await fileStoreClient.loadAllWorkflows();
          if (Array.isArray(cachedData) && cachedData.length > 0) {
            const workflows = new Map<string, CachedWorkflowData>();
            const workflowsByName = new Map<string, CachedWorkflowData[]>(); // Track multiple versions by name

            for (const item of cachedData) {
              const cachedItem = item as Record<string, unknown>;
              const workflowName = item.name || 'Unnamed Workflow';
              // Preserve complete definition including nodes, edges, settings, and all metadata
              const cachedWorkflow: CachedWorkflowData = {
                id: item.id,
                name: workflowName,
                description: item.description,
                syncStatus: (cachedItem.syncStatus as WorkflowSyncStatus) || 'local-only',
                lastSyncTime: cachedItem.lastSyncTime as number | undefined,
                isLocalOnly: (cachedItem.isLocalOnly as boolean) || false,
                definition: {
                  name: workflowName,
                  description: item.description,
                  version: cachedItem.version as number | undefined,
                  schemaVersion: cachedItem.schemaVersion as number | undefined,
                  ownerEmail: cachedItem.ownerEmail as string | undefined,
                  ownerApp: cachedItem.ownerApp as string | undefined,
                  createdBy: cachedItem.createdBy as string | undefined,
                  updatedBy: cachedItem.updatedBy as string | undefined,
                  createTime: cachedItem.createTime as string | undefined,
                  updateTime: cachedItem.updateTime as string | undefined,
                  nodes: item.nodes, // Complete nodes array with all task configs
                  edges: item.edges, // All edges
                  tasks: (cachedItem.tasks as unknown[]) || undefined, // OSS Conductor task definitions
                  settings: cachedItem.settings, // Complete workflow settings
                  restartable: cachedItem.restartable as boolean | undefined,
                  timeoutSeconds: cachedItem.timeoutSeconds as number | undefined,
                  timeoutPolicy: cachedItem.timeoutPolicy as string | undefined,
                  workflowStatusListenerEnabled: cachedItem.workflowStatusListenerEnabled as
                    | boolean
                    | undefined,
                  failureWorkflow: cachedItem.failureWorkflow as string | undefined,
                  inputParameters: cachedItem.inputParameters as string[] | undefined,
                  outputParameters: cachedItem.outputParameters as Record<string, unknown>,
                  inputTemplate: cachedItem.inputTemplate as Record<string, unknown>,
                  accessPolicy: cachedItem.accessPolicy as Record<string, unknown>,
                  variables: cachedItem.variables as Record<string, unknown>,
                  // Spread remaining properties (excluding already set fields)
                  ...Object.fromEntries(
                    Object.entries(item).filter(
                      ([key]) =>
                        ![
                          'name',
                          'description',
                          'nodes',
                          'edges',
                          'version',
                          'schemaVersion',
                          'ownerEmail',
                          'ownerApp',
                          'createdBy',
                          'updatedBy',
                          'createTime',
                          'updateTime',
                          'tasks',
                          'settings',
                          'restartable',
                          'timeoutSeconds',
                          'timeoutPolicy',
                          'workflowStatusListenerEnabled',
                          'failureWorkflow',
                          'inputParameters',
                          'outputParameters',
                          'inputTemplate',
                          'accessPolicy',
                          'variables',
                        ].includes(key)
                    )
                  ),
                },
              };

              workflows.set(item.id, cachedWorkflow);

              // Track multiple versions: keep the most recent by comparing timestamps
              if (!workflowsByName.has(workflowName)) {
                workflowsByName.set(workflowName, []);
              }
              workflowsByName.get(workflowName)?.push(cachedWorkflow);
            }

            // Log version handling for workflows with multiple versions
            for (const [name, versions] of workflowsByName.entries()) {
              if (versions.length > 1) {
                const versionsCopy = [...versions];
                versionsCopy.sort((a, b) => {
                  const aTime = (a.definition?.createTime || 0) as number;
                  const bTime = (b.definition?.createTime || 0) as number;
                  return bTime - aTime; // Most recent first
                });
                console.log(
                  `[WorkflowCacheStore] Found ${versions.length} versions of "${name}", using most recent (v${versionsCopy[0].definition?.version || 1})`
                );
              }
            }

            console.log(
              '[WorkflowCacheStore] Loaded workflows from separate files (multi-file architecture):',
              Array.from(workflows.values())
            );
            set({
              cachedWorkflows: workflows,
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
          // Load all workflows to get their IDs for deletion
          const cachedData = await fileStoreClient.loadAllWorkflows();

          // Delete each workflow file from filestore
          if (Array.isArray(cachedData)) {
            for (const workflow of cachedData) {
              await fileStoreClient.deleteWorkflow(workflow.id);
            }
            console.log(
              '[WorkflowCacheStore] Deleted',
              cachedData.length,
              'workflow files from filestore'
            );
          }

          // Clear local caches
          set({
            cachedWorkflows: new Map(),
            cachedServerWorkflows: [],
            lastFileStoreSyncTime: Date.now(),
            isFileStoreSyncing: false,
          });
          console.log('[WorkflowCacheStore] Cleared filestore and local caches');
          return true;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('[WorkflowCacheStore] Error clearing filestore:', errorMsg);
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
                cachedServerWorkflows: parsed.state.cachedServerWorkflows || [],
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
                cachedServerWorkflows: value.state.cachedServerWorkflows || [],
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
