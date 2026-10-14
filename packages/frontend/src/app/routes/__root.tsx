import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppHeader } from '@/widgets/app-header';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div>
      <AppHeader />
      <Outlet />
    </div>
  );
}
