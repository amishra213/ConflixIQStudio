/**
 * FileStore Server - Backend API for persistent file-based caching
 * Handles GET, POST, and DELETE operations for task cache storage
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { serverLogger } from './server-logger.js';

// Default cache directory in project root
const CACHE_DIR = process.env.FILESTORE_CACHE_DIR || path.join(process.cwd(), '.filestore');

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    serverLogger.error('Error creating cache directory:', error);
  }
}

/**
 * Get full path for cache file
 */
function getCachePath(filename) {
  return path.join(CACHE_DIR, filename);
}

/**
 * Load cache from file
 */
async function loadCacheFromFile(filename) {
  try {
    const filePath = getCachePath(filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      serverLogger.info(`Cache file not found: ${filename}`);
      return null;
    }
    serverLogger.error('Error reading cache file:', error);
    throw error;
  }
}

/**
 * Save cache to file
 */
async function saveCacheToFile(filename, data) {
  try {
    await ensureCacheDir();
    const filePath = getCachePath(filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    serverLogger.info(`Cache saved to: ${filePath}`);
    return true;
  } catch (error) {
    serverLogger.error('Error writing cache file:', error);
    throw error;
  }
}

/**
 * Delete cache file
 */
async function deleteCacheFile(filename) {
  try {
    const filePath = getCachePath(filename);
    await fs.unlink(filePath);
    serverLogger.info(`Cache file deleted: ${filePath}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      serverLogger.info(`Cache file not found for deletion: ${filename}`);
      return true;
    }
    serverLogger.error('Error deleting cache file:', error);
    throw error;
  }
}

/**
 * Get cache file info
 */
async function getCacheFileInfo(filename) {
  try {
    const filePath = getCachePath(filename);
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      lastUpdate: stats.mtimeMs,
      created: stats.birthtimeMs,
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    serverLogger.error('Error getting file info:', error);
    throw error;
  }
}

/**
 * Express middleware/route handlers for filestore operations
 */
const fileStoreRoutes = (app) => {
  // Initialize cache directory on startup
  serverLogger.debug('📁 Initializing FileStore cache directory...');
  ensureCacheDir().then(() => {
    serverLogger.debug(`✓ FileStore initialized at: ${CACHE_DIR}`);
  });

  /**
   * GET /api/filestore/load - Load cache from filestore
   */
  app.get('/api/filestore/load', async (req, res) => {
    try {
      serverLogger.debug('📥 GET /api/filestore/load - Loading task cache');
      const data = await loadCacheFromFile('task-cache.json');
      if (data) {
        const itemCount = data.data?.length || 0;
        serverLogger.info(`✅ Task cache loaded successfully: ${itemCount} items`);
        res.json({ success: true, data });
      } else {
        serverLogger.debug('ℹ️  Task cache is empty, returning empty array');
        res.json({ success: true, data: [] });
      }
    } catch (error) {
      serverLogger.error('❌ Error in /api/filestore/load:', error.message);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error loading cache',
      });
    }
  });

  /**
   * GET /api/filestore/load-workflows - Load workflows from filestore
   */
  app.get('/api/filestore/load-workflows', async (req, res) => {
    try {
      serverLogger.debug('📥 GET /api/filestore/load-workflows - Loading workflows cache');
      const data = await loadCacheFromFile('workflows-cache.json');
      if (data && data.workflows && Array.isArray(data.workflows)) {
        serverLogger.info(`✅ Workflows cache loaded: ${data.workflows.length} workflows`);
        res.json({ success: true, data: data.workflows });
      } else if (data && Array.isArray(data)) {
        // Handle legacy format
        serverLogger.info(`✅ Workflows cache loaded (legacy format): ${data.length} workflows`);
        res.json({ success: true, data });
      } else {
        serverLogger.debug('ℹ️  Workflows cache is empty, returning empty array');
        res.json({ success: true, data: [] });
      }
    } catch (error) {
      serverLogger.error('Error in /api/filestore/load-workflows:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error loading workflows',
      });
    }
  });

  /**
   * POST /api/filestore/save - Save cache to filestore
   */
  app.post('/api/filestore/save', async (req, res) => {
    try {
      const { key, data, timestamp } = req.body;

      if (!key || !Array.isArray(data)) {
        serverLogger.warn('POST /api/filestore/save - Invalid request: missing key or data');
        res.status(400).json({
          success: false,
          error: 'Missing required fields: key (string), data (array)',
        });
        return;
      }

      const cacheData = {
        timestamp: timestamp || Date.now(),
        data,
      };

      serverLogger.debug(
        `💾 Saving cache - Key: ${key}, Items: ${data.length}`
      );
      await saveCacheToFile(key, cacheData);
      serverLogger.info(`✅ Cache saved successfully: ${key} (${data.length} items)`);
      res.json({ success: true });
    } catch (error) {
      serverLogger.error('❌ Error saving cache:', error.message);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error saving cache',
      });
    }
  });

  /**
   * POST /api/filestore/save-workflows - Save workflows to filestore
   */
  app.post('/api/filestore/save-workflows', async (req, res) => {
    try {
      const { workflows, timestamp } = req.body;

      if (!Array.isArray(workflows)) {
        serverLogger.warn(
          '⚠️  Invalid request: workflows not an array'
        );
        res.status(400).json({
          success: false,
          error: 'Missing required field: workflows (array)',
        });
        return;
      }

      const workflowData = {
        timestamp: timestamp || Date.now(),
        workflows,
      };

      serverLogger.debug(
        `💾 Saving workflows - Count: ${workflows.length}`
      );
      await saveCacheToFile('workflows-cache.json', workflowData);
      serverLogger.info(`✅ Workflows saved successfully: ${workflows.length} workflows`);
      res.json({ success: true });
    } catch (error) {
      serverLogger.error('❌ Error saving workflows:', error.message);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error saving workflows',
      });
    }
  });

  /**
   * POST /api/filestore/clear - Clear/delete cache file
   */
  app.post('/api/filestore/clear', async (req, res) => {
    try {
      const { key } = req.body;

      if (!key) {
        serverLogger.warn('⚠️  Invalid request: missing cache key');
        res.status(400).json({
          success: false,
          error: 'Missing required field: key',
        });
        return;
      }

      serverLogger.debug(`🗑️  Clearing cache - Key: ${key}`);
      await deleteCacheFile(key);
      serverLogger.info(`✅ Cache cleared successfully: ${key}`);
      res.json({ success: true });
    } catch (error) {
      serverLogger.error('❌ Error clearing cache:', error.message);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error clearing cache',
      });
    }
  });

  /**
   * GET /api/filestore/info - Get cache file info/metadata
   */
  app.get('/api/filestore/info', async (req, res) => {
    try {
      serverLogger.debug('📊 Retrieving cache file info');
      const info = await getCacheFileInfo('task-cache.json');
      if (info) {
        serverLogger.debug(`✓ Cache file info retrieved - Size: ${info.size} bytes, Modified: ${new Date(info.mtimeMs).toLocaleString()}`);
        res.json({ success: true, data: info });
      } else {
        serverLogger.debug('ℹ️  Cache file does not exist');
        res.json({ success: true, data: { size: 0, lastUpdate: null, created: null } });
      }
    } catch (error) {
      serverLogger.error('Error in /api/filestore/info:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting cache info',
      });
    }
  });

  /**
   * POST /api/filestore/save-workflow - Save individual workflow file
   * Creates file in workflows/ subdirectory if it doesn't exist
   */
  app.post('/api/filestore/save-workflow', async (req, res) => {
    try {
      const { filename, data, timestamp } = req.body;

      if (!filename || !data) {
        serverLogger.warn(
          'POST /api/filestore/save-workflow - Invalid request: missing filename or data'
        );
        res.status(400).json({
          success: false,
          error: 'Missing required fields: filename (string), data (object)',
        });
        return;
      }

      // Ensure workflows directory exists
      const workflowsDir = path.join(CACHE_DIR, 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });

      // Save workflow file
      const filePath = path.join(CACHE_DIR, filename);
      const cacheData = {
        timestamp: timestamp || Date.now(),
        ...data,
      };
      serverLogger.debug(`POST /api/filestore/save-workflow - Saving workflow: ${filename}`);
      await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2), 'utf8');
      serverLogger.info(`✓ Workflow saved: ${filename}`);
      res.json({ success: true });
    } catch (error) {
      serverLogger.error('Error in /api/filestore/save-workflow:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error saving workflow',
      });
    }
  });

  /**
   * GET /api/filestore/load-workflows-batch - Load all workflows from workflows/ directory
   */
  app.get('/api/filestore/load-workflows-batch', async (req, res) => {
    try {
      const workflowsDir = path.join(CACHE_DIR, 'workflows');
      const workflows = [];

      serverLogger.debug('GET /api/filestore/load-workflows-batch - Loading all workflows');
      try {
        // Read all files in workflows directory
        const files = await fs.readdir(workflowsDir);

        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(workflowsDir, file);
            const data = await fs.readFile(filePath, 'utf8');
            const workflow = JSON.parse(data);
            workflows.push(workflow);
          }
        }
        serverLogger.debug(`✓ Loaded ${workflows.length} workflows from batch`);
      } catch (err) {
        // Directory doesn't exist yet - return empty array
        if (err.code !== 'ENOENT') {
          throw err;
        }
        serverLogger.debug('Workflows batch directory does not exist, returning empty array');
      }

      res.json({ success: true, data: workflows });
    } catch (error) {
      serverLogger.error('Error in /api/filestore/load-workflows-batch:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error loading workflows',
      });
    }
  });

  /**
   * POST /api/filestore/delete-workflow - Delete individual workflow file
   */
  app.post('/api/filestore/delete-workflow', async (req, res) => {
    try {
      const { filename } = req.body;

      if (!filename) {
        serverLogger.warn(
          'POST /api/filestore/delete-workflow - Invalid request: missing filename'
        );
        res.status(400).json({
          success: false,
          error: 'Missing required field: filename',
        });
        return;
      }

      const filePath = path.join(CACHE_DIR, filename);
      serverLogger.debug(`POST /api/filestore/delete-workflow - Deleting workflow: ${filename}`);
      try {
        await fs.unlink(filePath);
        serverLogger.info(`✓ Workflow deleted: ${filename}`);
      } catch (err) {
        // File doesn't exist - treat as success
        if (err.code !== 'ENOENT') {
          throw err;
        }
        serverLogger.debug(`Workflow not found (already deleted): ${filename}`);
      }

      res.json({ success: true });
    } catch (error) {
      serverLogger.error('Error in /api/filestore/delete-workflow:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error deleting workflow',
      });
    }
  });
};

export { fileStoreRoutes, ensureCacheDir };
