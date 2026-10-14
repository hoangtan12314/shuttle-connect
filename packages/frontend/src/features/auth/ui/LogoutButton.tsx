import { Button } from '@/shared/ui/button';
import { useAuthUser } from '../model/use-auth-user';

export function LogoutButton() {
  const { signOut } = useAuthUser();
  return <Button onClick={signOut}>Log out</Button>;
}
