import { LoginButton, LogoutButton, useAuthUser } from '@/features/auth';

export function AppHeader() {
  const { isAuthenticated, isLoading, user } = useAuthUser();

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <span className="font-semibold">Shuttle Connect</span>
      {isLoading ? null : isAuthenticated ? (
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">
            {user?.profile.name}
          </span>
          <LogoutButton />
        </div>
      ) : (
        <LoginButton />
      )}
    </header>
  );
}
