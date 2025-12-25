import { useCallback } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Hook to manage proxy server configuration and connection
 */
export function useProxyServer() {
  const { proxyServer } = useSettingsStore();

  /**
   * Get the endpoint to use based on proxy server enabled status
   */
  const getActiveEndpoint = useCallback((): string => {
    if (proxyServer.enabled) {
      return proxyServer.proxyEndpoint;
    }
    // Fallback to direct API when proxy is disabled
    return 'http://localhost:8080/api';
  }, [proxyServer.enabled, proxyServer.proxyEndpoint]);

  /**
   * Configure proxy server with new credentials
   */
  const configureProxy = useCallback(
    async (conductorServerUrl: string, conductorApiKey?: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `${proxyServer.proxyEndpoint.replace('/graphql', '')}/api/config`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conductorServerUrl,
              conductorApiKey: conductorApiKey || '',
            }),
          }
        );

        if (!response.ok) {
          console.error('Failed to configure proxy server', response.statusText);
          return false;
        }

        return true;
      } catch (error) {
        console.error('Error configuring proxy server:', error);
        return false;
      }
    },
    [proxyServer.proxyEndpoint]
  );

  /**
   * Check proxy server health
   */
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(
        `${proxyServer.proxyEndpoint.replace('/graphql', '')}/api/health`
      );
      return response.ok;
    } catch (error) {
      console.error('Proxy server health check failed:', error);
      return false;
    }
  }, [proxyServer.proxyEndpoint]);

  /**
   * Make a GraphQL query through the proxy
   */
  const executeGraphQL = useCallback(
    async <T = Record<string, unknown>>(
      query: string,
      variables?: Record<string, unknown>
    ): Promise<T | null> => {
      try {
        const response = await fetch(proxyServer.proxyEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: variables || {},
          }),
        });

        if (!response.ok) {
          console.error('GraphQL query failed', response.statusText);
          return null;
        }

        const data = await response.json();
        if (data.errors) {
          console.error('GraphQL errors:', data.errors);
          return null;
        }

        return data.data as T;
      } catch (error) {
        console.error('Error executing GraphQL query:', error);
        return null;
      }
    },
    [proxyServer.proxyEndpoint]
  );

  return {
    proxyEndpoint: proxyServer.proxyEndpoint,
    isProxyEnabled: proxyServer.enabled,
    getActiveEndpoint,
    configureProxy,
    checkHealth,
    executeGraphQL,
  };
}
