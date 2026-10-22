// pages/auth-callback: the full-screen "Signing you in…" screen shown at /callback while
// react-oidc-context exchanges Cognito's ?code= for tokens. Rendered without AppShell (the route
// sets `staticData: { bare: true }`). The design's court illustration below the logo is skipped
// for now -- the decorative blobs + logo + status block carry the screen on their own.
import { useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { CircleAlert, RefreshCw } from 'lucide-react';
import { useAuthUser } from '@/features/auth';
import { Button } from '@/shared/ui/button';
import { useT } from '@/shared/i18n';

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* top-left: soft blob + one thin sweeping line */}
      <div className="bg-accent-100/70 absolute -top-24 -left-24 size-48 rounded-full md:-top-32 md:-left-32 md:size-80" />
      <svg
        className="text-accent-300 absolute top-0 left-0 h-36 w-48 md:h-56 md:w-72"
        viewBox="0 0 288 224"
        fill="none"
      >
        <path
          d="M0 224C40 170 120 130 180 110C230 92 270 50 288 0"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      {/* bottom-right: two overlapping blobs */}
      <div className="bg-accent-100/70 absolute -right-20 -bottom-32 size-56 rounded-full md:-right-24 md:-bottom-40 md:size-96" />
      <div className="bg-primary-100/60 absolute -right-10 -bottom-14 size-40 rounded-full md:-bottom-16 md:size-72" />
    </div>
  );
}

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
      <Backdrop />

      <img
        src="/shuttle-connect-logo-horizontal.png"
        alt="Shuttle Connect"
        // The PNG has an opaque near-white background, not transparency. mix-blend-darken keeps
        // the darker of logo vs. backdrop per pixel, so the artwork stays and the near-white box
        // takes on the page/blob color behind it (multiply left a faint grey box). A transparent
        // export of the logo would make this unnecessary.
        className="relative mt-16 h-9 w-auto mix-blend-darken md:mt-24 md:h-11 dark:mix-blend-normal"
      />

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
