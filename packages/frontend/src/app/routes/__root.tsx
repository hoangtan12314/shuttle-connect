import {
  createRootRoute,
  Navigate,
  Outlet,
  useMatches,
} from '@tanstack/react-router';
import { AppShell } from '@/widgets/app-shell';
import { useAuthUser } from '@/features/auth';
import { useMe } from '@/entities/user';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  // Routes describe themselves through staticData flags rather than this layout hardcoding a list
  // of pathnames: `bare` = render without AppShell, `authFlow` = part of signing in, so the
  // onboarding gate below leaves it alone.
  const { bare, authFlow } = useMatches({
    select: (matches) => ({
      bare: matches.some((match) => match.staticData.bare),
      authFlow: matches.some((match) => match.staticData.authFlow),
    }),
  });

  // Onboarding gate. Lives here, in the app layer, because it combines two slices -- features/auth
  // (signed in?) and entities/user (onboarded?) -- and a feature importing another feature would
  // be a sideways import. Signed-out visitors are never gated: public pages stay public.
  const { isAuthenticated } = useAuthUser();
  const { data: me, isPending: isMePending } = useMe(isAuthenticated);
  const gated = isAuthenticated && !authFlow;

  if (gated && me && !me.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  // Signed in but `me` hasn't arrived yet (first load only -- it's cached after): show the shell
  // with an empty outlet instead of flashing a page we might immediately redirect away from.
  const page = gated && isMePending ? null : <Outlet />;

  if (bare) return page;

  return <AppShell>{page}</AppShell>;
}
