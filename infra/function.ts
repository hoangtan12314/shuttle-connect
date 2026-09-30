import { userPool, userPoolClient } from "./auth";
import { table } from "./database";

const externalEsbuildConfig = {
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
  link: [table, userPool, userPoolClient],
  logging: {
    retention: "1 month",
  },
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
  link: [table, userPool, userPoolClient],
  logging: {
    retention: "1 month",
  },
  nodejs: externalEsbuildConfig,
});
