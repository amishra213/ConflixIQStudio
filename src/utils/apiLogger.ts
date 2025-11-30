/**
 * API Logger Utility
 * Captures all API requests and responses for logging and troubleshooting
 * Supports both GraphQL and REST endpoints
 */

import { useLoggingStore } from '@/stores/loggingStore';

interface GraphQLVariables {
  [key: string]: unknown;
}

interface ErrorDetails {
  message?: string;
  code?: string | number;
  errors?: unknown[];
}

function extractOperationName(query: string, defaultName: string): string {
  const regex = /(?:query|mutation)\s+(\w+)/;
  const match = regex.exec(query);
  return match ? match[1] : defaultName;
}

function extractPathSegment(url: string, defaultValue: string): string {
  const regex = /\/(\w+)/;
  const match = regex.exec(url);
  return match ? match[1] : defaultValue;
}

export class APILogger {
  /**
   * Log a GraphQL request
   */
  static logGraphQLRequest(query: string, variables?: GraphQLVariables, url?: string) {
    const store = useLoggingStore.getState();
    
    // Extract operation name from GraphQL query
    const operationName = extractOperationName(query, 'GraphQL Operation');
    
    store.addLog({
      type: 'request',
      operation: operationName,
      method: 'POST',
      url: url || '/api/graphql',
      requestBody: {
        query: query, // Log full query without truncation
        variables,
      },
      requestHeaders: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Log a GraphQL response
   */
  static logGraphQLResponse(
    query: string,
    responseData: unknown,
    duration: number,
    status: number = 200,
    url?: string
  ) {
    const store = useLoggingStore.getState();
    
    const operationName = extractOperationName(query, 'GraphQL Operation');
    
    store.addLog({
      type: 'response',
      operation: operationName,
      method: 'POST',
      url: url || '/api/graphql',
      status,
      duration,
      responseBody: responseData,
      responseHeaders: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Log a GraphQL error
   */
  static logGraphQLError(
    query: string,
    error: ErrorDetails,
    duration: number,
    status: number = 500,
    url?: string
  ) {
    const store = useLoggingStore.getState();
    
    const operationName = extractOperationName(query, 'GraphQL Operation');
    
    const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error)) || 'Unknown error';
    const errorCode = error?.code || status;
    
    store.addLog({
      type: 'error',
      operation: operationName,
      method: 'POST',
      url: url || '/api/graphql',
      status,
      duration,
      error: `[${errorCode}] ${errorMessage}`,
      requestBody: { query: query.substring(0, 500) },
      responseBody: {
        errors: Array.isArray(error?.errors) ? error.errors : [error],
      },
    });
  }

  /**
   * Log a REST API request
   */
  static logRestRequest(
    method: string,
    url: string,
    body?: unknown,
    headers?: Record<string, string>
  ) {
    const store = useLoggingStore.getState();
    
    // Extract operation name from URL
    const operationName = extractPathSegment(url, method);
    
    store.addLog({
      type: 'request',
      operation: operationName,
      method,
      url,
      requestBody: body,
      requestHeaders: headers,
    });
  }

  /**
   * Log a REST API response
   */
  static logRestResponse(
    method: string,
    url: string,
    responseData: unknown,
    status: number,
    duration: number,
    headers?: Record<string, string>
  ) {
    const store = useLoggingStore.getState();
    
    const operationName = extractPathSegment(url, method);
    
    store.addLog({
      type: 'response',
      operation: operationName,
      method,
      url,
      status,
      duration,
      responseBody: responseData,
      responseHeaders: headers,
    });
  }

  /**
   * Log a REST API error
   */
  static logRestError(
    method: string,
    url: string,
    error: ErrorDetails,
    status: number,
    duration: number,
    responseData?: unknown
  ) {
    const store = useLoggingStore.getState();
    
    const operationName = extractPathSegment(url, method);
    
    const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error)) || 'Unknown error';
    const errorCode = error?.code || status;
    
    store.addLog({
      type: 'error',
      operation: operationName,
      method,
      url,
      status,
      duration,
      error: `[${errorCode}] ${errorMessage}`,
      responseBody: responseData || { error: errorMessage },
    });
  }

  /**
   * Wrap fetch calls with logging
   */
  static createFetchInterceptor() {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const url = APILogger.extractUrlString(input);
      const method = (init?.method || 'GET').toUpperCase();
      const body = APILogger.parseBodyIfNeeded(init?.body);
      const headers = APILogger.extractHeaders(init?.headers);

      // Skip logging for GraphQL requests - they're handled by Apollo's loggingLink
      const isGraphQLRequest = url.includes('/graphql') || 
                               (typeof body === 'object' && body !== null && 'query' in body);
      
      const startTime = performance.now();

      try {
        // Only log non-GraphQL requests to avoid duplicates
        if (!isGraphQLRequest) {
          APILogger.logRestRequest(method, url, body, headers);
        }
        
        const response = await originalFetch.apply(this, [input, init]);
        const duration = Math.round(performance.now() - startTime);
        
        // Only log non-GraphQL responses to avoid duplicates
        if (!isGraphQLRequest) {
          await APILogger.handleSuccessResponse(response, method, url, duration, headers);
        }
        
        return response;
      } catch (error: unknown) {
        const duration = Math.round(performance.now() - startTime);
        
        // Only log non-GraphQL errors to avoid duplicates
        if (!isGraphQLRequest) {
          APILogger.handleErrorResponse(error, method, url, duration);
        }
        
        throw error;
      }
    };
  }

  /**
   * Extract URL string from various input types
   */
  private static extractUrlString(input: RequestInfo | URL): string {
    if (typeof input === 'string') {
      return input;
    }
    if (input instanceof Request) {
      return input.url;
    }
    if (input instanceof URL) {
      return input.toString();
    }
    return '';
  }

  /**
   * Parse request body if present
   */
  private static parseBodyIfNeeded(body: BodyInit | null | undefined): unknown {
    if (!body) return undefined;
    try {
      return typeof body === 'string' ? JSON.parse(body) : body;
    } catch {
      return body;
    }
  }

  /**
   * Extract and normalize headers
   */
  private static extractHeaders(headersInit?: HeadersInit): Record<string, string> {
    const headers: Record<string, string> = {};
    if (!headersInit) return headers;

    if (headersInit instanceof Headers) {
      for (const [key, value] of headersInit.entries()) {
        headers[key] = value;
      }
    } else if (Array.isArray(headersInit)) {
      for (const [key, value] of headersInit) {
        headers[key] = value;
      }
    } else {
      Object.assign(headers, headersInit);
    }
    return headers;
  }

  /**
   * Handle successful HTTP response
   */
  private static async handleSuccessResponse(
    response: Response,
    method: string,
    url: string,
    duration: number,
    _headers: Record<string, string>
  ): Promise<void> {
    const clonedResponse = response.clone();
    const responseData = await clonedResponse.json().catch(() => ({}));
    const responseHeaders: Record<string, string> = {};

    for (const [key, value] of response.headers.entries()) {
      responseHeaders[key] = value;
    }

    if (response.ok) {
      // Check if it's a successful GraphQL response but with errors in the data
      if (responseData?.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        // GraphQL errors in a 200 response
        const firstError = responseData.errors[0];
        const errorMessage = firstError?.message || 'GraphQL error';
        const errorDetails: ErrorDetails = { 
          message: errorMessage,
          code: response.status,
          errors: responseData.errors
        };
        APILogger.logRestError(method, url, errorDetails, response.status, duration, responseData);
      } else {
        // Normal successful response
        APILogger.logRestResponse(method, url, responseData, response.status, duration, responseHeaders);
      }
    } else {
      // HTTP error response (4xx, 5xx)
      // Check if it's a GraphQL error wrapped in HTTP error
      let errorMessage = responseData?.message || response.statusText || 'Unknown error';
      
      // For GraphQL errors, extract the actual error message
      if (responseData?.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        const graphqlError = responseData.errors[0];
        errorMessage = graphqlError?.message || errorMessage;
        
        // Try to extract nested Conductor error if present
        if (errorMessage.includes('JSON parse error:') || errorMessage.includes('Cannot deserialize')) {
          // The full error message is already in the GraphQL error message
          // Keep it as is for detailed logging
        }
      }
      
      const errorDetails: ErrorDetails = { 
        message: errorMessage,
        code: responseData?.status || response.status,
        errors: responseData?.errors || [responseData]
      };
      APILogger.logRestError(method, url, errorDetails, response.status, duration, responseData);
    }
  }

  /**
   * Handle error response
   */
  private static handleErrorResponse(error: unknown, method: string, url: string, duration: number): void {
    const errorDetails: ErrorDetails = error instanceof Error 
      ? { message: error.message, code: (error as { code?: string }).code }
      : { message: String(error) };
    APILogger.logRestError(method, url, errorDetails, 0, duration);
  }
}
