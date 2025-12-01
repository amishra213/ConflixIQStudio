import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import typeDefs from './schema.js';
import { resolvers, updateConductorConfig } from './resolvers.js';
import { fileStoreRoutes } from './fileStoreServer.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Serve static files from dist directory (built React app)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Configuration endpoint - allows dynamic configuration updates
app.post('/api/config', (req, res) => {
  const { conductorServerUrl, conductorApiKey } = req.body;

  if (!conductorServerUrl) {
    return res.status(400).json({ error: 'conductorServerUrl is required' });
  }

  try {
    updateConductorConfig(conductorServerUrl, conductorApiKey);
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: {
        conductorServerUrl,
        hasApiKey: !!conductorApiKey,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    proxyEndpoint: `/graphql`,
  });
});

// REST proxy endpoints for Conductor API
// Proxy GET /api/metadata/taskdefs to Conductor server
app.get('/api/metadata/taskdefs', async (req, res) => {
  try {
    const axios = await import('axios').then(m => m.default);
    
    // Get Conductor config from environment or stored config
    const conductorServerUrl = process.env.VITE_CONDUCTOR_SERVER_URL || 'http://localhost:8080';
    const conductorApiKey = process.env.VITE_CONDUCTOR_API_KEY || '';
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (conductorApiKey) {
      headers['X-Conductor-API-Key'] = conductorApiKey;
    }
    
    // Forward request to Conductor server
    const response = await axios.get(`${conductorServerUrl}/api/metadata/taskdefs`, { headers });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching task definitions from Conductor:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch task definitions',
      message: error.message,
    });
  }
});

// Proxy GET /api/metadata/workflow to Conductor server
app.get('/api/metadata/workflow', async (req, res) => {
  try {
    const axios = await import('axios').then(m => m.default);
    
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
    const queryString = Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query).toString()}` : '';
    const response = await axios.get(`${conductorServerUrl}/api/metadata/workflow${queryString}`, { headers });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching workflows from Conductor:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch workflows',
      message: error.message,
    });
  }
});

// Register filestore routes
fileStoreRoutes(app);

// SPA fallback - serve index.html for all unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true, // Enable introspection for tools like Apollo Sandbox
  });

  await server.start();
  
  app.use('/graphql', expressMiddleware(server));

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`🚀 GraphQL proxy server ready at http://localhost:${PORT}/graphql`);
    console.log(`📁 FileStore API ready at http://localhost:${PORT}/api/filestore`);
    console.log(`⚙️  Configuration API ready at http://localhost:${PORT}/api/config`);
    console.log(`💚 Health check ready at http://localhost:${PORT}/api/health`);
    console.log(`Conductor Server URL: ${process.env.VITE_CONDUCTOR_SERVER_URL || 'http://localhost:8080'}`);
  });
}

await startApolloServer();
