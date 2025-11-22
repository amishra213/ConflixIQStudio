/**
 * FileStore Server - Backend API for persistent file-based caching
 * Handles GET, POST, and DELETE operations for task cache storage
 */

import fs from 'node:fs/promises';
import path from 'node:path';

// Default cache directory in project root
const CACHE_DIR = process.env.FILESTORE_CACHE_DIR || path.join(process.cwd(), '.filestore');

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating cache directory:', error);
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
      console.log(`Cache file not found: ${filename}`);
      return null;
    }
    console.error('Error reading cache file:', error);
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
    console.log(`Cache saved to: ${filePath}`);
    return true;
  } catch (error) {
    console.error('Error writing cache file:', error);
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
    console.log(`Cache file deleted: ${filePath}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`Cache file not found for deletion: ${filename}`);
      return true;
    }
    console.error('Error deleting cache file:', error);
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
    console.error('Error getting file info:', error);
    throw error;
  }
}

/**
 * Express middleware/route handlers for filestore operations
 */
const fileStoreRoutes = (app) => {
  // Initialize cache directory on startup
  ensureCacheDir();

  /**
   * GET /api/filestore/load - Load cache from filestore
   */
  app.get('/api/filestore/load', async (req, res) => {
    try {
      const data = await loadCacheFromFile('task-cache.json');
      if (data) {
        res.json({ success: true, data });
      } else {
        res.json({ success: true, data: [] });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error loading cache' 
      });
    }
  });

  /**
   * GET /api/filestore/load-workflows - Load workflows from filestore
   */
  app.get('/api/filestore/load-workflows', async (req, res) => {
    try {
      const data = await loadCacheFromFile('workflows-cache.json');
      if (data && data.workflows && Array.isArray(data.workflows)) {
        res.json({ success: true, data: data.workflows });
      } else if (data && Array.isArray(data)) {
        // Handle legacy format
        res.json({ success: true, data });
      } else {
        res.json({ success: true, data: [] });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error loading workflows' 
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
        res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: key (string), data (array)' 
        });
        return;
      }

      const cacheData = {
        timestamp: timestamp || Date.now(),
        data,
      };

      await saveCacheToFile(key, cacheData);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error saving cache' 
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
        res.status(400).json({ 
          success: false, 
          error: 'Missing required field: workflows (array)' 
        });
        return;
      }

      const workflowData = {
        timestamp: timestamp || Date.now(),
        workflows,
      };

      await saveCacheToFile('workflows-cache.json', workflowData);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error saving workflows' 
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
        res.status(400).json({ 
          success: false, 
          error: 'Missing required field: key' 
        });
        return;
      }

      await deleteCacheFile(key);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error clearing cache' 
      });
    }
  });

  /**
   * GET /api/filestore/info - Get cache file info/metadata
   */
  app.get('/api/filestore/info', async (req, res) => {
    try {
      const info = await getCacheFileInfo('task-cache.json');
      if (info) {
        res.json({ success: true, data: info });
      } else {
        res.json({ success: true, data: { size: 0, lastUpdate: null, created: null } });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error getting cache info' 
      });
    }
  });
};

export { fileStoreRoutes, ensureCacheDir };
