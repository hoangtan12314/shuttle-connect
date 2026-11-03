import { ErrorCode, MAX_JOINS_PER_SESSION } from '@shuttle-connect/types';
import { ConflictError } from './conflict.error';

export class JoinLimitReachedError extends ConflictError {
  readonly code = ErrorCode.JOIN_LIMIT_REACHED;
  constructor() {
    super(`Join limit reached for this session (max ${MAX_JOINS_PER_SESSION} joins)`);
  }
}
