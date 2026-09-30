export const userPool = new sst.aws.CognitoUserPool(
  "shuttle-connect-user-pool",
  {
    usernames: ["email"],
    domain: {
      prefix: $interpolate`shuttle-connect-${$app.stage}`,
    },
    transform: {
      userPool: {
        schemas: [
          {
            name: "name",
            attributeDataType: "String",
            required: true,
            mutable: true,
            stringAttributeConstraints: {
              minLength: "1",
              maxLength: "50",
            },
          },
        ],
      },
      
    },
  },
);

export const userPoolClient = userPool.addClient("Web", {
  transform: {
    client: {
      callbackUrls: ["http://localhost:5173/callback"],
      logoutUrls: ["http://localhost:5173"],
      allowedOauthFlows: ["code"],
      allowedOauthScopes: ["openid", "email", "profile"],
      allowedOauthFlowsUserPoolClient: true,
      supportedIdentityProviders: ["COGNITO"],
      explicitAuthFlows: [
        "ALLOW_USER_SRP_AUTH",
        "ALLOW_REFRESH_TOKEN_AUTH",
        ...($app.stage === "production" ? [] : ["ALLOW_USER_PASSWORD_AUTH"]),
      ]
    },
  },
});
