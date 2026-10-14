import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';
import { queryClient } from '@/shared/api';
import { CONFIG } from '@/shared/config';
import { routeTree } from '../routeTree.gen';
import { Toaster } from '@/shared/ui/sonner';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const oidcConfig = {
  authority: CONFIG.cognitoAuthority,
  client_id: CONFIG.cognitoClientId,
  redirect_uri: CONFIG.cognitoRedirectUri,
  response_type: 'code',
  scope: 'openid email profile',
  // oidc-client-ts defaults to sessionStorage (cleared on tab close). We use localStorage
  // explicitly -- shared/api/client.ts's getIdToken() reads this same storage directly (it's a
  // plain function, not a hook, so it can't call useAuth()) and must agree on which one.
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider {...oidcConfig}>
        <Toaster />
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
