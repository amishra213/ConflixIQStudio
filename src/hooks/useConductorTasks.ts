import { useQuery, useMutation } from '@apollo/client/react';
import { GET_TASK_DEFINITIONS } from '@/lib/graphql/queries';
import { REGISTER_TASK } from '@/lib/graphql/mutations';
import { useSettingsStore } from '@/stores/settingsStore';

export const useTaskDefinitions = () => {
  const { proxyServer, conductorApi } = useSettingsStore();

  interface TaskDefinitionsData {
    taskDefinitions: Record<string, unknown>[]; // Replace with your actual TaskDefinition type if available
  }

  const { data, loading, error, refetch } = useQuery<TaskDefinitionsData>(GET_TASK_DEFINITIONS, {
    fetchPolicy: 'network-only',
    skip: !proxyServer.enabled && !conductorApi.endpoint,
  });

  // Determine if connected: either proxy is enabled or Conductor API endpoint is configured
  const isConnected = proxyServer.enabled || !!conductorApi.endpoint;

  return {
    taskDefinitions: isConnected ? data?.taskDefinitions || [] : [],
    loading: isConnected ? loading : false,
    error: isConnected
      ? error
      : { message: 'Not connected to Conductor server. Please configure connection in Settings.' },
    refetch,
  };
};

export const useRegisterTask = () => {
  const { proxyServer, conductorApi } = useSettingsStore();

  const [registerTask, { loading, error }] = useMutation(REGISTER_TASK);

  // Determine if connected: either proxy is enabled or Conductor API endpoint is configured
  const isConnected = proxyServer.enabled || !!conductorApi.endpoint;

  return {
    registerTask: isConnected ? registerTask : async () => ({ data: undefined }),
    loading: isConnected ? loading : false,
    error: isConnected
      ? error
      : { message: 'Not connected to Conductor server. Please configure connection in Settings.' },
  };
};
