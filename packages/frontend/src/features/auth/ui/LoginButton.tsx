import { Button } from '@/shared/ui/button';
import { useAuthUser } from '../model/use-auth-user';

export function LoginButton() {
  const { signIn } = useAuthUser();
  return <Button onClick={signIn}>Log in</Button>;
}
