import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_WORKFLOWS,
  GET_WORKFLOW_BY_NAME,
  GET_WORKFLOW_EXECUTIONS,
} from '@/lib/graphql/queries';
import {
  CREATE_WORKFLOW,
  UPDATE_WORKFLOW,
  START_WORKFLOW,
  TERMINATE_WORKFLOW,
} from '@/lib/graphql/mutations';
import { useSettingsStore } from '@/stores/settingsStore';

export const useConductorWorkflows = () => {
  const { proxyServer, conductorApi } = useSettingsStore();
  const isConnected = proxyServer.enabled || !!conductorApi.endpoint;

  type WorkflowsQueryResult = { workflows: Record<string, unknown>[] };
  const {
    data: workflowsData,
    loading: workflowsLoading,
    error: workflowsError,
    refetch: refetchWorkflows,
  } = useQuery<WorkflowsQueryResult>(GET_WORKFLOWS, {
    variables: { limit: 100, offset: 0 },
    skip: !isConnected,
  });

  const [createWorkflow, { loading: createLoading }] = useMutation(CREATE_WORKFLOW);
  const [updateWorkflow, { loading: updateLoading }] = useMutation(UPDATE_WORKFLOW);
  const [startWorkflow, { loading: startLoading }] = useMutation(START_WORKFLOW);
  const [terminateWorkflow, { loading: terminateLoading }] = useMutation(TERMINATE_WORKFLOW);

  return {
    workflows: workflowsData?.workflows || [],
    workflowsLoading,
    workflowsError,
    refetchWorkflows,
    createWorkflow,
    updateWorkflow,
    startWorkflow,
    terminateWorkflow,
    isLoading: createLoading || updateLoading || startLoading || terminateLoading,
  };
};

export const useWorkflowDetails = (name: string, version?: number) => {
  const { proxyServer, conductorApi } = useSettingsStore();
  const isConnected = proxyServer.enabled || !!conductorApi.endpoint;

  type WorkflowByNameQueryResult = { workflow: Record<string, unknown> };
  const { data, loading, error, refetch } = useQuery<WorkflowByNameQueryResult>(
    GET_WORKFLOW_BY_NAME,
    {
      variables: { name, version },
      skip: !name || !isConnected,
    }
  );

  return {
    workflow: data?.workflow,
    loading,
    error,
    refetch,
  };
};

export const useWorkflowExecutions = (workflowName: string, limit: number = 50) => {
  const { proxyServer, conductorApi } = useSettingsStore();
  const isConnected = proxyServer.enabled || !!conductorApi.endpoint;

  type WorkflowExecutionsQueryResult = { workflowExecutions: Record<string, unknown>[] };
  const { data, loading, error, refetch } = useQuery<WorkflowExecutionsQueryResult>(
    GET_WORKFLOW_EXECUTIONS,
    {
      variables: { workflowName, limit },
      skip: !workflowName || !isConnected,
    }
  );

  return {
    executions: data?.workflowExecutions || [],
    loading,
    error,
    refetch,
  };
};
