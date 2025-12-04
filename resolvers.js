import axios from 'axios';
import GraphQLJSON from 'graphql-type-json';
import { serverLogger } from './server-logger.js';

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
  serverLogger.info(
    `✓ Updated Conductor Config - URL: ${conductorConfig.serverUrl}, Has API Key: ${!!conductorConfig.apiKey}`
  );
}

// Helper function to extract error message from various response formats
function extractErrorMessage(data) {
  // Check for validation errors (Conductor REST API format)
  if (data?.validationErrors && Array.isArray(data.validationErrors)) {
    const validationErrors = data.validationErrors
      .map((err) => {
        if (typeof err === 'object' && err !== null) {
          // Extract message from validation error object
          return err.message || err.error || JSON.stringify(err);
        }
        return String(err);
      })
      .join('; ');
    return validationErrors || data.message || 'Validation failed';
  }

  if (data?.message) return data.message;
  if (Array.isArray(data?.errors)) return data.errors[0] || 'Unknown error';
  if (data?.errors) return String(data.errors);
  return null;
}

// Helper function to format and log errors properly
function handleErrorLogging(context, error, additionalInfo = {}) {
  const timestamp = new Date().toISOString();

  // Prepare error details for logging
  const errorDetails = {
    timestamp,
    context,
    message: error.message || 'Unknown error',
    code: error.code,
    status: error.response?.status || error.status,
    ...additionalInfo,
  };

  // Log stack trace if available
  if (error.stack) {
    errorDetails.stack = error.stack;
  }

  // Log axios-specific error details
  if (error.isAxiosError) {
    errorDetails.isAxiosError = true;
    errorDetails.config = {
      method: error.config?.method,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      data: error.config?.data,
    };

    // Log connection errors specifically
    if (error.code === 'ECONNREFUSED') {
      errorDetails.connectionError = true;
      errorDetails.address = error.errors?.[0]?.address || error.address;
      errorDetails.port = error.errors?.[0]?.port || error.port;
    }
  }

  // Write to log file using server logger
  serverLogger.error(`[${context}]`, JSON.stringify(errorDetails, null, 2));

  return errorDetails;
}

// Helper function to create user-friendly error messages
function createUserFriendlyError(error, _operation) {
  if (error.code === 'ECONNREFUSED') {
    return {
      message: `Conductor server is not available`,
      details: `Unable to connect to ${error.config?.baseURL || 'localhost:8080'}. The server may be offline or the URL may be incorrect.`,
      code: 'CONNECTION_ERROR',
      severity: 'medium', // Changed from 'critical' since this is expected when working offline
    };
  }

  if (error.response?.status >= 400) {
    const statusMessages = {
      400: 'Invalid workflow data',
      401: 'Authentication required',
      403: 'Permission denied',
      404: 'Resource not found',
      409: 'Resource conflict',
      500: 'Server internal error',
      503: 'Service unavailable',
    };

    // Extract detailed error message
    const responseData = error.response.data;
    let detailedError = extractErrorMessage(responseData) || error.message;

    // For validation errors, format them nicely
    if (responseData?.validationErrors && Array.isArray(responseData.validationErrors)) {
      const validationSummary = responseData.validationErrors
        .map((err, idx) => {
          if (typeof err === 'object' && err !== null) {
            return `${idx + 1}. ${err.message || err.error || JSON.stringify(err)}`;
          }
          return `${idx + 1}. ${String(err)}`;
        })
        .join('\n');
      detailedError = `Validation failed:\n${validationSummary}`;
    }

    return {
      message: statusMessages[error.response.status] || `Server error (${error.response.status})`,
      details: detailedError,
      code: `HTTP_${error.response.status}`,
      severity: error.response.status >= 500 ? 'high' : 'medium', // Reduced severity levels
    };
  }

  return {
    message: error.message || 'An unexpected error occurred',
    details: error.stack?.split('\n')[0] || 'No additional details available',
    code: error.code || 'UNKNOWN_ERROR',
    severity: 'medium', // Changed from 'high' for unknown errors
  };
}

