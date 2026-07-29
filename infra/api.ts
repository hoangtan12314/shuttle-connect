import { sessionFunction } from "./function";

const api = new sst.aws.ApiGatewayV2("shuttle-connect-api", {
  cors: {
    allowMethods: ["*"],
    allowOrigins: ["http://localhost:5173"],
  },
});

api.route("ANY /sessions/{proxy+}", sessionFunction.arn);
api.route("ANY /sessions", sessionFunction.arn);