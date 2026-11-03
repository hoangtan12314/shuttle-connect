// Shared with both the frontend's withdraw-request UI (display-only disabled state) and the
// server's WithdrawRequestUseCase (the actual enforced rule). Keep both sides importing this one
// value, same pattern as MAX_SESSION_HOURS.
export const WITHDRAW_CUTOFF_HOURS = 6;

// Anti-churn pair, both enforced by Request.assertCanRejoin (the actual rule) and read by the
// frontend's join-session UI (display-only disabled state), same pattern as the constant above.
// A withdrawn request can be rejoined once this many minutes have passed...
export const REJOIN_COOLDOWN_MINUTES = 10;
// ...and at most this many times in total, cooldown or not.
export const MAX_JOINS_PER_SESSION = 3;
