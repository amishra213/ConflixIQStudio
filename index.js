import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import open from 'open';
import typeDefs from './schema.js';
import { resolvers, updateConductorConfig } from './resolvers.js';
import { fileStoreRoutes } from './fileStoreServer.js';
import { serverLogger } from './server-logger.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// Log startup information
serverLogger.info('═══════════════════════════════════════════════════════════════');
serverLogger.info('           🚀 ConflixIQ Studio Server Starting');
serverLogger.info('═══════════════════════════════════════════════════════════════');
serverLogger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
serverLogger.info(`Working Directory: ${process.cwd()}`);
serverLogger.info(`Node Version: ${process.version}`);
serverLogger.debug(`Logger Configuration:`, serverLogger.getStats());

// Enable CORS for all origins
serverLogger.debug('🔌 Setting up Express middleware...');
app.use(cors());
app.use(express.json());
serverLogger.debug('✓ CORS enabled for all origins');
serverLogger.debug('✓ JSON parser middleware enabled');

// Serve static files from distribution directory (built React app) - only in production
const isDev = process.env.NODE_ENV !== 'production';
const distPath = path.join(__dirname, 'distribution');

serverLogger.debug(`🔍 NODE_ENV check: NODE_ENV='${process.env.NODE_ENV}'`);
serverLogger.debug(`🔍 isDev value: ${isDev}`);

if (isDev === false) {
  serverLogger.debug(`📁 Serving static files from: ${distPath}`);
  app.use(express.static(distPath));
  serverLogger.debug('✓ Static file serving configured');
} else {
  serverLogger.debug('📁 Development mode: React app served by Vite on port 5173');
}

// Configuration endpoint - allows dynamic configuration updates
app.post('/api/config', (req, res) => {
  serverLogger.debug('📤 Configuration update request received');
  const { conductorServerUrl, conductorApiKey } = req.body;

  if (!conductorServerUrl) {
    serverLogger.warn('❌ Configuration failed: missing conductorServerUrl');
    return res.status(400).json({ error: 'conductorServerUrl is required' });
  }

  try {
    serverLogger.debug(`Validating conductor server URL: ${conductorServerUrl}`);
    updateConductorConfig(conductorServerUrl, conductorApiKey);
    serverLogger.info(`✅ Configuration updated: ${conductorServerUrl}`);
    if (conductorApiKey) {
      serverLogger.debug('✓ API key configured');
    }
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: {
        conductorServerUrl,
        hasApiKey: !!conductorApiKey,
      },
    });
  } catch (error) {
    serverLogger.error('❌ Configuration error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  serverLogger.debug('🏥 Health check endpoint accessed');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    proxyEndpoint: `/graphql`,
  });
});

// REST proxy endpoints for Conductor API
// Proxy GET /api/metadata/taskdefs to Conductor server
app.get('/api/metadata/taskdefs', async (req, res) => {
  serverLogger.debug('📋 Task definitions request received');
  try {
    const axios = await import('axios').then((m) => m.default);

    // Get Conductor config from environment or stored config
    const conductorServerUrl = process.env.VITE_CONDUCTOR_SERVER_URL || 'http://localhost:8080';
    const conductorApiKey = process.env.VITE_CONDUCTOR_API_KEY || '';

    const headers = {
      'Content-Type': 'application/json',
    };

    if (conductorApiKey) {
      headers['X-Conductor-API-Key'] = conductorApiKey;
    }

    serverLogger.debug(`🔗 Fetching task definitions from ${conductorServerUrl}/api/metadata/taskdefs`);

    // Forward request to Conductor server
    const response = await axios.get(`${conductorServerUrl}/api/metadata/taskdefs`, { headers });

    const count = response.data?.length || 0;
    serverLogger.info(`✅ Successfully fetched ${count} task definitions from Conductor`);
    serverLogger.debug(`Response size: ${JSON.stringify(response.data).length} bytes`);
    res.json(response.data);
  } catch (error) {
    serverLogger.error('❌ Error fetching task definitions from Conductor:', error.message);
    serverLogger.debug(`Error details:`, error.response?.status, error.response?.statusText);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch task definitions',
      message: error.message,
    });
  }
});

