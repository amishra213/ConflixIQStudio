import { gql } from '@apollo/client';

export const GET_WORKFLOWS = gql`
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
    }
  }
`;

export const GET_WORKFLOW_BY_NAME = gql`
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
    }
  }
`;

export const GET_WORKFLOW_EXECUTIONS = gql`
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

export const GET_TASK_DEFINITIONS = gql`
  query GetTaskDefinitions {
    taskDefinitions {
      name
      description
      retryCount
      timeoutSeconds
      inputKeys
      outputKeys
      responseTimeoutSeconds
    }
  }
`;

export const SEARCH_WORKFLOWS = gql`
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
