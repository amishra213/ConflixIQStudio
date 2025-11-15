import { gql } from '@apollo/client';

export const CREATE_WORKFLOW = gql`
  mutation CreateWorkflow($workflow: WorkflowInput!) {
    createWorkflow(workflow: $workflow) {
      name
      version
    }
  }
`;

export const UPDATE_WORKFLOW = gql`
  mutation UpdateWorkflow($workflow: WorkflowInput!) {
    updateWorkflow(workflow: $workflow) {
      name
      version
    }
  }
`;

export const START_WORKFLOW = gql`
  mutation StartWorkflow($name: String!, $version: Int, $input: JSON) {
    startWorkflow(name: $name, version: $version, input: $input) {
      workflowId
    }
  }
`;

export const TERMINATE_WORKFLOW = gql`
  mutation TerminateWorkflow($workflowId: String!, $reason: String) {
    terminateWorkflow(workflowId: $workflowId, reason: $reason) {
      success
    }
  }
`;

export const RESTART_WORKFLOW = gql`
  mutation RestartWorkflow($workflowId: String!) {
    restartWorkflow(workflowId: $workflowId) {
      workflowId
    }
  }
`;

export const PAUSE_WORKFLOW = gql`
  mutation PauseWorkflow($workflowId: String!) {
    pauseWorkflow(workflowId: $workflowId) {
      success
    }
  }
`;

export const RESUME_WORKFLOW = gql`
  mutation ResumeWorkflow($workflowId: String!) {
    resumeWorkflow(workflowId: $workflowId) {
      success
    }
  }
`;

export const REGISTER_TASK = gql`
  mutation RegisterTask($task: TaskDefinitionInput!) {
    registerTask(task: $task) {
      name
    }
  }
`;
