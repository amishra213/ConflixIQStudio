require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const typeDefs = require('./schema');
const { resolvers, updateConductorConfig } = require('./resolvers');
const { fileStoreRoutes } = require('./fileStoreServer');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

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

// Register filestore routes
fileStoreRoutes(app);

async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true, // Enable introspection for tools like Apollo Sandbox
  });

  await server.start();
  
  app.use('/graphql', expressMiddleware(server));

  app.listen(PORT, () => {
    console.log(`🚀 GraphQL proxy server ready at http://localhost:${PORT}/graphql`);
    console.log(`📁 FileStore API ready at http://localhost:${PORT}/api/filestore`);
    console.log(`⚙️  Configuration API ready at http://localhost:${PORT}/api/config`);
    console.log(`💚 Health check ready at http://localhost:${PORT}/api/health`);
    console.log(`Conductor Server URL: ${process.env.VITE_CONDUCTOR_SERVER_URL || 'http://localhost:8080'}`);
  });
}

await startApolloServer();
