const axios = require('axios');
const GraphQLJSON = require('graphql-type-json');

const CONDUCTOR_SERVER_URL = process.env.VITE_CONDUCTOR_SERVER_URL;
const CONDUCTOR_API_KEY = process.env.VITE_CONDUCTOR_API_KEY;

if (!CONDUCTOR_SERVER_URL) {
  console.error('CONDUCTOR_SERVER_URL is not defined in .env');
  process.exit(1);
}

const conductorGraphQLClient = axios.create({
  baseURL: `${CONDUCTOR_SERVER_URL}/graphql`,
  headers: {
    'Content-Type': 'application/json',
    ...(CONDUCTOR_API_KEY && { 'X-API-Key': CONDUCTOR_API_KEY }),
  },
});

const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    async workflows(_, { limit, offset }) {
      const query = `
        query GetWorkflows($limit: Int, $offset: Int) {
          workflows(limit: $limit, offset: $offset) {
            name
            description
            version
            createTime
            updateTime
            ownerEmail
            timeoutSeconds
            tasks {
              name
              taskReferenceName
              type
            }
            # Custom attributes
            orgId
            workflowId
            effectiveDate
            endDate
            status
            restartable
            schemaVersion
            inputParameters
            outputParameters
          }
        }
      `;
      const response = await conductorGraphQLClient.post('/', { query, variables: { limit, offset } });
      return response.data.data.workflows;
    },
    async workflow(_, { name, version }) {
      const query = `
        query GetWorkflowByName($name: String!, $version: Int) {
          workflow(name: $name, version: $version) {
            name
            description
            version
            tasks {
              name
              taskReferenceName
              type
              inputParameters
              optional
            }
            inputParameters
            outputParameters
            timeoutSeconds
            restartable
            schemaVersion
            # Custom attributes
            orgId
            workflowId
            effectiveDate
            endDate
            status
          }
        }
      `;
      const response = await conductorGraphQLClient.post('/', { query, variables: { name, version } });
      return response.data.data.workflow;
    },
    async workflowExecutions(_, { workflowName, limit }) {
      const query = `
        query GetWorkflowExecutions($workflowName: String!, $limit: Int) {
          workflowExecutions(workflowName: $workflowName, limit: $limit) {
            workflowId
            workflowName
            status
            startTime
            endTime
            input
            output
            tasks {
              taskId
              taskType
              status
              startTime
              endTime
            }
          }
        }
      `;
      const response = await conductorGraphQLClient.post('/', { query, variables: { workflowName, limit } });
      return response.data.data.workflowExecutions;
    },
    async taskDefinitions() {
      const query = `
        query GetTaskDefinitions {
          taskDefinitions {
            name
            description
            retryCount
            timeoutSeconds
            inputKeys
            outputKeys
            responseTimeoutSeconds
            ownerEmail
            createdBy
            updatedBy
            createTime
            updateTime
          }
        }
      `;
      const response = await conductorGraphQLClient.post('/', { query });
      return response.data.data.taskDefinitions;
    },
    async searchWorkflows(_, { query, limit }) {
      const graphqlQuery = `
        query SearchWorkflows($query: String!, $limit: Int) {
          searchWorkflows(query: $query, limit: $limit) {
            workflowId
            workflowName
            version
            status
            startTime
            endTime
          }
        }
      `;
      const response = await conductorGraphQLClient.post('/', { query: graphqlQuery, variables: { query, limit } });
      return response.data.data.searchWorkflows;
    },
  },
  Mutation: {
    async createWorkflow(_, { workflow }) {
      const mutation = `
        mutation CreateWorkflow($workflow: WorkflowInput!) {
          createWorkflow(workflow: $workflow) {
            name
            version
          }
        }
      `;
      const response = await conductorGraphQLClient.post('/', { query: mutation, variables: { workflow } });
      return response.data.data.createWorkflow;
    },
    async updateWorkflow(_, { workflow }) {
      const mutation = `
        mutation UpdateWorkflow($workflow: WorkflowInput!) {
          updateWorkflow(workflow: $workflow) {
            name
            version
          }
        }
      `;
      const response = await conductorGraphQLClient.post('/', { query: mutation, variables: { workflow } });
      return response.data.data.updateWorkflow;
    },
    async startWorkflow(_, { name, version, input }) {
      const mutation = `
        mutation StartWorkflow($name: String!, $version: Int, $input: JSON) {
          startWorkflow(name: $name, version: $version, input: $input) {
            workflowId
          }
        }
      `;
      const response = await conductorGraphQLClient.post('/', { query: mutation, variables: { name, version, input } });
      return response.data.data.startWorkflow;
    },
    async terminateWorkflow(_, { workflowId, reason }) {
      const mutation = `
        mutation TerminateWorkflow($workflowId: String!, $reason: String) {
          terminateWorkflow(workflowId: $workflowId, reason: $reason) {
            success
          }
        }
      `;
      const response = await conductorGraphQLClient.post('/', { query: mutation, variables: { workflowId, reason } });
      return response.data.data.terminateWorkflow;
    },
    async restartWorkflow(_, { workflowId }) {
      const mutation = `
        mutation RestartWorkflow($workflowId: String!) {
          restartWorkflow(workflowId: $workflowId) {
            workflowId
          }
        }
      `;
      const response = await conductorGraphQLClient.post('/', { query: mutation, variables: { workflowId } });
      return response.data.data.restartWorkflow;
    },
    async pauseWorkflow(_, { workflowId }) {
      const mutation = `
        mutation PauseWorkflow($workflowId: String!) {
          pauseWorkflow(workflowId: $workflowId) {
            success
          }
        }
      `;
      const response = await conductorGraphQLClient.post('/', { query: mutation, variables: { workflowId } });
      return response.data.data.pauseWorkflow;
    },
    async resumeWorkflow(_, { workflowId }) {
      const mutation = `
        mutation ResumeWorkflow($workflowId: String!) {
          resumeWorkflow(workflowId: $workflowId) {
            success
          }
        }
      `;
      const response = await conductorGraphQLClient.post('/', { query: mutation, variables: { workflowId } });
      return response.data.data.resumeWorkflow;
    },
    async registerTask(_, { task }) {
      const mutation = `
        mutation RegisterTask($task: TaskDefinitionInput!) {
          registerTask(task: $task) {
            name
          }
        }
      `;
      const response = await conductorGraphQLClient.post('/', { query: mutation, variables: { task } });
      return response.data.data.registerTask;
    },
  },
};

module.exports = resolvers;
