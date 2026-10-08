import { ErrorCode } from '@shuttle-connect/types';
import { ConflictError } from './conflict.error';

export class ConcurrentUpdateError extends ConflictError {
  readonly code = ErrorCode.CONCURRENT_UPDATE;
  constructor() {
    super("Conflict with another update");
  }
}
