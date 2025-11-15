/**
 * FileStore Client - Handles communication with backend filestore service
 * Provides persistent server-side caching for task sync status
 */

export interface FileStoreTaskCache {
  taskName: string;
  status: 'draft' | 'published' | 'syncing';
  lastSyncTime?: number;
  isLocalOnly: boolean;
  cachedAt: number;
}

interface FileStoreResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class FileStoreClient {
  private readonly baseUrl: string;
  private readonly cacheFile: string = 'task-cache.json';

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
        console.warn('FileStore load request failed with status:', response.status);
        return [];
      }

      const result: FileStoreResponse<FileStoreTaskCache[]> = await response.json();
      if (result.success && Array.isArray(result.data)) {
        console.log('Loaded task cache from filestore:', result.data);
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Error loading cache from filestore:', error);
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
          key: this.cacheFile,
          data: tasks,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        console.warn('FileStore save request failed with status:', response.status);
        return false;
      }

      const result: FileStoreResponse<void> = await response.json();
      if (result.success) {
        console.log('Successfully saved task cache to filestore');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving cache to filestore:', error);
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
        body: JSON.stringify({ key: this.cacheFile }),
      });

      if (!response.ok) {
        console.warn('FileStore clear request failed with status:', response.status);
        return false;
      }

      const result: FileStoreResponse<void> = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error clearing filestore cache:', error);
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
        console.warn('FileStore info request failed with status:', response.status);
        return null;
      }

      const result: FileStoreResponse<{ size: number; lastUpdate: number }> = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error getting filestore cache info:', error);
      return null;
    }
  }
}

// Singleton instance
export const fileStoreClient = new FileStoreClient();
