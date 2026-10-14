// app/routes: '/callback' -> OIDC redirect target, completes sign-in then navigates away

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';

export const Route = createFileRoute('/callback')({ component: CallbackPage });

function CallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) navigate({ to: '/' });
  }, [auth.isAuthenticated, navigate]);

  return <div>Signing you in...</div>;
}
