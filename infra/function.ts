import { userPool, userPoolClient } from "./auth";
import { table } from "./database";
import { mediaBucket, mediaCdn } from "./storage";

export const externalEsbuildConfig = {
  esbuild: {
    external: [
      "@aws-sdk/*",
      "@nestjs/microservices",
      "@nestjs/microservices/microservices-module",
      "@nestjs/websockets",
      "@nestjs/websockets/socket-module",
    ],
  },
};

export const sessionFunction = new sst.aws.Function("session-handler", {
  handler:
    "packages/server/src/infrastructure/function/lambda/session.lambda.handler",
  link: [table, userPool, userPoolClient, mediaBucket, mediaCdn],
  logging: {
    retention: "1 month",
  },
  // Cover uploads only ever need @aws-sdk/client-s3 (for PutObject/DeleteObject) and `multer`
  // (pure JS, no native bindings) -- both covered by the blanket "@aws-sdk/*" external and the
  // default bundling every other function here already uses. The earlier version of this
  // feature needed its own esbuild config to bundle @aws-sdk/s3-presigned-post (not part of the
  // runtime's SDK -- the same trap as @aws-sdk/util-dynamodb in infra/notification.ts); proxying
  // uploads through this Lambda instead of a presigned URL removed that dependency entirely.
  nodejs: externalEsbuildConfig,
});

export const courtFunction = new sst.aws.Function("court-handler", {
  handler:
    "packages/server/src/infrastructure/function/lambda/court.lambda.handler",
  link: [table, userPool, userPoolClient],
  logging: {
    retention: "1 month",
  },
  nodejs: externalEsbuildConfig,
});

export const requestFunction = new sst.aws.Function("request-handler", {
  handler:
    "packages/server/src/infrastructure/function/lambda/request.lambda.handler",
  // mediaCdn is linked for a reason that isn't visible from this Lambda's own routes: the use
  // cases here (join, decide, undo, withdraw) load the session through SessionRepositoryDynamoDB,
  // and SessionMapper builds a session's coverUrl from the CDN's URL -- but only for a session
  // that has a cover, so without this link everything works until the first covered session is
  // joined, then every call on it 500s ("shuttle-connect-media-cdn is not linked").
  link: [table, userPool, userPoolClient, mediaCdn],
  logging: {
    retention: "1 month",
  },
  nodejs: externalEsbuildConfig,
});

export const userFunction = new sst.aws.Function("user-handler", {
  handler:
    "packages/server/src/infrastructure/function/lambda/user.lambda.handler",
  link: [table, userPool, userPoolClient],
  logging: {
    retention: "1 month",
  },
  nodejs: externalEsbuildConfig,
});