// Proxy GET /api/metadata/workflow to Conductor server
app.get('/api/metadata/workflow', async (req, res) => {
  serverLogger.debug('📊 Workflow metadata request received');
  try {
    const axios = await import('axios').then((m) => m.default);

    // Get Conductor config from environment or stored config
    const conductorServerUrl = process.env.VITE_CONDUCTOR_SERVER_URL || 'http://localhost:8080';
    const conductorApiKey = process.env.VITE_CONDUCTOR_API_KEY || '';

    const headers = {
      'Content-Type': 'application/json',
    };

    if (conductorApiKey) {
      headers['X-Conductor-API-Key'] = conductorApiKey;
    }

    // Forward request to Conductor server (with query parameters if any)
    const queryString =
      Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query).toString()}` : '';
    serverLogger.debug(
      `🔗 Fetching workflows from ${conductorServerUrl}/api/metadata/workflow${queryString}`
    );
    const response = await axios.get(`${conductorServerUrl}/api/metadata/workflow${queryString}`, {
      headers,
    });

    const count = response.data?.length || 0;
    serverLogger.info(`✅ Successfully fetched ${count} workflows from Conductor`);
    serverLogger.debug(`Response size: ${JSON.stringify(response.data).length} bytes`);
    res.json(response.data);
  } catch (error) {
    serverLogger.error('❌ Error fetching workflows from Conductor:', error.message);
    serverLogger.debug(`Error details:`, error.response?.status, error.response?.statusText);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch workflows',
      message: error.message,
    });
  }
});

// Proxy GET /api/metadata/workflow/:name to Conductor server - get specific workflow definition
app.get('/api/metadata/workflow/:name', async (req, res) => {
  serverLogger.debug(`📄 Workflow definition request received for: ${req.params.name}`);
  try {
    const axios = await import('axios').then((m) => m.default);

    // Get Conductor config from environment or stored config
    const conductorServerUrl = process.env.VITE_CONDUCTOR_SERVER_URL || 'http://localhost:8080';
    const conductorApiKey = process.env.VITE_CONDUCTOR_API_KEY || '';

    const headers = {
      'Content-Type': 'application/json',
    };

    if (conductorApiKey) {
      headers['X-Conductor-API-Key'] = conductorApiKey;
    }

    // Build URL with version parameter if provided
    const version = req.query.version ? `?version=${req.query.version}` : '';
    const workflowUrl = `${conductorServerUrl}/api/metadata/workflow/${req.params.name}${version}`;
    
    serverLogger.debug(`🔗 Fetching workflow definition from ${workflowUrl}`);
    const response = await axios.get(workflowUrl, { headers });

    serverLogger.info(
      `✅ Successfully fetched workflow definition: ${req.params.name}${req.query.version ? ` v${req.query.version}` : ''}`
    );
    serverLogger.debug(`Response size: ${JSON.stringify(response.data).length} bytes`);
    res.json(response.data);
  } catch (error) {
    serverLogger.error(
      `❌ Error fetching workflow definition for ${req.params.name}:`,
      error.message
    );
    serverLogger.debug(`Error details:`, error.response?.status, error.response?.statusText);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch workflow definition',
      message: error.message,
      workflowName: req.params.name,
    });
  }
});

// Proxy GET /api/workflow/search to Conductor server - lightweight execution summaries
app.get('/api/workflow/search', async (req, res) => {
  serverLogger.debug('🔍 Workflow search request received');
  try {
    const axios = await import('axios').then((m) => m.default);

    // Get Conductor config from environment or stored config
    const conductorServerUrl = process.env.VITE_CONDUCTOR_SERVER_URL || 'http://localhost:8080';
    const conductorApiKey = process.env.VITE_CONDUCTOR_API_KEY || '';

    const headers = {
      'Content-Type': 'application/json',
    };

    if (conductorApiKey) {
      headers['X-Conductor-API-Key'] = conductorApiKey;
    }

    // Build query parameters
    const queryString =
      Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query).toString()}` : '';
    
    serverLogger.debug(
      `🔗 Fetching workflow executions from ${conductorServerUrl}/api/workflow/search${queryString}`
    );

    // Forward request to Conductor server
    const response = await axios.get(`${conductorServerUrl}/api/workflow/search${queryString}`, {
      headers,
    });

    const count = response.data?.results?.length || 0;
    serverLogger.info(`✅ Successfully fetched ${count} workflow executions from Conductor`);
    serverLogger.debug(`Response size: ${JSON.stringify(response.data).length} bytes`);
    res.json(response.data);
  } catch (error) {
    serverLogger.error('❌ Error fetching workflow executions from Conductor:', error.message);
    serverLogger.debug(`Error details:`, error.response?.status, error.response?.statusText);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch workflow executions',
      message: error.message,
      statusCode: error.response?.status,
      statusText: error.response?.statusText,
    });
  }
});

