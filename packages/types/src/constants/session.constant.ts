// Shared with both the frontend's create-session form (client-side guard/UX) and the server's
// Session domain entity (the actual enforced rule). Keep both sides importing this one value.
export const MAX_SESSION_HOURS = 6;
