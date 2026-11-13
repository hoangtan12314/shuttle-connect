import { sessionFunction, courtFunction, requestFunction, userFunction } from "./function";

// One path for both the route registration and its routeSettings entry, so the throttle can't
// silently stop applying because the two strings drifted apart. Route keys include the /api/v1
// prefix that v1() adds. A specific route like this one takes precedence over the catch-all
// PATCH /sessions/{proxy+} below for this exact path, so cover uploads get their own throttle
// without pulling withdraw/decide-request (which also go through that catch-all) into it.
const COVER_PATH = "/sessions/{id}/cover";

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
      // TEMPORARILY DISABLED for the first deploy of the PATCH /sessions/{id}/cover route.
      // new sst.aws.ApiGatewayV2(...) creates the Stage resource (routeSettings included)
      // synchronously inside its own constructor, before any api.route(...) call below has run --
      // so on a brand-new route, AWS rejects the Stage update with "Unable to find Route by key"
      // (confirmed: this exact failure, 2026-11-12). Fix: deploy once with this block commented
      // out so the route exists, then uncomment and deploy again -- by then the route is already
      // real, so the Stage update finds it. Re-enable right after that second deploy succeeds.
      //
      // Its own, much tighter throttle for cover uploads. The per-user limit in the app
      // (RateLimiter, 20/hour) can't help here: it runs inside the Lambda, after API Gateway, so a
      // flood still spends this throttle first. Giving the route its own small budget means a
      // flood of upload requests can only slow cover uploads, never browsing or joining.
      // Real use is a handful per host per hour, so 5/s app-wide is far above normal.
      routeSettings: [
        {
          routeKey: `PATCH /api/v1${COVER_PATH}`,
          throttlingRateLimit: 5,
          throttlingBurstLimit: 10,
        },
      ],
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
// The exact path, not folded into the PATCH /sessions/{proxy+} catch-all below: the route-level
// throttle above targets this one endpoint, and withdraw/decide-request shouldn't share (or
// dilute) that budget.
v1("PATCH", COVER_PATH, sessionFunction);
v1("PATCH", "/sessions/{proxy+}", sessionFunction);
v1("GET", "/courts", courtFunction);
v1("POST", "/courts", courtFunction);
v1("GET", "/courts/{proxy+}", courtFunction);
v1("POST", "/requests", requestFunction);
v1("GET", "/requests/{proxy+}", requestFunction);
v1("GET", "/users/{proxy+}", userFunction);
v1("PATCH", "/users/{proxy+}", userFunction);
