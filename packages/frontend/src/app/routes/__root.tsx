import { useEffect } from 'react';
import {
  createRootRoute,
  Navigate,
  Outlet,
  useMatches,
} from '@tanstack/react-router';
import { AppShell } from '@/widgets/app-shell';
import { useAuthUser } from '@/features/auth';
import { useMe } from '@/entities/user';
import { useAuthPromptStore } from '@/shared/lib';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  // Routes describe themselves through staticData flags rather than this layout hardcoding a list
  // of pathnames: `bare` = render without AppShell, `authFlow` = part of signing in, so the
  // onboarding gate below leaves it alone, `requiresAuth` = signed-in-only page (see below).
  const { bare, authFlow, requiresAuth } = useMatches({
    select: (matches) => ({
      bare: matches.some((match) => match.staticData.bare),
      authFlow: matches.some((match) => match.staticData.authFlow),
      requiresAuth: matches.some((match) => match.staticData.requiresAuth),
    }),
  });

  const { isAuthenticated, isLoading: isAuthLoading } = useAuthUser();
  const { data: me, isPending: isMePending } = useMe(isAuthenticated);
  const gated = isAuthenticated && !authFlow;

  // A signed-in-only page (/activity, /notifications, /profile, /sessions/new,
  // /sessions/$id/manage), visited while signed out: redirect to Browse and open the shared
  // "please sign in" prompt (AuthPromptModal, mounted globally in AppProviders) instead of
  // rendering a page with nothing authenticated to show. Waits for isAuthLoading to resolve
  // first -- otherwise an already-logged-in user would flash this redirect for one render while
  // the initial OIDC silent-signin check is still settling.
  // isSigningOut: an intentional sign-out in flight (features/auth's signOut) looks identical to
  // this gate for one render -- isAuthenticated already flipped false, but the user isn't
  // trying to use a locked feature, they're about to be redirected to Cognito's logout page.
  // Without this, logging out from e.g. /notifications flashes this prompt open and closed for
  // no reason.
  const openAuthPrompt = useAuthPromptStore((state) => state.open);
  const isSigningOut = useAuthPromptStore((state) => state.isSigningOut);
  const needsAuthPrompt =
    requiresAuth && !isAuthLoading && !isAuthenticated && !isSigningOut;

  useEffect(() => {
    if (needsAuthPrompt) openAuthPrompt();
  }, [needsAuthPrompt, openAuthPrompt]);

  if (needsAuthPrompt) {
    return <Navigate to="/" replace />;
  }

  // Onboarding gate. Lives here, in the app layer, because it combines two slices -- features/auth
  // (signed in?) and entities/user (onboarded?) -- and a feature importing another feature would
  // be a sideways import. Signed-out visitors are never gated: public pages stay public.
  if (gated && me && !me.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  // Signed in but `me` hasn't arrived yet (first load only -- it's cached after): show the shell
  // with an empty outlet instead of flashing a page we might immediately redirect away from.
  const page = gated && isMePending ? null : <Outlet />;

  if (bare) return page;

  return <AppShell>{page}</AppShell>;
}
