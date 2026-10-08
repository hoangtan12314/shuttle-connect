import { ErrorCode } from '@shuttle-connect/types';
import { ConflictError } from './conflict.error';

export class RequestAlreadyDecidedError extends ConflictError {
  readonly code = ErrorCode.REQUEST_ALREADY_DECIDED;
  constructor() {
    super(`Request already decided`);
  }
}
