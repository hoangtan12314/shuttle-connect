import { RateLimitRule } from '@shuttle-connect/types';

export type RateLimitedAction = 'cover-upload' | 'session-create';

// Per-user request budget. consume() counts one request against the current window and throws
// RateLimitExceededError once the window's limit is used up. It counts attempts, not successes:
// call it first, before any other work, so an over-limit caller costs one write and nothing else.
export interface RateLimiter {
  consume(userId: string, action: RateLimitedAction, rule: RateLimitRule): Promise<void>;
}

export const RATE_LIMITER = Symbol('RateLimiter');
