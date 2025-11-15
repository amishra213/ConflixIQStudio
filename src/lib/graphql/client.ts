import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { useLoggingStore } from '../../stores/loggingStore';

let apolloClient: ApolloClient<any> | null = null;

export const createApolloClient = (conductorUrl?: string, apiKey?: string) => {
  const envConductorUrl = import.meta.env.VITE_CONDUCTOR_SERVER_URL;
  const envApiKey = import.meta.env.VITE_CONDUCTOR_API_KEY;
  
  const finalConductorUrl = conductorUrl || envConductorUrl || 'http://localhost:8080/graphql';
  const finalApiKey = apiKey || envApiKey;

  console.log(`=== Apollo Client Creation Debug ===`);
  console.log(`Input conductorUrl: ${conductorUrl}`);
  console.log(`Input apiKey: ${apiKey ? '[PROVIDED]' : '[NOT PROVIDED]'}`);
  console.log(`Final URL: ${finalConductorUrl}`);
  console.log(`Final API Key: ${finalApiKey ? '[PROVIDED]' : '[NOT PROVIDED]'}`);

  const httpLink = new HttpLink({
    uri: finalConductorUrl,
  });

  console.log(`HttpLink created with URI: ${finalConductorUrl}`);

  const authLink = new ApolloLink((operation, forward) => {
    if (finalApiKey) {
      operation.setContext({
        headers: {
          'X-API-Key': finalApiKey,
        },
      });
    }
    return forward(operation);
  });

  const loggingLink = new ApolloLink((operation, forward) => {
    const startTime = Date.now();
    
    try {
      const { addLog } = useLoggingStore.getState();
      const context = operation.getContext();
      const headers = context.headers || {};

      addLog({
        type: 'request',
        operation: operation.operationName,
        method: 'POST',
        url: finalConductorUrl,
        requestHeaders: headers,
        requestBody: {
          query: operation.query.loc?.source.body,
          variables: operation.variables,
        },
      });
    } catch (logError) {
      console.warn('Failed to log request:', logError);
    }

    return forward(operation).map((response) => {
      const duration = Date.now() - startTime;

      try {
        const { addLog } = useLoggingStore.getState();
        addLog({
          type: 'response',
          operation: operation.operationName,
          method: 'POST',
          url: finalConductorUrl,
          status: 200,
          duration,
          responseBody: response.data,
        });
      } catch (logError) {
        console.warn('Failed to log response:', logError);
      }

      return response;
    });
  });

  const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
    try {
      const { addLog } = useLoggingStore.getState();

      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) => {
          console.error(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
          );

          addLog({
            type: 'error',
            operation: operation.operationName,
            method: 'POST',
            url: finalConductorUrl,
            error: `GraphQL Error: ${message}`,
            responseBody: { locations, path },
          });
        });
      }

      if (networkError) {
        console.error(`[Network error]: ${networkError}`);

        addLog({
          type: 'error',
          operation: operation.operationName,
          method: 'POST',
          url: finalConductorUrl,
          error: `Network Error: ${networkError.message}`,
        });
      }
    } catch (logError) {
      console.warn('Failed to log error:', logError);
      // Still log the original errors to console
      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) => {
          console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
        });
      }
      if (networkError) {
        console.error(`[Network error]: ${networkError}`);
      }
    }
  });

  try {
    console.log('Creating Apollo Client...');
    apolloClient = new ApolloClient({
      link: from([errorLink, loggingLink, authLink, httpLink]),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'network-only',
        },
        query: {
          fetchPolicy: 'network-only',
        },
      },
    });
    console.log('✅ Apollo Client instance created successfully');
  } catch (error) {
    console.error('❌ Failed to create Apollo Client instance:', error);
    throw error;
  }

  return apolloClient;
};

export const getApolloClient = () => {
  if (!apolloClient) {
    throw new Error('Apollo client not initialized. Please configure Conductor connection first.');
  }
  return apolloClient;
};

export const resetApolloClient = () => {
  apolloClient = null;
};
