import {
  MAX_JOINS_PER_SESSION,
  REJOIN_COOLDOWN_MINUTES,
} from '@shuttle-connect/types';

const REJOIN_COOLDOWN_MS = REJOIN_COOLDOWN_MINUTES * 60 * 1000;

// Display-only, mirroring Request.assertCanRejoin -- the server is the one enforcing both
// rules, this just drives the disabled state/countdown before the request round-trips.

export function hasReachedJoinLimit(joinCount: number): boolean {
  return joinCount >= MAX_JOINS_PER_SESSION;
}

export function isWithinRejoinCooldown(withdrawnAt: string | null): boolean {
  if (!withdrawnAt) return false;
  return new Date(withdrawnAt).getTime() + REJOIN_COOLDOWN_MS > Date.now();
}

// Rounds up, same as RejoinCooldownError's server-side message -- "0 min left" would read oddly
// for a cooldown that's still technically active.
export function remainingCooldownMinutes(withdrawnAt: string): number {
  const elapsedMs = Date.now() - new Date(withdrawnAt).getTime();
  return Math.max(1, Math.ceil((REJOIN_COOLDOWN_MS - elapsedMs) / 60_000));
}
