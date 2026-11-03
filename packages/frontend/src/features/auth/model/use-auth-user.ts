import { useAuth } from 'react-oidc-context';
import { CONFIG } from '@/shared/config';
import { useAuthPromptStore } from '@/shared/lib';

export function useAuthUser() {
  const auth = useAuth();

  const signIn = () => auth.signinRedirect();

  const signOut = async () => {
    // Set synchronously, before anything async -- see auth-prompt-store.ts's comment on
    // isSigningOut for why: removeUser() flips isAuthenticated to false, which the root
    // layout's requiresAuth gate would otherwise treat as "needs the sign-in prompt," right as
    // we're intentionally leaving the app anyway.
    useAuthPromptStore.getState().startSigningOut();
    try {
      await auth.removeUser(); // clears react-oidc-context's own stored session
      const logoutUrl = `${CONFIG.cognitoDomain}/logout?client_id=${CONFIG.cognitoClientId}&logout_uri=${encodeURIComponent(window.location.origin)}`;
      window.location.href = logoutUrl;
    } catch (err) {
      // The redirect never happened -- don't leave the app permanently convinced a sign-out is
      // still in progress.
      useAuthPromptStore.getState().stopSigningOut();
      throw err;
    }
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
