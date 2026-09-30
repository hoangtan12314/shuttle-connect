/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "infra",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const infra = await import("./infra");
    return {
      api: infra.api.url,
      userPoolId: infra.userPool.id,
      userPoolClientId: infra.userPoolClient.id,
    };
  },
});
