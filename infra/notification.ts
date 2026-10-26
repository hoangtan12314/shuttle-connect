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

// Notifies the host when a join request is withdrawn, decoupled from WithdrawRequestUseCase --
// see CLAUDE.md / the plan for why Streams instead of writing the notification inside the
// withdraw transaction (reliability: a notification failure never rolls back the withdraw).
table.subscribe(
  "request-withdrawn",
  {
    handler:
      "packages/server/src/infrastructure/function/stream/request-withdrawn.handler.handler",
    link: [table],
    logging: {
      retention: "1 month",
    },
    nodejs: streamEsbuildConfig,
  },
  {
    // Evaluated by AWS before the Lambda is invoked -- approvals, rejections and court creations
    // never cost an invocation. Request items are keyed REQUEST#USER#<id>, so begins_with on SK
    // is enough to scope this to request rows only.
    filters: [
      {
        dynamodb: {
          Keys: { SK: { S: [{ prefix: "REQUEST#" }] } },
          OldImage: { status: { S: ["PENDING", "APPROVED"] } },
          NewImage: { status: { S: ["WITHDRAWN"] } },
        },
      },
    ],
    transform: {
      // Caps retries on a "poison" record instead of letting it block later notifications for
      // up to 24h -- see the plan's fee-trap note.
      eventSourceMapping: {
        maximumRetryAttempts: 3,
        bisectBatchOnFunctionError: true,
      },
    },
  },
);
