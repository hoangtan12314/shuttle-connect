import { Button } from '@/shared/ui/button';
import { useT } from '@/shared/i18n';
import { useAuthUser } from '../model/use-auth-user';

export function LoginButton({ className }: { className?: string }) {
  const { signIn } = useAuthUser();
  const t = useT();
  return (
    <Button onClick={signIn} className={className}>
      {t.loginT}
    </Button>
  );
}
