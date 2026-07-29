export const table = new sst.aws.Dynamo("shuttle-connect", {
  fields: {
    PK: "string",
    SK: "string",
    location: "string",
    start_time: "number",
    user_id: "string",
    created_at: "number",
    court_id: "string",
  },
  primaryIndex: { hashKey: "PK", rangeKey: "SK" },
  globalIndexes: {
    LocationIndex: {
      hashKey: "location",
      rangeKey: "start_time",
    },
    HostRequestsIndex: {
      hashKey: "user_id",
      rangeKey: "created_at",
    },
    CourtIndex: {
      hashKey: "court_id",
      rangeKey: "created_at",
    },
  },
});
