import { sessionFunction, courtFunction, requestFunction, userFunction } from "./function";

export const api = new sst.aws.ApiGatewayV2("shuttle-connect-api", {
  cors: {
    allowMethods: ["*"],
    allowOrigins: ["http://localhost:5173"],
  },
});

// Explicit methods (not ANY) on purpose: an ANY/{proxy+} route also matches OPTIONS, which
// stops API Gateway's automatic CORS preflight handling and forwards the preflight straight to
// the Lambda (and, for protected routes, the AuthGuard) instead -- see CLAUDE.md's CORS note.
api.route("GET /sessions", sessionFunction.arn);
api.route("POST /sessions", sessionFunction.arn);
api.route("GET /sessions/{proxy+}", sessionFunction.arn);
api.route("PATCH /sessions/{proxy+}", sessionFunction.arn);
api.route("GET /courts", courtFunction.arn);
api.route("POST /courts", courtFunction.arn);
api.route("GET /courts/{proxy+}", courtFunction.arn);
api.route("POST /requests", requestFunction.arn);
api.route("GET /requests/{proxy+}", requestFunction.arn);
api.route("GET /users/{proxy+}", userFunction.arn);
api.route("PATCH /users/{proxy+}", userFunction.arn);
