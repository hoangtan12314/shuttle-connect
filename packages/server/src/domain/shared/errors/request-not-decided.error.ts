import { ErrorCode } from '@shuttle-connect/types';
import { ConflictError } from './conflict.error';

export class RequestNotDecidedError extends ConflictError {
  readonly code = ErrorCode.REQUEST_NOT_DECIDED;
  constructor() {
    super(`Request has not been decided yet, nothing to undo`);
  }
}
