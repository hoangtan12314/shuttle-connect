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
    user: auth.user,
    signIn,
    signOut,
  };
}
