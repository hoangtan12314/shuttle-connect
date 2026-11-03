import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { useAuthPromptStore } from '@/shared/lib';
import { useAuthUser } from '@/features/auth';
import { useT } from '@/shared/i18n';

// Mounted once, globally (AppProviders.tsx), next to <Toaster /> -- it's always in the tree,
// just hidden until something opens it. Combines shared/lib's store (so shared/api's
// query-client can trigger it from a plain function, not a hook) with features/auth's signIn,
// which is why this composition lives in app/, not shared/ -- the same reasoning AppShell
// already follows for combining features/auth + entities/user.
export function AuthPromptModal() {
  const t = useT();
  const { signIn } = useAuthUser();
  const isOpen = useAuthPromptStore((state) => state.isOpen);
  const close = useAuthPromptStore((state) => state.close);

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.authPromptTitle}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={close}>{t.cancelL}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              close();
              signIn();
            }}
          >
            {t.loginT}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
