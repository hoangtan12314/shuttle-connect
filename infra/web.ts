import { api } from "./api";
import { userPool, userPoolClient } from "./auth";

// Vite reads VITE_* at build/dev time (import.meta.env) -- see
// packages/frontend/src/shared/config/env.ts. `dev.command` makes
// `pnpm run sst:dev` start the actual Vite dev server with these injected,
// instead of SST trying to deploy a static site in dev mode.
export const web = new sst.aws.StaticSite("shuttle-connect-web", {
  path: "packages/frontend",
  build: {
    command: "pnpm run build",
    output: "dist",
  },
  dev: {
    command: "pnpm run dev",
  },
  environment: {
    VITE_API_URL: api.url,
    VITE_COGNITO_AUTHORITY: $interpolate`https://cognito-idp.${aws.getRegionOutput().name}.amazonaws.com/${userPool.id}`,
    VITE_COGNITO_CLIENT_ID: userPoolClient.id,
    // Non-null: infra/auth.ts always configures `domain` on the pool, so this is never
    // undefined in practice -- the type is just general-case (domain is optional on the
    // underlying component).
    VITE_COGNITO_DOMAIN: userPool.domainUrl!,
    VITE_COGNITO_REDIRECT_URI: "http://localhost:5173/callback",
  },
});
