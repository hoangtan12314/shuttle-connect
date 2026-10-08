import { ErrorCode } from '@shuttle-connect/types';
import { ConflictError } from './conflict.error';

export class DuplicateRequestError extends ConflictError {
  readonly code = ErrorCode.DUPLICATE_REQUEST;
  constructor() {
    super(`Request already sent`);
  }
}
