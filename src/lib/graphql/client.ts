import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { Observable } from 'rxjs';
import { useLoggingStore } from '../../stores/loggingStore';

let apolloClient: ApolloClient | null = null;

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
    let requestLogged = false;

    // Log request only once
    try {
      const { addLog } = useLoggingStore.getState();
      const context = operation.getContext();
      const headers = context.headers || {};

      addLog({
        type: 'request',
        operation: operation.operationName || 'unknown',
        method: 'POST',
        url: finalConductorUrl,
        requestHeaders: headers,
        requestBody: {
          query: operation.query.loc?.source.body,
          variables: operation.variables,
        },
      });
      requestLogged = true;
    } catch (logError) {
      console.warn('Failed to log request:', logError);
    }

    return new Observable((observer) => {
      const subscription = forward(operation).subscribe({
        next: (result) => {
          const duration = Date.now() - startTime;

          // Log response only once
          try {
            const { addLog } = useLoggingStore.getState();

            // Check if there's an error in the result
            if (result.errors && result.errors.length > 0) {
              // Log as error instead of response
              addLog({
                type: 'error',
                operation: operation.operationName || 'unknown',
                method: 'POST',
                url: finalConductorUrl,
                status: 500,
                duration,
                error: `GraphQL Error: ${result.errors[0].message}`,
                responseBody: { errors: result.errors },
              });
            } else {
              // Log as successful response
              addLog({
                type: 'response',
                operation: operation.operationName || 'unknown',
                method: 'POST',
                url: finalConductorUrl,
                status: 200,
                duration,
                responseBody: result.data || undefined,
              });
            }
          } catch (logError) {
            console.warn('Failed to log response:', logError);
          }

          observer.next(result);
        },
        error: (error) => {
          // Log network error only if request was logged
          if (requestLogged) {
            const duration = Date.now() - startTime;
            try {
              const { addLog } = useLoggingStore.getState();
              addLog({
                type: 'error',
                operation: operation.operationName || 'unknown',
                method: 'POST',
                url: finalConductorUrl,
                status: 0,
                duration,
                error: `Network Error: ${error.message || 'Unknown error'}`,
              });
            } catch (logError) {
              console.warn('Failed to log error:', logError);
            }
          }
          observer.error(error);
        },
        complete: () => observer.complete(),
      });

      return () => subscription.unsubscribe();
    });
  });

  const errorLink = new ErrorLink(({ error }) => {
    // Just log to console - actual logging is handled by loggingLink to avoid duplicates
    if (CombinedGraphQLErrors.is(error)) {
      for (const { message, locations, path } of error.errors) {
        const locStr = JSON.stringify(locations);
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locStr}, Path: ${JSON.stringify(path)}`
        );
      }
    } else {
      console.error(`[Network error]:`, error);
    }
  });

  try {
    console.log('Creating Apollo Client...');
    apolloClient = new ApolloClient({
      link: ApolloLink.from([errorLink, loggingLink, authLink, httpLink]),
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
