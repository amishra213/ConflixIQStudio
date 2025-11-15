import { useQuery, useMutation, ApolloError } from '@apollo/client';
import { GET_TASK_DEFINITIONS } from '@/lib/graphql/queries';
import { REGISTER_TASK } from '@/lib/graphql/mutations';
import { useSettingsStore } from '@/stores/settingsStore';

export const useTaskDefinitions = () => {
  const { conductorSettings } = useSettingsStore();
  
  // Return early if not connected to avoid Apollo hook call outside of provider
  if (!conductorSettings.isConnected) {
    return {
      taskDefinitions: [],
      loading: false,
      error: new ApolloError({ errorMessage: 'Not connected to Conductor server. Please configure connection in Settings.' }),
      refetch: async () => ({ data: undefined }),
    };
  }
  
  const { data, loading, error, refetch } = useQuery(GET_TASK_DEFINITIONS, {
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
  const { conductorSettings } = useSettingsStore();
  
  // Return early if not connected to avoid Apollo hook call outside of provider  
  if (!conductorSettings.isConnected) {
    return {
      registerTask: async () => ({ data: undefined }),
      loading: false,
      error: new ApolloError({ errorMessage: 'Not connected to Conductor server. Please configure connection in Settings.' }),
    };
  }
  
  const [registerTask, { loading, error }] = useMutation(REGISTER_TASK);

  return {
    registerTask,
    loading,
    error,
  };
};
