import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

// shared/api: QueryClient instance -- no retry on 4xx (a 401/403/404 will never succeed by
// retrying), default retry/backoff otherwise (likely transient -- network blip, 5xx).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (
          error instanceof ApiError &&
          error.statusCode >= 400 &&
          error.statusCode < 500
        ) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});
