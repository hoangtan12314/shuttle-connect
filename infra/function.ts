import { table } from "./database";

export const sessionFunction = new sst.aws.Function("SessionHandler", {
  handler:
    "packages/server/src/infrastructure/function/lambda/session.lambda.handler",
  link: [table],
  logging: {
    retention: "1 month",
  },
  nodejs: {
    esbuild: {
      external: [
        "@aws-sdk/*",
        "@nestjs/microservices",
        "@nestjs/microservices/microservices-module",
        "@nestjs/websockets",
        "@nestjs/websockets/socket-module",
      ],
    },
  },
});
