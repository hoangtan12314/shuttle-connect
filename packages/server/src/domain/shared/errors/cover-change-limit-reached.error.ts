import { ErrorCode, MAX_COVER_CHANGES_PER_SESSION } from '@shuttle-connect/types';
import { ConflictError } from './conflict.error';

export class CoverChangeLimitReachedError extends ConflictError {
  readonly code = ErrorCode.COVER_CHANGE_LIMIT_REACHED;
  constructor() {
    super(
      `Cover photo change limit reached for this session (max ${MAX_COVER_CHANGES_PER_SESSION})`,
    );
  }
}
