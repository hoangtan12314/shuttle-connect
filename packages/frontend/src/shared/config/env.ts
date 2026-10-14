// shared/config: typed import.meta.env access (VITE_API_URL, VITE_COGNITO_*).
export const CONFIG = {
  apiUrl: import.meta.env.VITE_API_URL,
  cognitoAuthority: import.meta.env.VITE_COGNITO_AUTHORITY,
  cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  cognitoDomain: import.meta.env.VITE_COGNITO_DOMAIN,
  cognitoRedirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
};
