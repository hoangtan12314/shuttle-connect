// Shared with both the frontend's create-session form (client-side guard/UX) and the server's
// Session domain entity (the actual enforced rule). Keep both sides importing this one value.
export const MAX_SESSION_HOURS = 6;

// Cover photo limits. The server enforces these when the host's upload request lands (there's no
// separate ticket step -- see CLAUDE.md's cover-photo section). The frontend reads the same
// values to resize/encode before uploading, so an oversized or mistyped file never leaves the
// browser in the first place.
export const MAX_COVER_BYTES = 2 * 1024 * 1024;
// No SVG on purpose: it can carry script. WebP is what the browser encodes to; JPEG is the
// fallback for browsers that can't encode WebP.
export const COVER_CONTENT_TYPES = ["image/webp", "image/jpeg"] as const;
export type CoverContentType = (typeof COVER_CONTENT_TYPES)[number];
// How many times one session's cover can be set or replaced. Bounds storage costs a single host
// can cause, the same way MAX_JOINS_PER_SESSION bounds join churn.
export const MAX_COVER_CHANGES_PER_SESSION = 10;

// Per-user fixed-window rate limits, enforced by the server's RateLimiter (a DynamoDB counter).
// They bound what one account can make us do; they don't protect API Gateway's shared throttle
// (only WAF in front of the API could) -- see the dedicated route throttle in infra/api.ts.
export interface RateLimitRule {
  limit: number;
  windowSeconds: number;
}
// Cover-upload attempts (PATCH /sessions/:id/cover). A real host needs a handful per hour.
export const COVER_UPLOAD_LIMIT: RateLimitRule = { limit: 20, windowSeconds: 60 * 60 };
// Session creation. Also caps how far one account can multiply MAX_COVER_CHANGES_PER_SESSION.
export const SESSION_CREATE_LIMIT: RateLimitRule = { limit: 10, windowSeconds: 24 * 60 * 60 };
