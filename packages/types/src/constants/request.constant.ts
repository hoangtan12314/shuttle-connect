// Shared with both the frontend's withdraw-request UI (display-only disabled state) and the
// server's WithdrawRequestUseCase (the actual enforced rule). Keep both sides importing this one
// value, same pattern as MAX_SESSION_HOURS.
export const WITHDRAW_CUTOFF_HOURS = 6;
