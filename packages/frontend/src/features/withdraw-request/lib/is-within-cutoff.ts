import { WITHDRAW_CUTOFF_HOURS } from '@shuttle-connect/types';

const WITHDRAW_CUTOFF_MS = WITHDRAW_CUTOFF_HOURS * 60 * 60 * 1000;

// Display-only -- the server is the one enforcing this rule (WithdrawRequestUseCase), this just
// drives whether the Withdraw button shows disabled before the request round-trips.
export function isWithinWithdrawCutoff(startTime: string): boolean {
  return new Date(startTime).getTime() - Date.now() < WITHDRAW_CUTOFF_MS;
}
