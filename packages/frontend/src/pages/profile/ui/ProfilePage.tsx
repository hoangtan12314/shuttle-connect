// pages/profile: entities/user useMe + features/update-profile/ProfileForm. Unlike
// pages/onboarding (full-screen, no AppShell), this route renders inside the normal shell --
// it's an ordinary signed-in page, not a one-time stopover.
import { useAuthUser } from '@/features/auth';
import { useMe } from '@/entities/user';
import { ProfileForm } from '@/features/update-profile';
import { Skeleton } from '@/shared/ui/skeleton';
import { useT } from '@/shared/i18n';

export function ProfilePage() {
  const t = useT();
  const { isAuthenticated } = useAuthUser();
  const { data: me, isLoading } = useMe(isAuthenticated);

  if (isLoading || !me) {
    return (
      <div className="flex max-w-md flex-col gap-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">{t.profT}</h1>
        <p className="text-muted-foreground text-sm">{t.profSub}</p>
      </div>
      <ProfileForm me={me} />
    </div>
  );
}
