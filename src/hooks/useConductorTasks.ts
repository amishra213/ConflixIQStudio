import { useQuery, useMutation } from '@apollo/client/react';
import { GET_TASK_DEFINITIONS } from '@/lib/graphql/queries';
import { REGISTER_TASK } from '@/lib/graphql/mutations';
import { useSettingsStore } from '@/stores/settingsStore';

export const useTaskDefinitions = () => {
  const { proxyServer, conductorApi } = useSettingsStore();
  
  // Determine if connected: either proxy is enabled or Conductor API endpoint is configured
  const isConnected = proxyServer.enabled || !!conductorApi.endpoint;
  
  // Return early if not connected to avoid Apollo hook call outside of provider
  if (!isConnected) {
    return {
      taskDefinitions: [],
      loading: false,
      error: { message: 'Not connected to Conductor server. Please configure connection in Settings.' },
      refetch: async () => ({ data: undefined }),
    };
  }
  
  interface TaskDefinitionsData {
    taskDefinitions: any[]; // Replace 'any' with your actual TaskDefinition type if available
  }

  const { data, loading, error, refetch } = useQuery<TaskDefinitionsData>(GET_TASK_DEFINITIONS, {
    fetchPolicy: 'network-only',
  });

  return {
    taskDefinitions: data?.taskDefinitions || [],
    loading,
    error,
    refetch,
  };
};

export const useRegisterTask = () => {
  const { proxyServer, conductorApi } = useSettingsStore();
  
  // Determine if connected: either proxy is enabled or Conductor API endpoint is configured
  const isConnected = proxyServer.enabled || !!conductorApi.endpoint;
  
  // Return early if not connected to avoid Apollo hook call outside of provider  
  if (!isConnected) {
    return {
      registerTask: async () => ({ data: undefined }),
      loading: false,
      error: { message: 'Not connected to Conductor server. Please configure connection in Settings.' },
    };
  }
  
  const [registerTask, { loading, error }] = useMutation(REGISTER_TASK);

  return {
    registerTask,
    loading,
    error,
  };
};
