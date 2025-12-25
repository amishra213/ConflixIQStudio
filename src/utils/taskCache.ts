/**
 * FileStore-based persistent caching for task definitions
 * Stores task sync status and cached data locally
 */

export interface CachedTaskData {
  taskName: string;
  status: 'draft' | 'published' | 'syncing';
  lastSyncTime?: number;
  isLocalOnly: boolean;
}

const STORAGE_KEY = 'conductor_task_cache';
const CACHE_VERSION = 1;

interface CacheStore {
  version: number;
  tasks: Map<string, CachedTaskData>;
  lastUpdated: number;
}

class TaskCacheManager {
  private readonly cache: CacheStore;

  constructor() {
    this.cache = this.loadFromStorage();
  }

  private loadFromStorage(): CacheStore {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          version: parsed.version || CACHE_VERSION,
          tasks: new Map(parsed.tasks || []),
          lastUpdated: parsed.lastUpdated || Date.now(),
        };
      }
    } catch (error) {
      console.error('Error loading task cache from storage:', error);
    }
    return {
      version: CACHE_VERSION,
      tasks: new Map(),
      lastUpdated: Date.now(),
    };
  }

  private saveToStorage(): void {
    try {
      const data = {
        version: this.cache.version,
        tasks: Array.from(this.cache.tasks.entries()),
        lastUpdated: this.cache.lastUpdated,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving task cache to storage:', error);
    }
  }

  /**
   * Mark a task as published (synced with Conductor server)
   */
  markAsPublished(taskName: string, syncTime: number = Date.now()): void {
    const task = this.cache.tasks.get(taskName) || {
      taskName,
      isLocalOnly: false,
      status: 'published',
    };
    task.status = 'published';
    task.lastSyncTime = syncTime;
    task.isLocalOnly = false;
    this.cache.tasks.set(taskName, task);
    this.cache.lastUpdated = Date.now();
    this.saveToStorage();
  }

  /**
   * Mark a task as draft (not synced with server)
   */
  markAsDraft(taskName: string): void {
    const task = this.cache.tasks.get(taskName) || {
      taskName,
      isLocalOnly: true,
      status: 'draft',
    };
    task.status = 'draft';
    task.isLocalOnly = true;
    this.cache.tasks.set(taskName, task);
    this.cache.lastUpdated = Date.now();
    this.saveToStorage();
  }

  /**
   * Mark a task as syncing
   */
  markAsSyncing(taskName: string): void {
    const task = this.cache.tasks.get(taskName) || {
      taskName,
      isLocalOnly: false,
      status: 'syncing',
    };
    task.status = 'syncing';
    this.cache.tasks.set(taskName, task);
    this.saveToStorage();
  }

  /**
   * Get cached data for a specific task
   */
  getTaskStatus(taskName: string): CachedTaskData | null {
    return this.cache.tasks.get(taskName) || null;
  }

  /**
   * Get all cached tasks
   */
  getAllTasks(): CachedTaskData[] {
    return Array.from(this.cache.tasks.values());
  }

  /**
   * Update all tasks as published (after successful API sync)
   */
  markAllAsPublished(taskNames: string[]): void {
    const now = Date.now();
    for (const name of taskNames) {
      this.markAsPublished(name, now);
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.tasks.clear();
    this.cache.lastUpdated = Date.now();
    this.saveToStorage();
  }

  /**
   * Get sync status summary
   */
  getSyncSummary(): { published: number; draft: number; syncing: number } {
    const summary = { published: 0, draft: 0, syncing: 0 };
    for (const task of this.cache.tasks.values()) {
      if (task.status === 'published') summary.published++;
      else if (task.status === 'draft') summary.draft++;
      else if (task.status === 'syncing') summary.syncing++;
    }
    return summary;
  }
}

// Singleton instance
export const taskCacheManager = new TaskCacheManager();
