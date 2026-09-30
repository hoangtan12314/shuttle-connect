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
