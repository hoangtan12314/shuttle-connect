export const table = new sst.aws.Dynamo("shuttle-connect", {
  fields: {
    PK: "string",
    SK: "string",
    GSI1PK: "string",
    GSI1SK: "number",
    GSI2PK: "string",
    GSI2SK: "string",
  },
  primaryIndex: { hashKey: "PK", rangeKey: "SK" },
  // Feeds the request-withdrawn stream subscriber (infra/notification.ts) -- new-and-old-images
  // so it can tell PENDING/APPROVED -> WITHDRAWN transitions apart from every other write.
  stream: "new-and-old-images",
  // NOTIF# items carry expires_at (epoch seconds); DynamoDB deletes them for free once it's past,
  // so the notifications list doesn't grow forever (documentation/DATABASE_DESIGN.md).
  ttl: "expires_at",
  globalIndexes: {
    // Sessions (SLOC#<city>#<district>, start_time) and courts (CLOC#<city>#<district>, created_at)
    // share this index in separate partitions -- "browse sessions in a district" and "list courts
    // in a district" are both an exact-match GSI1PK query. Requests carry no GSI1 keys at all, so
    // they can never appear here.
    GSI1: { hashKey: "GSI1PK", rangeKey: "GSI1SK" },
    // "What is this person involved in?" -- USER#<id> partitions containing SESSION#<start_time>
    // rows (sessions they host) and REQUEST#<start_time> rows (sessions they've asked to join),
    // sorted by when the session happens. See documentation/DATABASE_DESIGN.md.
    GSI2: { hashKey: "GSI2PK", rangeKey: "GSI2SK" },
  },
});
