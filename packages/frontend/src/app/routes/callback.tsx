// app/routes: '/callback' -> OIDC redirect target. react-oidc-context completes the code
// exchange on its own (AuthProvider sees ?code= in the URL); the page just waits for it.
import { createFileRoute } from '@tanstack/react-router';
import { AuthCallbackPage } from '@/pages/auth-callback';

export const Route = createFileRoute('/callback')({
  component: AuthCallbackPage,
  staticData: { bare: true, authFlow: true },
});
