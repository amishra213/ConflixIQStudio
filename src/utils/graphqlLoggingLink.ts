/**
 * GraphQL Logging Link
 * Apollo Client middleware for logging GraphQL operations
 */

import { ApolloLink } from '@apollo/client';
import { APILogger } from './apiLogger';
import { Observable } from '@apollo/client/utilities';

interface GraphQLError {
  status?: number;
  statusCode?: number;
}

export class GraphQLLoggingLink extends ApolloLink {
  constructor() {
    super((operation, forward) => {
      const startTime = performance.now();

      // Extract query for logging
      const query = operation.query.loc?.source?.body || '';

      // Log the request
      APILogger.logGraphQLRequest(query, operation.variables);

      return new Observable((observer) => {
        const subscription = forward(operation).subscribe({
          next: (response: ApolloLink.Result) => {
            const duration = Math.round(performance.now() - startTime);

            // Log response
            if (response.errors && response.errors.length > 0) {
              APILogger.logGraphQLError(query, { errors: [...response.errors] }, duration, 200);
            } else {
              APILogger.logGraphQLResponse(query, response.data, duration, 200);
            }

            observer.next(response);
          },
          error: (error: Error & GraphQLError) => {
            const duration = Math.round(performance.now() - startTime);

            // Log error
            const statusCode = error?.status || error?.statusCode || 500;
            APILogger.logGraphQLError(query, error, duration, statusCode);

            observer.error(error);
          },
          complete: () => {
            observer.complete();
          },
        });

        return () => subscription.unsubscribe();
      });
    });
  }
}
