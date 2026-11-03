import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ErrorCode } from '@shuttle-connect/types';
import { ApiError } from './client';
import { useLanguageStore } from '@/shared/i18n';
import { en } from '@/shared/i18n/messages/en';
import { vi } from '@/shared/i18n/messages/vi';
import { useAuthPromptStore } from '../lib/auth-prompt-store';

// Translated overrides for a few codes users hit directly through their own actions (rate
// limiting), rather than the raw English DomainError message every other ApiError falls back to.
// Belongs here, not as a per-mutation onError in e.g. useJoinSession -- MutationCache's onError
// below already fires for every mutation in the app; a second onError on one specific mutation
// wouldn't replace it, it would show a second toast alongside it.
const TRANSLATED_ERROR_CODES = {
  [ErrorCode.REJOIN_COOLDOWN]: 'toastRejoinCooldown',
  [ErrorCode.JOIN_LIMIT_REACHED]: 'joinLimitReachedNote',
  [ErrorCode.RATE_LIMITED]: 'toastRateLimited',
} as const;

function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Something went wrong. Please try again.';
  }

  const messageKey =
    TRANSLATED_ERROR_CODES[error.code as keyof typeof TRANSLATED_ERROR_CODES];
  if (messageKey) {
    const language = useLanguageStore.getState().language;
    return (language === 'vi' ? vi : en)[messageKey];
  }

  return error.message;
}

// A 401 means "you're not signed in," never "something went wrong" -- a raw error toast reading
// something like "Unauthorized" is both confusing and not actionable. Every current and future
// query/mutation that requires auth gets this for free from one place: open the shared "please
// sign in" prompt (shared/lib/auth-prompt-store.ts) instead of toasting. Most authenticated pages
// are also gated at the route level (app/routes/__root.tsx's requiresAuth check) before they'd
// ever get this far, so in practice this mainly catches actions reachable from public pages
// (e.g. clicking Join while signed out) and a token expiring mid-session.
function handleApiError(error: unknown): void {
  if (error instanceof ApiError && error.code === ErrorCode.UNAUTHORIZED) {
    useAuthPromptStore.getState().open();
    return;
  }
  toast.error(errorMessage(error));
}

// One place for "an API call failed, tell the user" -- useQuery/useMutation don't take a
// per-hook onError for this in v5 (useQuery dropped it entirely); QueryCache/MutationCache's
// onError is the supported global replacement. Individual hooks only need their own onError
// for something beyond "show a toast" (rare) -- the default below already covers every query
// and every mutation in the app.
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleApiError,
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
