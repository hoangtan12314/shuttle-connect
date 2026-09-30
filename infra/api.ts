import { sessionFunction, courtFunction, requestFunction } from "./function";

export const api = new sst.aws.ApiGatewayV2("shuttle-connect-api", {
  cors: {
    allowMethods: ["*"],
    allowOrigins: ["http://localhost:5173"],
  },
});

api.route("ANY /sessions/{proxy+}", sessionFunction.arn);
api.route("ANY /sessions", sessionFunction.arn);
api.route("ANY /courts/{proxy+}", courtFunction.arn);
api.route("ANY /courts", courtFunction.arn);
api.route("ANY /requests/{proxy+}", requestFunction.arn);
api.route("ANY /requests", requestFunction.arn);