// Proxy GET /api/workflow/search-v2/:workflowId to Conductor server - detailed execution with task payloads
app.get('/api/workflow/search-v2/:workflowId', async (req, res) => {
  serverLogger.debug(`🔍 Workflow execution details request received for ID: ${req.params.workflowId}`);
  try {
    const axios = await import('axios').then((m) => m.default);

    // Get Conductor config from environment or stored config
    const conductorServerUrl = process.env.VITE_CONDUCTOR_SERVER_URL || 'http://localhost:8080';
    const conductorApiKey = process.env.VITE_CONDUCTOR_API_KEY || '';

    const headers = {
      'Content-Type': 'application/json',
    };

    if (conductorApiKey) {
      headers['X-Conductor-API-Key'] = conductorApiKey;
    }

    const { workflowId } = req.params;
    
    serverLogger.debug(
      `🔗 Fetching detailed workflow execution from ${conductorServerUrl}/api/workflow/${workflowId}`
    );

    // Forward request to Conductor server
    // Note: Conductor's /api/workflow/{id} endpoint returns detailed execution data
    const response = await axios.get(`${conductorServerUrl}/api/workflow/${workflowId}`, {
      headers,
    });

    serverLogger.info(`✅ Successfully fetched detailed execution for workflow ${workflowId}`);
    serverLogger.debug(`Response size: ${JSON.stringify(response.data).length} bytes`);
    res.json(response.data);
  } catch (error) {
    serverLogger.error(
      `❌ Error fetching detailed workflow execution for ${req.params.workflowId}:`,
      error.message
    );
    serverLogger.debug(`Error details:`, error.response?.status, error.response?.statusText);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch workflow execution details',
      message: error.message,
      statusCode: error.response?.status,
      statusText: error.response?.statusText,
      workflowId: req.params.workflowId,
    });
  }
});

// Register filestore routes
fileStoreRoutes(app);

// SPA fallback routes - handle all other routes
if (isDev === false) {
  // Production: serve index.html for all unmatched routes
  serverLogger.debug('Configuring production mode static file serving');
  app.get('*', (req, res) => {
    // Don't serve API routes from the SPA fallback
    if (req.path.startsWith('/api') || req.path.startsWith('/graphql')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Development: serve development page with link to Vite
  serverLogger.debug('Development mode: Serving development page pointing to Vite on port 5173');
  
  // Catch-all route for development
  app.get('*', (req, res) => {
    // Skip API and graphql routes
    if (req.path.startsWith('/api') || req.path.startsWith('/graphql')) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    serverLogger.debug(`Development request for ${req.path} - redirecting to Vite`);
    
    // Redirect to Vite dev server
    res.redirect(`http://localhost:5173${req.path}`);
  });
}

async function startApolloServer() {
  serverLogger.info('⚙️  Initializing Apollo Server...');
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true, // Enable introspection for tools like Apollo Sandbox
  });

  serverLogger.debug('🔄 Starting Apollo Server...');
  await server.start();
  serverLogger.debug('✓ Apollo Server started successfully');

  serverLogger.debug('📡 Mounting GraphQL middleware at /graphql');
  app.use('/graphql', expressMiddleware(server));
  serverLogger.debug('✓ GraphQL middleware mounted');

  serverLogger.debug(`🌐 Starting HTTP server on port ${PORT}...`);
  app.listen(PORT, () => {
    const appUrl = `http://localhost:${PORT}`;
    const graphqlUrl = `http://localhost:${PORT}/graphql`;

    // Print beautiful startup banner
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║              🎉  SERVER STARTED SUCCESSFULLY  🎉               ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n');
    console.log('📍  Application Details:');
    console.log('───────────────────────────────────────────────────────────────');

    serverLogger.info(`✅ Server running at ${appUrl}`);
    serverLogger.info(`✅ GraphQL proxy server ready at ${graphqlUrl}`);
    serverLogger.info(`✅ FileStore API ready at ${appUrl}/api/filestore`);
    serverLogger.info(`✅ Configuration API ready at ${appUrl}/api/config`);
    serverLogger.info(`✅ Health check ready at ${appUrl}/api/health`);
    serverLogger.info('');
    serverLogger.info('🔧 Configuration:');
    serverLogger.info('───────────────────────────────────────────────────────────────');
    serverLogger.info(
      `   Conductor Server: ${process.env.VITE_CONDUCTOR_SERVER_URL || 'http://localhost:8080'}`
    );
    serverLogger.info(`   Port: ${PORT}`);
    serverLogger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    serverLogger.info(`   Log Level: ${process.env.LOG_LEVEL || 'INFO'}`);
    serverLogger.info('');
    serverLogger.info('📂 File Storage:');
    serverLogger.info('───────────────────────────────────────────────────────────────');
    serverLogger.info(`   Data Directory: ${process.cwd()}/.filestore`);
    serverLogger.info(`   Logs Directory: ${process.cwd()}/logs`);
    console.log('\n');
    
    // In dev mode, open Vite dev server; in production, open Express server
    const browserUrl = isDev ? 'http://localhost:5173' : appUrl;
    console.log('🌐 Opening browser at:', browserUrl);
    console.log('\n');

    // Open browser automatically
    open(browserUrl).catch((err) => {
      serverLogger.warn(`⚠️  Could not open browser automatically: ${err.message}`);
      serverLogger.info(`Please open your browser and navigate to ${browserUrl}`);
    });
  });
}

serverLogger.info('🔄 Starting application startup sequence...');
await startApolloServer();
