import { table } from "./database";

// Unlike externalEsbuildConfig (infra/function.ts), @aws-sdk/util-dynamodb is NOT part of
// Lambda's bundled AWS SDK v3 -- only the DynamoDB clients are. Externalizing it here (the way
// every other @aws-sdk/* package is externalized) would deploy a Lambda that throws "Cannot
// find module '@aws-sdk/util-dynamodb'" on its first real invocation; `sst dev`'s Live Lambda
// runs this handler straight from local node_modules, so that failure is invisible there --
// it only appears post-deploy. So this function gets its own esbuild config: the DynamoDB
// clients stay external (genuinely provided by the runtime, same as every other Lambda here),
// util-dynamodb gets bundled into the zip instead.
const streamEsbuildConfig = {
  esbuild: {
    external: [
      "@aws-sdk/client-dynamodb",
      "@aws-sdk/lib-dynamodb",
      "@nestjs/microservices",
      "@nestjs/microservices/microservices-module",
      "@nestjs/websockets",
      "@nestjs/websockets/socket-module",
    ],
  },
};

// Catches a crashing Lambda after it exhausts maximumRetryAttempts below -- without this, a
// failing batch is just silently dropped (the 2026-10-25 bug). With every request-lifecycle
// action now flowing through this one Lambda, a crash would otherwise lose all of them, not
// just withdrawals. Free at this project's scale (SQS's 1M-requests/month free tier).
const requestStatusChangedDlq = new sst.aws.Queue("request-status-changed-dlq");

// Notifies the right person about every step of a join request -- the host when someone
// joins/rejoins or withdraws, the player when the host approves or rejects (host undoing a
// decision retracts the player's earlier notice instead of sending a new one). Decoupled from
// the use cases that actually change a request's status -- see CLAUDE.md / the plan for why
// Streams instead of writing the notification inside those transactions (reliability: a
// notification failure never rolls back the status change).
table.subscribe(
  "request-status-changed",
  {
    handler:
      "packages/server/src/infrastructure/function/stream/request-status-changed.handler.handler",
    link: [table, requestStatusChangedDlq],
    logging: {
      retention: "1 month",
    },
    nodejs: streamEsbuildConfig,
  },
  {
    // Evaluated by AWS before the Lambda is invoked -- court creations and session edits never
    // cost an invocation. One broad filter (an event source mapping allows at most 5, and the
    // six old->new status transitions this Lambda cares about would already exceed that) --
    // classifyTransition (infrastructure/function/stream/classify-transition.ts) does the
    // precise dispatch in code instead. Every INSERT/MODIFY of a request row is some status
    // change, so this costs nothing extra in practice.
    filters: [
      {
        eventName: ["INSERT", "MODIFY"],
        dynamodb: { Keys: { SK: { S: [{ prefix: "REQUEST#" }] } } },
      },
    ],
    transform: {
      eventSourceMapping: {
        // Caps retries on a "poison" record instead of letting it block later notifications for
        // up to 24h -- see the plan's fee-trap note.
        maximumRetryAttempts: 3,
        bisectBatchOnFunctionError: true,
        // A batch that still fails after all retries lands here instead of being dropped.
        destinationConfig: { onFailure: { destinationArn: requestStatusChangedDlq.arn } },
      },
    },
  },
);
