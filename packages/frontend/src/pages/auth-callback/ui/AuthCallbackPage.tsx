// pages/auth-callback: the full-screen "Signing you in…" screen shown at /callback while
// react-oidc-context exchanges Cognito's ?code= for tokens. Rendered without AppShell (the route
// sets `staticData: { bare: true }`). The design's court illustration below the logo is skipped
// for now -- the decorative blobs + logo + status block carry the screen on their own.
import { useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { CircleAlert, RefreshCw } from 'lucide-react';
import { useAuthUser } from '@/features/auth';
import { Button } from '@/shared/ui/button';
import { AuthBackdrop, AuthLogo } from '@/shared/ui/auth-backdrop';
import { useT } from '@/shared/i18n';

export function AuthCallbackPage() {
  const t = useT();
  const navigate = useNavigate();
  const { isAuthenticated, error, signIn } = useAuthUser();

  useEffect(() => {
    // replace: the /callback?code=... entry is single-use -- going "back" to it would just show
    // this screen again with a spent code.
    if (isAuthenticated) navigate({ to: '/', replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="bg-background relative flex min-h-svh flex-col items-center overflow-hidden px-6">
      <AuthBackdrop />

      <AuthLogo className="mt-16 md:mt-24" />

      <div
        role="status"
        aria-live="polite"
        className="relative flex max-w-sm flex-1 flex-col items-center justify-center gap-4 pb-24 text-center"
      >
        {error ? (
          <>
            <span className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
              <CircleAlert className="size-6" />
            </span>
            <h1 className="text-2xl font-extrabold md:text-3xl">
              {t.signInFailT}
            </h1>
            <p className="text-muted-foreground">{t.signInFailB}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Button onClick={signIn}>
                <RefreshCw /> {t.tryAgain}
              </Button>
              <Button variant="outline" asChild>
                <Link to="/" replace>
                  {t.backList}
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold md:text-3xl">
              {t.signingInT}
            </h1>
            <p className="text-muted-foreground">{t.signingInB}</p>
            <span
              aria-hidden
              className="border-primary-100 border-t-primary mt-4 size-10 animate-spin rounded-full border-4"
            />
          </>
        )}
      </div>
    </div>
  );
}
