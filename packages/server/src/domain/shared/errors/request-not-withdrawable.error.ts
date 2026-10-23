import { ErrorCode } from '@shuttle-connect/types';
import { ConflictError } from './conflict.error';

export class RequestNotWithdrawableError extends ConflictError {
  readonly code = ErrorCode.REQUEST_NOT_WITHDRAWABLE;
  constructor() {
    super(`Request cannot be withdrawn from its current status`);
  }
}
