import { createRootRoute, Outlet, useMatches } from '@tanstack/react-router';
import { AppShell } from '@/widgets/app-shell';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  // A route opts out of the shell with `staticData: { bare: true }` -- a flag on the route
  // itself, rather than this layout hardcoding a list of pathnames.
  const bare = useMatches({
    select: (matches) => matches.some((match) => match.staticData.bare),
  });

  if (bare) return <Outlet />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
