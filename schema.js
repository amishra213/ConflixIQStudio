const { gql } = require('@apollo/server');
const GraphQLJSON = require('graphql-type-json');

const typeDefs = gql`
  scalar JSON

  type Query {
    workflows(limit: Int, offset: Int): [Workflow]
    workflow(name: String!, version: Int): Workflow
    workflowExecutions(workflowName: String!, limit: Int): [WorkflowExecution]
    taskDefinitions: [TaskDefinition]
    searchWorkflows(query: String!, limit: Int): [WorkflowExecution]
  }

  type Mutation {
    createWorkflow(workflow: WorkflowInput!): WorkflowResponse
    updateWorkflow(workflow: WorkflowInput!): WorkflowResponse
    startWorkflow(name: String!, version: Int, input: JSON): StartWorkflowResponse
    terminateWorkflow(workflowId: String!, reason: String): SuccessResponse
    restartWorkflow(workflowId: String!): StartWorkflowResponse
    pauseWorkflow(workflowId: String!): SuccessResponse
    resumeWorkflow(workflowId: String!): SuccessResponse
    registerTask(task: TaskDefinitionInput!): TaskDefinitionResponse
  }

  type Workflow {
    name: String!
    description: String
    version: Int
    createTime: String
    updateTime: String
    ownerEmail: String
    timeoutSeconds: Int
    tasks: [WorkflowTask]
    inputParameters: [String]
    outputParameters: JSON
    restartable: Boolean
    schemaVersion: Int
    orgId: String # Custom attribute
    workflowId: String # Custom attribute
    effectiveDate: String # Custom attribute
    endDate: String # Custom attribute
    status: String # Custom attribute (e.g., ACTIVE, INACTIVE, DRAFT)
  }

  type WorkflowTask {
    name: String
    taskReferenceName: String
    type: String
    inputParameters: JSON
    optional: Boolean
    # Add other task-specific fields as needed
  }

  type WorkflowExecution {
    workflowId: String
    workflowName: String
    status: String
    startTime: String
    endTime: String
    input: JSON
    output: JSON
    tasks: [TaskExecution]
    version: Int
  }

  type TaskExecution {
    taskId: String
    taskType: String
    status: String
    startTime: String
    endTime: String
    input: JSON
    output: JSON
  }

  type TaskDefinition {
    name: String
    description: String
    retryCount: Int
    timeoutSeconds: Int
    inputKeys: [String]
    outputKeys: [String]
    responseTimeoutSeconds: Int
    ownerEmail: String
    createdBy: String
    updatedBy: String
    createTime: JSON
    updateTime: JSON
  }

  input WorkflowInput {
    name: String!
    description: String
    version: Int
    tasks: [WorkflowTaskInput]
    inputParameters: [String]
    outputParameters: JSON
    timeoutSeconds: Int
    restartable: Boolean
    schemaVersion: Int
    orgId: String
    workflowId: String
    effectiveDate: String
    endDate: String
    status: String
  }

  input WorkflowTaskInput {
    name: String
    taskReferenceName: String
    type: String
    inputParameters: JSON
    optional: Boolean
    # Add other task-specific input fields as needed
  }

  input TaskDefinitionInput {
    name: String!
    description: String
    retryCount: Int
    timeoutSeconds: Int
    inputKeys: [String]
    outputKeys: [String]
    responseTimeoutSeconds: Int
    ownerEmail: String
    createdBy: String
    updatedBy: String
    createTime: JSON
    updateTime: JSON
  }

  type WorkflowResponse {
    name: String
    version: Int
  }

  type StartWorkflowResponse {
    workflowId: String
  }

  type SuccessResponse {
    success: Boolean
  }

  type TaskDefinitionResponse {
    name: String
  }
`;

module.exports = typeDefs;
