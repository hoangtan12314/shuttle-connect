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
type Method = "GET" | "POST" | "PATCH";
const v1 = (method: Method, path: string, fn: sst.aws.Function) =>
  api.route(`${method} /api/v1${path}`, fn.arn);

v1("GET", "/sessions", sessionFunction);
v1("POST", "/sessions", sessionFunction);
v1("GET", "/sessions/{proxy+}", sessionFunction);
v1("PATCH", "/sessions/{proxy+}", sessionFunction);
v1("GET", "/courts", courtFunction);
v1("POST", "/courts", courtFunction);
v1("GET", "/courts/{proxy+}", courtFunction);
v1("POST", "/requests", requestFunction);
v1("GET", "/requests/{proxy+}", requestFunction);
v1("GET", "/users/{proxy+}", userFunction);
v1("PATCH", "/users/{proxy+}", userFunction);
