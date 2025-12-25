import gql from 'graphql-tag';

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
    saveWorkflow(workflow: WorkflowInput!): WorkflowResponse
    startWorkflow(name: String!, version: Int, input: JSON): StartWorkflowResponse
    terminateWorkflow(workflowId: String!, reason: String): SuccessResponse
    restartWorkflow(workflowId: String!): StartWorkflowResponse
    pauseWorkflow(workflowId: String!): SuccessResponse
    resumeWorkflow(workflowId: String!): SuccessResponse
    registerTask(task: TaskDefinitionInput!): TaskDefinitionResponse
    updateTask(task: TaskDefinitionInput!): TaskDefinitionResponse
    deleteTask(taskName: String!): SuccessResponse
  }

  type Workflow {
    name: String!
    description: String
    version: Int
    createTime: String
    updateTime: String
    createdBy: String
    updatedBy: String
    ownerEmail: String
    ownerApp: String
    timeoutSeconds: Int
    timeoutPolicy: String
    tasks: [WorkflowTask]
    inputParameters: [String]
    inputTemplate: JSON
    outputParameters: JSON
    restartable: Boolean
    schemaVersion: Int
    accessPolicy: JSON
    failureWorkflow: String
    variables: JSON
    workflowStatusListenerEnabled: Boolean
    effectiveDate: String
    endDate: String
    status: String
  }

  type WorkflowTask {
    name: String
    taskReferenceName: String
    type: String
    workflowTaskType: String
    description: String
    inputParameters: JSON
    outputParameters: JSON
    optional: Boolean
    asyncComplete: Boolean
    retryCount: Int
    startDelay: Int
    rateLimited: Boolean
    evaluatorType: String
    expression: String
    scriptExpression: String
    decisionCases: JSON
    defaultCase: JSON
    forkTasks: JSON
    joinOn: [String]
    defaultExclusiveJoinTask: [String]
    loopCondition: String
    loopOver: JSON
    dynamicForkTasksParam: String
    dynamicForkTasksInputParamName: String
    dynamicTaskNameParam: String
    sink: String
    subWorkflowParam: JSON
    taskDefinition: TaskDefinitionFull
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
    createdBy: String
    updatedBy: String
    createTime: String
    updateTime: String
    ownerEmail: String
    ownerApp: String
    retryCount: Int
    retryDelaySeconds: Int
    retryLogic: String
    timeoutSeconds: Int
    timeoutPolicy: String
    responseTimeoutSeconds: Int
    pollTimeoutSeconds: Int
    backoffScaleFactor: Float
    concurrentExecLimit: Int
    rateLimitPerFrequency: Int
    rateLimitFrequencyInSeconds: Int
    inputKeys: [String]
    outputKeys: [String]
    inputTemplate: JSON
    isolationGroupId: String
    executionNameSpace: String
    accessPolicy: JSON
  }

  type TaskDefinitionFull {
    name: String
    description: String
    createdBy: String
    updatedBy: String
    createTime: String
    updateTime: String
    ownerEmail: String
    ownerApp: String
    retryCount: Int
    retryDelaySeconds: Int
    retryLogic: String
    timeoutSeconds: Int
    timeoutPolicy: String
    responseTimeoutSeconds: Int
    pollTimeoutSeconds: Int
    backoffScaleFactor: Float
    concurrentExecLimit: Int
    rateLimitPerFrequency: Int
    rateLimitFrequencyInSeconds: Int
    inputKeys: [String]
    outputKeys: [String]
    inputTemplate: JSON
    isolationGroupId: String
    executionNameSpace: String
    accessPolicy: JSON
  }

  input WorkflowInput {
    name: String!
    description: String
    version: Int
    createdBy: String
    updatedBy: String
    ownerEmail: String
    ownerApp: String
    createTime: String
    updateTime: String
    tasks: [WorkflowTaskInput]
    inputParameters: [String]
    inputTemplate: JSON
    outputParameters: JSON
    timeoutSeconds: Int
    timeoutPolicy: String
    restartable: Boolean
    schemaVersion: Int
    accessPolicy: JSON
    failureWorkflow: String
    variables: JSON
    workflowStatusListenerEnabled: Boolean
    effectiveDate: String
    endDate: String
    status: String
  }

  input WorkflowTaskInput {
    name: String
    taskReferenceName: String
    type: String
    workflowTaskType: String
    description: String
    inputParameters: JSON
    outputParameters: JSON
    optional: Boolean
    asyncComplete: Boolean
    retryCount: Int
    startDelay: Int
    rateLimited: Boolean
    evaluatorType: String
    expression: String
    scriptExpression: String
    decisionCases: JSON
    defaultCase: JSON
    forkTasks: JSON
    joinOn: [String]
    defaultExclusiveJoinTask: [String]
    loopCondition: String
    loopOver: JSON
    dynamicForkTasksParam: String
    dynamicForkTasksInputParamName: String
    dynamicTaskNameParam: String
    sink: String
    subWorkflowParam: JSON
    taskDefinition: TaskDefinitionInputFull
  }

  input TaskDefinitionInput {
    name: String!
    description: String
    createdBy: String
    updatedBy: String
    createTime: String
    updateTime: String
    ownerEmail: String
    ownerApp: String
    retryCount: Int
    retryDelaySeconds: Int
    retryLogic: String
    timeoutSeconds: Int
    timeoutPolicy: String
    responseTimeoutSeconds: Int
    pollTimeoutSeconds: Int
    backoffScaleFactor: Float
    concurrentExecLimit: Int
    rateLimitPerFrequency: Int
    rateLimitFrequencyInSeconds: Int
    inputKeys: [String]
    outputKeys: [String]
    inputTemplate: JSON
    isolationGroupId: String
    executionNameSpace: String
    accessPolicy: JSON
  }

  input TaskDefinitionInputFull {
    name: String!
    description: String
    createdBy: String
    updatedBy: String
    createTime: String
    updateTime: String
    ownerEmail: String
    ownerApp: String
    retryCount: Int
    retryDelaySeconds: Int
    retryLogic: String
    timeoutSeconds: Int
    timeoutPolicy: String
    responseTimeoutSeconds: Int
    pollTimeoutSeconds: Int
    backoffScaleFactor: Float
    concurrentExecLimit: Int
    rateLimitPerFrequency: Int
    rateLimitFrequencyInSeconds: Int
    inputKeys: [String]
    outputKeys: [String]
    inputTemplate: JSON
    isolationGroupId: String
    executionNameSpace: String
    accessPolicy: JSON
  }

  type WorkflowResponse {
    name: String
    version: Int
    success: Boolean
    error: String
    errorDetails: String
    errorCode: String
    errorSeverity: String
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

export default typeDefs;
