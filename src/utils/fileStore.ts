/**
 * FileStore Client - Handles communication with backend filestore service
 * Provides persistent server-side caching for task sync status and workflows
 */

export interface FileStoreTaskCache {
  taskName: string;
  status: 'draft' | 'published' | 'syncing';
  lastSyncTime?: number;
  isLocalOnly: boolean;
  cachedAt: number;
}

export interface FileStoreWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes?: unknown[];
  edges?: unknown[];
  createdAt?: string;
  status?: 'draft' | 'active' | 'paused';
  [key: string]: unknown;
}

interface FileStoreResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class FileStoreClient {
  private readonly baseUrl: string;
  private readonly taskCacheFile: string = 'task-cache.json';

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Load task cache from filestore
   */
  async loadCache(): Promise<FileStoreTaskCache[]> {
    try {
      const response = await fetch(`${this.baseUrl}/filestore/load`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        // Silently return empty array - filestore is optional
        return [];
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        // Silently return empty array - filestore API may not be available
        return [];
      }

      const result: FileStoreResponse<FileStoreTaskCache[]> = await response.json();
      if (result.success && Array.isArray(result.data)) {
        console.log('Loaded task cache from filestore:', result.data);
        return result.data;
      }
      return [];
    } catch {
      // Silently handle errors - filestore is optional and may not be running
      return [];
    }
  }

  /**
   * Load workflows from filestore
   */
  async loadWorkflows(): Promise<FileStoreWorkflow[]> {
    try {
      const response = await fetch(`${this.baseUrl}/filestore/load-workflows`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return [];
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        return [];
      }

      const result: FileStoreResponse<FileStoreWorkflow[]> = await response.json();
      if (result.success && Array.isArray(result.data)) {
        console.log('Loaded workflows from filestore:', result.data);
        return result.data;
      }
      return [];
    } catch (err) {
      console.warn('Error loading workflows from filestore:', err);
      return [];
    }
  }

  /**
   * Save task cache to filestore
   */
  async saveCache(tasks: FileStoreTaskCache[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/filestore/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: this.taskCacheFile,
          data: tasks,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        // Silently return false - filestore is optional
        return false;
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        // Silently return false - filestore API may not be available
        return false;
      }

      const result: FileStoreResponse<void> = await response.json();
      if (result.success) {
        console.log('Successfully saved task cache to filestore');
        return true;
      }
      return false;
    } catch {
      // Silently handle errors - filestore is optional and may not be running
      return false;
    }
  }

  /**
   * Save workflows to filestore
   */
  async saveWorkflows(workflows: FileStoreWorkflow[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/filestore/save-workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflows,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        console.warn('Failed to save workflows to filestore:', response.statusText);
        return false;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.warn('Invalid response format from filestore');
        return false;
      }

      const result: FileStoreResponse<void> = await response.json();
      if (result.success) {
        console.log('Successfully saved workflows to filestore');
        return true;
      }
      console.warn('Filestore returned success: false');
      return false;
    } catch (err) {
      console.warn('Error saving workflows to filestore:', err);
      return false;
    }
  }

  /**
   * Clear filestore cache
   */
  async clearCache(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/filestore/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: this.taskCacheFile }),
      });

      if (!response.ok) {
        // Silently return false - filestore is optional
        return false;
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        // Silently return false - filestore API may not be available
        return false;
      }

      const result: FileStoreResponse<void> = await response.json();
      return result.success;
    } catch {
      // Silently handle errors - filestore is optional and may not be running
      return false;
    }
  }

  /**
   * Get cache status/info
   */
  async getCacheInfo(): Promise<{ size: number; lastUpdate: number } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/filestore/info`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        // Silently return null - filestore is optional
        return null;
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        // Silently return null - filestore API may not be available
        return null;
      }

      const result: FileStoreResponse<{ size: number; lastUpdate: number }> = await response.json();
      return result.data || null;
    } catch {
      // Silently handle errors - filestore is optional and may not be running
      return null;
    }
  }
}

// Singleton instance
export const fileStoreClient = new FileStoreClient();
