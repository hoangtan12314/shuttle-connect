import {
  MAX_JOINS_PER_SESSION,
  REJOIN_COOLDOWN_MINUTES,
} from '@shuttle-connect/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { useT } from '@/shared/i18n';

// Withdrawing has real, delayed-until-later consequences (the rejoin cap and cooldown), so it
// gets a confirmation step instead of firing on click like most other actions in this app --
// the player should know what withdrawing costs *before* they've done it, not find out the next
// time they try to rejoin.
export function WithdrawConfirmDialog({
  joinCount,
  disabled,
  isWithdrawing,
  onConfirm,
}: {
  // How many times this player has ever joined this session (including the current join) --
  // Request.assertCanRejoin's own input, mirrored here for display only.
  joinCount: number;
  disabled?: boolean;
  isWithdrawing: boolean;
  onConfirm: () => void;
}) {
  const t = useT();
  const remainingRejoins = Math.max(0, MAX_JOINS_PER_SESSION - joinCount);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={disabled || isWithdrawing}>
          {t.withdrawBtn}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.withdrawConfirmTitle}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-2 text-left">
              <p>
                {remainingRejoins > 0
                  ? `${t.withdrawConfirmRejoinsLead} ${remainingRejoins} ${
                      remainingRejoins === 1
                        ? t.withdrawConfirmTimeSingular
                        : t.withdrawConfirmTimePlural
                    }`
                  : t.withdrawConfirmLastChance}
              </p>
              <p>
                {t.withdrawConfirmCooldownLead} {REJOIN_COOLDOWN_MINUTES}{' '}
                {t.minUnit} {t.withdrawConfirmCooldownTrail}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.cancelL}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isWithdrawing}>
            {t.withdrawConfirmBtn}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
