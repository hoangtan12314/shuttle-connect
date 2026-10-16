import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from './client';

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Something went wrong. Please try again.';
}

// One place for "an API call failed, tell the user" -- useQuery/useMutation don't take a
// per-hook onError for this in v5 (useQuery dropped it entirely); QueryCache/MutationCache's
// onError is the supported global replacement. Individual hooks only need their own onError
// for something beyond "show a toast" (rare) -- the default below already covers every query
// and every mutation in the app.
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => toast.error(errorMessage(error)),
  }),
  mutationCache: new MutationCache({
    onError: (error) => toast.error(errorMessage(error)),
  }),
  defaultOptions: {
    queries: {
      // no retry on 4xx (a 401/403/404 will never succeed by retrying), default retry/backoff
      // otherwise (likely transient -- network blip, 5xx).
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
