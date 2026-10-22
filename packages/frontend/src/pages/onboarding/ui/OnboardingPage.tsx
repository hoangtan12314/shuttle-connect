// pages/onboarding: one-time first-login screen (name + skill level), full-screen without AppShell
// (route sets `staticData: { bare: true }`), continuing the visual flow of the "Signing you in"
// page. The design's player illustration is skipped; the form sits centered. The root layout's
// gate sends signed-in users without `onboarded` here; this page sends everyone else away.
import { Navigate } from '@tanstack/react-router';
import { useAuthUser } from '@/features/auth';
import { OnboardingForm } from '@/features/complete-onboarding';
import { useMe } from '@/entities/user';
import { AuthBackdrop, AuthLogo } from '@/shared/ui/auth-backdrop';
import { useT } from '@/shared/i18n';

export function OnboardingPage() {
  const t = useT();
  const { isAuthenticated, isLoading: isAuthLoading, signOut } = useAuthUser();
  const { data: me } = useMe(isAuthenticated);

  // Nothing to onboard: signed out, or already done (e.g. visiting /onboarding directly).
  if (!isAuthLoading && !isAuthenticated) return <Navigate to="/" replace />;
  if (me?.onboarded) return <Navigate to="/" replace />;

  return (
    <div className="bg-background relative flex min-h-svh flex-col items-center overflow-hidden px-6">
      <AuthBackdrop variant="onboarding" />

      <main className="relative flex w-full max-w-md flex-1 flex-col justify-center gap-8 py-12">
        <AuthLogo className="self-start" />

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl leading-tight font-extrabold md:text-4xl">
            {t.welcomeT}
          </h1>
          <p className="text-muted-foreground md:text-lg">{t.welcomeB}</p>
        </div>

        <OnboardingForm />

        {/* Not in the design: an honest way out for someone who doesn't want to continue. */}
        <button
          type="button"
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground -mt-4 cursor-pointer self-center text-sm underline-offset-4 hover:underline"
        >
          {t.logoutL}
        </button>
      </main>

      <p className="text-muted-foreground relative pb-6 text-xs md:absolute md:right-10 md:bottom-8 md:pb-0">
        {t.tagline}
      </p>
    </div>
  );
}
