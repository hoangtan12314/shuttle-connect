import { useAuth } from 'react-oidc-context';
import { CONFIG } from '@/shared/config';

export function useAuthUser() {
  const auth = useAuth();

  const signIn = () => auth.signinRedirect();

  const signOut = async () => {
    await auth.removeUser(); // clears react-oidc-context's own stored session
    const logoutUrl = `${CONFIG.cognitoDomain}/logout?client_id=${CONFIG.cognitoClientId}&logout_uri=${encodeURIComponent(window.location.origin)}`;
    window.location.href = logoutUrl;
  };

  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    // Set when the OIDC redirect/callback fails (e.g. Cognito returns ?error=..., or the code
    // exchange is rejected) -- the callback page shows a retry state instead of spinning forever.
    error: auth.error,
    user: auth.user,
    signIn,
    signOut,
  };
}
