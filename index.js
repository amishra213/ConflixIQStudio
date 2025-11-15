require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

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
    console.log(`Conductor API URL: ${process.env.CONDUCTOR_SERVER_URL}`);
  });
}

startApolloServer();
