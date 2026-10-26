import { ErrorCode, WITHDRAW_CUTOFF_HOURS } from '@shuttle-connect/types';
import { ConflictError } from './conflict.error';

export class WithdrawalWindowClosedError extends ConflictError {
  readonly code = ErrorCode.WITHDRAWAL_WINDOW_CLOSED;
  constructor() {
    super(
      `Approved request cannot be withdrawn within ${WITHDRAW_CUTOFF_HOURS} hours of the session start`,
    );
  }
}