const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    async workflows(_, { limit, offset }) {
      // Fetch from Conductor REST API instead of GraphQL (Conductor may not have GraphQL endpoint)
      try {
        const client = axios.create({
          baseURL: conductorConfig.serverUrl,
          headers: {
            'Content-Type': 'application/json',
            ...(conductorConfig.apiKey && { 'X-API-Key': conductorConfig.apiKey }),
          },
          validateStatus: () => true,
        });

        // Fetch all workflows from REST endpoint
        const response = await client.get('/api/metadata/workflow');

        if (response.status >= 400) {
          // Log error to file
          handleErrorLogging(
            'workflows',
            new Error(`Failed to fetch workflows: ${response.status}`),
            {
              status: response.status,
              statusText: response.statusText,
              responseData: response.data,
            }
          );

          serverLogger.error(
            '[Resolvers] Error fetching workflows from REST:',
            response.status,
            response.data
          );
          return [];
        }

        let allWorkflows = Array.isArray(response.data) ? response.data : [];

        // Apply pagination if needed
        if (offset !== undefined || limit !== undefined) {
          const start = offset || 0;
          const end = limit ? start + limit : undefined;
          allWorkflows = allWorkflows.slice(start, end);
        }

        serverLogger.info(
          `[Resolvers] Fetched ${allWorkflows.length} workflows from Conductor REST API`
        );
        return allWorkflows;
      } catch (error) {
        // Log detailed error to file
        handleErrorLogging('workflows', error, {
          serverUrl: conductorConfig.serverUrl,
          limit,
          offset,
        });

        serverLogger.error('[Resolvers] Error in workflows resolver:', error.message);
        return [];
      }
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

      // Check if GraphQL returned errors OR null workflow data
      const workflow = response.data?.data?.workflow;
      if (response.data?.errors || !workflow) {
        if (response.data?.errors) {
          serverLogger.warn(
            `[Resolvers] GraphQL error fetching workflow: ${response.data.errors[0]?.message}`
          );
        } else {
          serverLogger.info(`[Resolvers] GraphQL returned null workflow for ${name} v${version}`);
        }
        serverLogger.info(`[Resolvers] Falling back to REST API for workflow ${name} v${version}`);

        // Fallback to REST API
        try {
          const axios = await import('axios').then((m) => m.default);
          const headers = {
            'Content-Type': 'application/json',
          };

          if (conductorConfig.apiKey) {
            headers['X-Conductor-API-Key'] = conductorConfig.apiKey;
          }

          let restUrl = `${conductorConfig.serverUrl}/api/metadata/workflow/${name}`;
          if (version) {
            restUrl += `?version=${version}`;
          }

          const restResponse = await axios.get(restUrl, { headers });
          serverLogger.info(
            `[Resolvers] Successfully fetched workflow via REST fallback: ${name} v${version}`
          );
          return restResponse.data;
        } catch (restError) {
          // Log detailed error to file
          handleErrorLogging('workflow', restError, {
            workflowName: name,
            workflowVersion: version,
            serverUrl: conductorConfig.serverUrl,
          });

          serverLogger.error(`[Resolvers] REST fallback also failed: ${restError.message}`);
          return null;
        }
      }

      return workflow;
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
      // Fetch task definitions from REST API: GET /api/metadata/taskdefs
      try {
        const client = axios.create({
          baseURL: conductorConfig.serverUrl,
          headers: {
            'Content-Type': 'application/json',
            ...(conductorConfig.apiKey && { 'X-API-Key': conductorConfig.apiKey }),
          },
          validateStatus: () => true,
        });

        const response = await client.get('/api/metadata/taskdefs');

        if (response.status >= 400) {
          // Log error to file
          handleErrorLogging(
            'taskDefinitions',
            new Error(`Failed to fetch task definitions: ${response.status}`),
            {
              status: response.status,
              statusText: response.statusText,
              responseData: response.data,
            }
          );

          serverLogger.error('Failed to fetch task definitions:', response.status, response.data);
          throw new Error(`Failed to fetch task definitions: ${response.statusText}`);
        }

        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        // Log detailed error to file
        handleErrorLogging('taskDefinitions', error, {
          serverUrl: conductorConfig.serverUrl,
        });

        serverLogger.error('Error fetching task definitions:', error.message);
        throw error;
      }
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
      // Use REST POST endpoint for creating new workflows
      // This maps to: POST /api/metadata/workflow
      const client = axios.create({
        baseURL: conductorConfig.serverUrl,
        headers: {
          'Content-Type': 'application/json',
          ...(conductorConfig.apiKey && { 'X-API-Key': conductorConfig.apiKey }),
        },
        validateStatus: () => true, // Don't throw on any status code
      });

      try {
        // Normalize workflow to ensure all required fields are present
        const normalizedWorkflow = {
          name: workflow.name || 'Unnamed Workflow',
          version: workflow.version ?? 1,
          description: workflow.description || '',
          ...workflow,
          tasks: Array.isArray(workflow.tasks) ? workflow.tasks : [],
          inputParameters: Array.isArray(workflow.inputParameters) ? workflow.inputParameters : [],
          outputParameters: workflow.outputParameters || {},
          inputTemplate: workflow.inputTemplate || {},
          variables: workflow.variables || {},
          accessPolicy: workflow.accessPolicy || {},
          restartable: workflow.restartable ?? true,
          workflowStatusListenerEnabled: workflow.workflowStatusListenerEnabled ?? false,
          schemaVersion: workflow.schemaVersion || 2,
          timeoutSeconds: workflow.timeoutSeconds || 3600,
          timeoutPolicy: workflow.timeoutPolicy || 'TIME_OUT_WF',
        };

        // Wrap in array as required by Conductor backend
        const workflowArray = [normalizedWorkflow];

        serverLogger.info(
          '[Resolvers] Creating new workflow in Conductor (POST):',
          normalizedWorkflow.name,
          'v' + normalizedWorkflow.version
        );

        const response = await client.post('/api/metadata/workflow', workflowArray);

        if (response.status >= 200 && response.status < 300) {
          // Success - return name and version
          serverLogger.info(
            '[Resolvers] Workflow created successfully:',
            normalizedWorkflow.name,
            'v' + normalizedWorkflow.version
          );
          return {
            name: normalizedWorkflow.name,
            version: normalizedWorkflow.version || 1,
            success: true,
          };
        }

        // Error response - extract and log detailed error from Conductor
        const errorData = response.data;
        const errorMsg =
          extractErrorMessage(errorData) || `HTTP ${response.status}: ${response.statusText}`;

        // Log detailed error to file
        handleErrorLogging('createWorkflow', new Error(errorMsg), {
          status: response.status,
          statusText: response.statusText,
          workflowName: normalizedWorkflow.name,
          workflowVersion: normalizedWorkflow.version,
          responseData: errorData,
          requestBody: workflowArray,
        });

        const userError = createUserFriendlyError(
          {
            message: errorMsg,
            response: { status: response.status, data: errorData },
            config: { baseURL: conductorConfig.serverUrl },
          },
          'createWorkflow'
        );

        // Return error in response instead of throwing
        return {
          name: normalizedWorkflow.name,
          version: normalizedWorkflow.version || 1,
          success: false,
          error: userError.message,
          errorDetails: userError.details,
          errorCode: userError.code,
          errorSeverity: userError.severity,
        };
      } catch (error) {
        // Log the full error to file
        handleErrorLogging('createWorkflow', error, {
          workflowName: workflow.name,
          workflowVersion: workflow.version,
          serverUrl: conductorConfig.serverUrl,
        });

        const userError = createUserFriendlyError(error, 'createWorkflow');

        // Return error in response instead of throwing
        return {
          name: workflow.name || 'Unnamed Workflow',
          version: workflow.version || 1,
          success: false,
          error: userError.message,
          errorDetails: userError.details,
          errorCode: userError.code,
          errorSeverity: userError.severity,
        };
      }
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
      // Use REST PUT endpoint for workflow update
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
        // Normalize workflow to ensure all required fields are present
        const normalizedWorkflow = {
          name: workflow.name || 'Unnamed Workflow',
          version: workflow.version ?? 1,
          description: workflow.description || '',
          ...workflow,
          tasks: Array.isArray(workflow.tasks) ? workflow.tasks : [],
          inputParameters: Array.isArray(workflow.inputParameters) ? workflow.inputParameters : [],
          outputParameters: workflow.outputParameters || {},
          inputTemplate: workflow.inputTemplate || {},
          variables: workflow.variables || {},
          accessPolicy: workflow.accessPolicy || {},
          restartable: workflow.restartable ?? true,
          workflowStatusListenerEnabled: workflow.workflowStatusListenerEnabled ?? false,
          schemaVersion: workflow.schemaVersion || 2,
          timeoutSeconds: workflow.timeoutSeconds || 3600,
          timeoutPolicy: workflow.timeoutPolicy || 'TIME_OUT_WF',
        };

        // Wrap in array as required by Conductor backend
        const workflowArray = [normalizedWorkflow];

        serverLogger.info(
          '[Resolvers] Updating workflow in Conductor (PUT):',
          normalizedWorkflow.name,
          'v' + normalizedWorkflow.version
        );

        const response = await client.put('/api/metadata/workflow', workflowArray);

        if (response.status >= 200 && response.status < 300) {
          // Success - return name and version
          serverLogger.info(
            '[Resolvers] Workflow updated successfully:',
            normalizedWorkflow.name,
            'v' + normalizedWorkflow.version
          );
          return {
            name: normalizedWorkflow.name || 'unknown',
            version: normalizedWorkflow.version || 1,
            success: true,
          };
        }

        // Error response - extract and log detailed error from Conductor
        const errorData = response.data;
        const errorMsg =
          extractErrorMessage(errorData) || `HTTP ${response.status}: ${response.statusText}`;

        // Log detailed error to file - include validation errors if present
        const errorContext = {
          status: response.status,
          statusText: response.statusText,
          workflowName: normalizedWorkflow.name,
          workflowVersion: normalizedWorkflow.version,
          responseData: errorData,
          requestBody: workflowArray,
        };

        // If there are validation errors, extract them for detailed logging
        if (errorData?.validationErrors && Array.isArray(errorData.validationErrors)) {
          errorContext.validationErrors = errorData.validationErrors.map((err) => {
            if (typeof err === 'object' && err !== null) {
              return {
                message: err.message || 'Unknown validation error',
                field: err.field || err.path || 'unknown',
                error: err.error || err.details || '',
                raw: err,
              };
            }
            return { message: String(err), raw: err };
          });
        }

        handleErrorLogging('saveWorkflow', new Error(errorMsg), errorContext);

        const userError = createUserFriendlyError(
          {
            message: errorMsg,
            response: { status: response.status, data: errorData },
            config: { baseURL: conductorConfig.serverUrl },
          },
          'saveWorkflow'
        );

        // Return error in response instead of throwing
        return {
          name: normalizedWorkflow.name || 'unknown',
          version: normalizedWorkflow.version || 1,
          success: false,
          error: userError.message,
          errorDetails: userError.details,
          errorCode: userError.code,
          errorSeverity: userError.severity,
        };
      } catch (error) {
        // Log the full error to file
        handleErrorLogging('saveWorkflow', error, {
          workflowName: workflow.name,
          workflowVersion: workflow.version,
          serverUrl: conductorConfig.serverUrl,
        });

        const userError = createUserFriendlyError(error, 'saveWorkflow');

        // Return error in response instead of throwing
        return {
          name: workflow.name || 'unknown',
          version: workflow.version || 1,
          success: false,
          error: userError.message,
          errorDetails: userError.details,
          errorCode: userError.code,
          errorSeverity: userError.severity,
        };
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
      const response = await client.post('/', {
        query: mutation,
        variables: { name, version, input },
      });
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
      const response = await client.post('/', {
        query: mutation,
        variables: { workflowId, reason },
      });
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

      try {
        serverLogger.info('[Resolvers] Registering task:', task.name);
        const response = await client.post('/api/metadata/taskdefs', [task]);

        if (response.status >= 400) {
          // Log error to file
          handleErrorLogging(
            'registerTask',
            new Error(`Failed to register task: ${response.status}`),
            {
              taskName: task.name,
              status: response.status,
              statusText: response.statusText,
              responseData: response.data,
            }
          );

          serverLogger.error('Failed to register task:', response.data);
          throw new Error(
            response.data?.message || `Failed to register task: ${response.statusText}`
          );
        }

        serverLogger.info('[Resolvers] Task registered successfully:', task.name);

        // Return the registered task info
        return {
          name: task.name,
          ...response.data,
        };
      } catch (error) {
        // Log detailed error to file
        handleErrorLogging('registerTask', error, {
          taskName: task.name,
          serverUrl: conductorConfig.serverUrl,
        });

        serverLogger.error('Error registering task:', error.message);
        throw error;
      }
    },
    async updateTask(_, { task }) {
      // Use REST PUT endpoint: /api/metadata/taskdefs
      const client = axios.create({
        baseURL: conductorConfig.serverUrl,
        headers: {
          'Content-Type': 'application/json',
          ...(conductorConfig.apiKey && { 'X-API-Key': conductorConfig.apiKey }),
        },
        validateStatus: () => true,
      });

      try {
        serverLogger.info('[Resolvers] Updating task definition:', task.name);
        const response = await client.put('/api/metadata/taskdefs', task);

        if (response.status >= 200 && response.status < 300) {
          serverLogger.info('[Resolvers] Task updated successfully:', task.name);
          return {
            name: task.name,
          };
        } else {
          // Log error to file
          handleErrorLogging('updateTask', new Error(`Failed to update task: ${response.status}`), {
            taskName: task.name,
            status: response.status,
            statusText: response.statusText,
            responseData: response.data,
          });

          serverLogger.error('Failed to update task:', response.status, response.data);
          throw new Error(
            response.data?.message || `HTTP ${response.status}: ${response.statusText}`
          );
        }
      } catch (error) {
        // Log detailed error to file
        handleErrorLogging('updateTask', error, {
          taskName: task.name,
          serverUrl: conductorConfig.serverUrl,
        });

        serverLogger.error('Error updating task:', error.message);
        throw error;
      }
    },
    async deleteTask(_, { taskName }) {
      // Use REST DELETE endpoint: /api/metadata/taskdefs/{tasktype}
      const client = axios.create({
        baseURL: conductorConfig.serverUrl,
        headers: {
          'Content-Type': 'application/json',
          ...(conductorConfig.apiKey && { 'X-API-Key': conductorConfig.apiKey }),
        },
        validateStatus: () => true,
      });

      try {
        serverLogger.info('[Resolvers] Deleting task definition:', taskName);
        const response = await client.delete(
          `/api/metadata/taskdefs/${encodeURIComponent(taskName)}`
        );

        // Treat 404 as success - task doesn't exist
        if (response.status === 404) {
          serverLogger.info(`Task ${taskName} not found on server (already deleted)`);
          return { success: true };
        }

        if (response.status >= 200 && response.status < 300) {
          serverLogger.info('[Resolvers] Task deleted successfully:', taskName);
          return { success: true };
        } else {
          // Log error to file
          handleErrorLogging('deleteTask', new Error(`Failed to delete task: ${response.status}`), {
            taskName,
            status: response.status,
            statusText: response.statusText,
            responseData: response.data,
          });

          serverLogger.error('Failed to delete task:', response.status, response.data);
          throw new Error(
            response.data?.message || `HTTP ${response.status}: ${response.statusText}`
          );
        }
      } catch (error) {
        // Log detailed error to file
        handleErrorLogging('deleteTask', error, {
          taskName,
          serverUrl: conductorConfig.serverUrl,
        });

        serverLogger.error('Error deleting task:', error.message);
        throw error;
      }
    },
  },
};

export { resolvers, updateConductorConfig };
