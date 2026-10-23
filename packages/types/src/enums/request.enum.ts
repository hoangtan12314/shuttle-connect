export enum RequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  // Requester-initiated, from PENDING or APPROVED (never REJECTED -- that's the host's call, not
  // reversible by the requester). A new enum member on purpose, not boolean-ish reuse of an
  // existing status: every exhaustive Record<RequestStatus, ...> map (requestStatusNames,
  // RequestStatusBadge) must fail to compile until it accounts for this, per CLAUDE.md's own
  // stated philosophy -- a missed case should be a compile error, not a blank render.
  WITHDRAWN = "WITHDRAWN",
}
