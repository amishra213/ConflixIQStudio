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
   * Load workflows from filestore (uses the new multi-file approach)
   */
  async loadWorkflows(): Promise<FileStoreWorkflow[]> {
    return this.loadAllWorkflows();
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
   * Save a single workflow to filestore as individual file
   * Files are stored as: workflows/{workflowId}.json
   * Using workflow ID ensures uniqueness and prevents collisions when multiple
   * workflows have the same name or version
   */
  async saveWorkflow(workflow: FileStoreWorkflow): Promise<boolean> {
    try {
      // Create filename from workflow ID (unique identifier) instead of name
      // This prevents collisions when multiple workflows have the same name
      const filename = `workflows/${workflow.id}.json`;

      const response = await fetch(`${this.baseUrl}/filestore/save-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          data: workflow,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        console.warn(`Failed to save workflow ${workflow.name} to filestore:`, response.statusText);
        return false;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.warn('Invalid response format from filestore');
        return false;
      }

      const result: FileStoreResponse<void> = await response.json();
      if (result.success) {
        // Suppress verbose individual workflow save logs (logged in batch at higher level)
        return true;
      }
      console.warn('Filestore returned success: false');
      return false;
    } catch (err) {
      console.warn(`Error saving workflow ${workflow.name} to filestore:`, err);
      return false;
    }
  }

  /**
   * Load all workflows from filestore (individual files in workflows/ directory)
   */
  async loadAllWorkflows(): Promise<FileStoreWorkflow[]> {
    try {
      const response = await fetch(`${this.baseUrl}/filestore/load-workflows-batch`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        console.warn('Failed to load workflows from filestore:', response.statusText);
        return [];
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.warn('Invalid response format from filestore');
        return [];
      }

      const result: FileStoreResponse<FileStoreWorkflow[]> = await response.json();
      if (result.success && Array.isArray(result.data)) {
        console.log('Loaded all workflows from filestore:', result.data);
        return result.data;
      }
      return [];
    } catch (err) {
      console.warn('Error loading workflows from filestore:', err);
      return [];
    }
  }

  /**
   * Delete a single workflow file from filestore
   * Can delete by workflowId (new approach) or by name/version (legacy)
   */
  async deleteWorkflow(workflowId: string, _version: number = 1): Promise<boolean> {
    try {
      // Use workflow ID as filename (new approach)
      // If it looks like an old filename with name_vX format, fall back to legacy approach
      let filename: string;
      if (workflowId.includes('_v') || workflowId.startsWith('workflows/')) {
        // Legacy approach: name-based filename
        filename = workflowId.startsWith('workflows/')
          ? workflowId
          : `workflows/${workflowId}.json`;
      } else {
        // New approach: ID-based filename
        filename = `workflows/${workflowId}.json`;
      }

      const response = await fetch(`${this.baseUrl}/filestore/delete-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      if (!response.ok) {
        console.warn(
          `Failed to delete workflow ${workflowId} from filestore:`,
          response.statusText
        );
        return false;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        return false;
      }

      const result: FileStoreResponse<void> = await response.json();
      if (result.success) {
        console.log(`Successfully deleted workflow ${workflowId} from filestore`);
        return true;
      }
      return false;
    } catch (err) {
      console.warn(`Error deleting workflow ${workflowId} from filestore:`, err);
      return false;
    }
  }

  /**
   * Save workflows to filestore (legacy - kept for backward compatibility)
   * This now saves each workflow as an individual file
   */
  async saveWorkflows(workflows: FileStoreWorkflow[]): Promise<boolean> {
    try {
      let allSuccessful = true;
      for (const workflow of workflows) {
        const success = await this.saveWorkflow(workflow);
        if (!success) {
          allSuccessful = false;
          console.warn(`Failed to save workflow ${workflow.name}`);
        }
      }
      return allSuccessful;
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
