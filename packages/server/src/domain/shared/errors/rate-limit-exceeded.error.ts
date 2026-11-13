import { ErrorCode } from '@shuttle-connect/types';
import { TooManyRequestsError } from './too-many-requests.error';

// Reuses RATE_LIMITED (the code apiRequest already assigns to API Gateway's own 429s), so the
// frontend's existing translated "too many requests" toast covers it with no client change.
export class RateLimitExceededError extends TooManyRequestsError {
  readonly code = ErrorCode.RATE_LIMITED;
  constructor(action: string, resetsAt: Date) {
    super(`Rate limit reached for ${action} -- try again after ${resetsAt.toISOString()}`);
  }
}
