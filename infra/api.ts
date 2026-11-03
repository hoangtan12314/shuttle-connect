import { sessionFunction, courtFunction, requestFunction, userFunction } from "./function";

export const api = new sst.aws.ApiGatewayV2("shuttle-connect-api", {
  cors: {
    allowMethods: ["*"],
    allowOrigins: ["http://localhost:5173"],
  },
  transform: {
    // A global circuit breaker, not per-user fairness (HTTP APIs can't attach WAF directly for
    // that -- see the plan's "Not doing" section). Shared by every caller, so set generously:
    // its job is to stop a runaway client/script, not to divide capacity. A plain object here
    // shallow-merges onto SST's own stage defaults (apiId/autoDeploy/accessLogSettings), so this
    // only adds defaultRouteSettings without disturbing those.
    stage: {
      defaultRouteSettings: {
        throttlingRateLimit: 50,
        throttlingBurstLimit: 100,
      },
    },
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
