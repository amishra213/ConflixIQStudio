import axios from 'axios';
import GraphQLJSON from 'graphql-type-json';

// Global configuration that can be updated at runtime
let conductorConfig = {
  serverUrl: process.env.VITE_CONDUCTOR_SERVER_URL || 'http://localhost:8080',
  apiKey: process.env.VITE_CONDUCTOR_API_KEY || '',
};

// Function to create a new client with current config
function createConductorClient() {
  return axios.create({
    baseURL: `${conductorConfig.serverUrl}/graphql`,
    headers: {
      'Content-Type': 'application/json',
      ...(conductorConfig.apiKey && { 'X-API-Key': conductorConfig.apiKey }),
    },
    validateStatus: () => true, // Don't throw on any status code
  });
}

// Function to update the global configuration
function updateConductorConfig(serverUrl, apiKey) {
  if (serverUrl) {
    conductorConfig.serverUrl = serverUrl;
  }
  if (apiKey !== undefined) {
    conductorConfig.apiKey = apiKey;
  }
  console.log(`Updated Conductor Config - URL: ${conductorConfig.serverUrl}, Has API Key: ${!!conductorConfig.apiKey}`);
}

const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    async workflows(_, { limit, offset }) {
      const client = createConductorClient();
      const query = `
        query GetWorkflows($limit: Int, $offset: Int) {
          workflows(limit: $limit, offset: $offset) {
            name
            description
            version
            createTime
            updateTime
            createdBy
            updatedBy
            ownerEmail
            ownerApp
            timeoutSeconds
            timeoutPolicy
            tasks {
              name
              taskReferenceName
              type
              description
              workflowTaskType
              inputParameters
              outputParameters
              optional
              asyncComplete
              retryCount
              startDelay
              rateLimited
              evaluatorType
              expression
              scriptExpression
              decisionCases
              defaultCase
              forkTasks
              joinOn
              defaultExclusiveJoinTask
              loopCondition
              loopOver
              dynamicForkTasksParam
              dynamicForkTasksInputParamName
              dynamicTaskNameParam
              sink
              subWorkflowParam
            }
            effectiveDate
            endDate
            status
            restartable
            schemaVersion
            inputParameters
            inputTemplate
            outputParameters
            accessPolicy
            failureWorkflow
            variables
            workflowStatusListenerEnabled
          }
        }
      `;
      const response = await client.post('/', { query, variables: { limit, offset } });
      return response.data?.data?.workflows || [];
    },
    async workflow(_, { name, version }) {
      const client = createConductorClient();
      const query = `
        query GetWorkflowByName($name: String!, $version: Int) {
          workflow(name: $name, version: $version) {
            name
            description
            version
            createTime
            updateTime
            createdBy
            updatedBy
            ownerEmail
            ownerApp
            timeoutSeconds
            timeoutPolicy
            tasks {
              name
              taskReferenceName
              type
              description
              workflowTaskType
              inputParameters
              outputParameters
              optional
              asyncComplete
              retryCount
              startDelay
              rateLimited
              evaluatorType
              expression
              scriptExpression
              decisionCases
              defaultCase
              forkTasks
              joinOn
              defaultExclusiveJoinTask
              loopCondition
              loopOver
              dynamicForkTasksParam
              dynamicForkTasksInputParamName
              dynamicTaskNameParam
              sink
              subWorkflowParam
            }
            inputParameters
            inputTemplate
            outputParameters
            effectiveDate
            endDate
            status
            restartable
            schemaVersion
            accessPolicy
            failureWorkflow
            variables
            workflowStatusListenerEnabled
          }
        }
      `;
      const response = await client.post('/', { query, variables: { name, version } });
      return response.data?.data?.workflow || null;
    },
    async workflowExecutions(_, { workflowName, limit }) {
      const client = createConductorClient();
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
      const response = await client.post('/', { query, variables: { workflowName, limit } });
      return response.data?.data?.workflowExecutions || [];
    },
    async taskDefinitions() {
      const client = createConductorClient();
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
      const response = await client.post('/', { query });
      return response.data?.data?.taskDefinitions || [];
    },
    async searchWorkflows(_, { query, limit }) {
      const client = createConductorClient();
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
      const response = await client.post('/', { query: graphqlQuery, variables: { query, limit } });
      return response.data?.data?.searchWorkflows || [];
    },
  },
  Mutation: {
    async createWorkflow(_, { workflow }) {
      const client = createConductorClient();
      const mutation = `
        mutation CreateWorkflow($workflow: WorkflowInput!) {
          createWorkflow(workflow: $workflow) {
            name
            version
          }
        }
      `;
      const response = await client.post('/', { query: mutation, variables: { workflow } });
      return response.data?.data?.createWorkflow || null;
    },
    async updateWorkflow(_, { workflow }) {
      const client = createConductorClient();
      const mutation = `
        mutation UpdateWorkflow($workflow: WorkflowInput!) {
          updateWorkflow(workflow: $workflow) {
            name
            version
          }
        }
      `;
      const response = await client.post('/', { query: mutation, variables: { workflow } });
      return response.data?.data?.updateWorkflow || null;
    },
    async saveWorkflow(_, { workflow }) {
      // Use REST PUT endpoint for workflow save (create or update)
      // The Conductor API expects workflows in an array format
      // This maps to: PUT /api/metadata/workflow
      const client = axios.create({
        baseURL: conductorConfig.serverUrl,
        headers: {
          'Content-Type': 'application/json',
          ...(conductorConfig.apiKey && { 'X-API-Key': conductorConfig.apiKey }),
        },
        validateStatus: () => true, // Don't throw on any status code
      });
      
      try {
        // Wrap workflow in array as expected by Conductor backend
        const workflowArray = Array.isArray(workflow) ? workflow : [workflow];
        console.log('Sending workflow to Conductor:', JSON.stringify(workflowArray, null, 2));
        const response = await client.put('/api/metadata/workflow', workflowArray);
        
        if (response.status >= 200 && response.status < 300) {
          // Success - return name and version (or try to extract from response)
          return {
            name: workflow.name || (Array.isArray(workflow) ? workflow[0]?.name : 'unknown'),
            version: workflow.version || (Array.isArray(workflow) ? workflow[0]?.version : 1) || 1,
          };
        } else {
          // Error response - log the actual error from Conductor
          console.error('Conductor returned error:', response.status, response.statusText, response.data);
          throw new Error(`Failed to save workflow: ${response.status} ${response.statusText}. Details: ${JSON.stringify(response.data)}`);
        }
      } catch (error) {
        console.error('Error saving workflow:', error);
        throw error;
      }
    },
    async startWorkflow(_, { name, version, input }) {
      const client = createConductorClient();
      const mutation = `
        mutation StartWorkflow($name: String!, $version: Int, $input: JSON) {
          startWorkflow(name: $name, version: $version, input: $input) {
            workflowId
          }
        }
      `;
      const response = await client.post('/', { query: mutation, variables: { name, version, input } });
      return response.data?.data?.startWorkflow || null;
    },
    async terminateWorkflow(_, { workflowId, reason }) {
      const client = createConductorClient();
      const mutation = `
        mutation TerminateWorkflow($workflowId: String!, $reason: String) {
          terminateWorkflow(workflowId: $workflowId, reason: $reason) {
            success
          }
        }
      `;
      const response = await client.post('/', { query: mutation, variables: { workflowId, reason } });
      return response.data?.data?.terminateWorkflow || null;
    },
    async restartWorkflow(_, { workflowId }) {
      const client = createConductorClient();
      const mutation = `
        mutation RestartWorkflow($workflowId: String!) {
          restartWorkflow(workflowId: $workflowId) {
            workflowId
          }
        }
      `;
      const response = await client.post('/', { query: mutation, variables: { workflowId } });
      return response.data?.data?.restartWorkflow || null;
    },
    async pauseWorkflow(_, { workflowId }) {
      const client = createConductorClient();
      const mutation = `
        mutation PauseWorkflow($workflowId: String!) {
          pauseWorkflow(workflowId: $workflowId) {
            success
          }
        }
      `;
      const response = await client.post('/', { query: mutation, variables: { workflowId } });
      return response.data?.data?.pauseWorkflow || null;
    },
    async resumeWorkflow(_, { workflowId }) {
      const client = createConductorClient();
      const mutation = `
        mutation ResumeWorkflow($workflowId: String!) {
          resumeWorkflow(workflowId: $workflowId) {
            success
          }
        }
      `;
      const response = await client.post('/', { query: mutation, variables: { workflowId } });
      return response.data?.data?.resumeWorkflow || null;
    },
    async registerTask(_, { task }) {
      // Use REST API endpoint for task registration
      const client = axios.create({
        baseURL: conductorConfig.serverUrl,
        headers: {
          'Content-Type': 'application/json',
          ...(conductorConfig.apiKey && { 'X-API-Key': conductorConfig.apiKey }),
        },
        validateStatus: () => true,
      });

      const response = await client.post('/api/metadata/taskdefs', [task]);
      
      if (!response.ok && response.status >= 400) {
        console.error('Failed to register task:', response.data);
        throw new Error(response.data?.message || `Failed to register task: ${response.statusText}`);
      }

      // Return the registered task info
      return {
        name: task.name,
        ...response.data,
      };
    },
  },
};

export { resolvers, updateConductorConfig };

