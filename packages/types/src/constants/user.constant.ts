// Shared with both the frontend's onboarding/profile forms (client-side guard/UX) and the
// server's User domain entity (the actual enforced rule) -- same reasoning as MAX_SESSION_HOURS.
// Not to be confused with court's own, separately-scoped name-length bounds (domain/court).
export const MIN_FULL_NAME_LENGTH = 1;
export const MAX_FULL_NAME_LENGTH = 50;
