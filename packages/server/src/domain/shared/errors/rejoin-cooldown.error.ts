import { ErrorCode } from '@shuttle-connect/types';
import { TooManyRequestsError } from './too-many-requests.error';

export class RejoinCooldownError extends TooManyRequestsError {
  readonly code = ErrorCode.REJOIN_COOLDOWN;
  constructor(remainingMinutes: number) {
    super(`Too soon to rejoin -- try again in ${remainingMinutes} min`);
  }
}
