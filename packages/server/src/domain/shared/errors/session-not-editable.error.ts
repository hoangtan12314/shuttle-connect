import { ErrorCode } from '@shuttle-connect/types';
import { ValidationError } from './validation.error';

export class SessionNotEditableError extends ValidationError {
  readonly code = ErrorCode.SESSION_NOT_EDITABLE;
  constructor(reason: string) {
    super(`Session can't be edited: ${reason}`);
  }
}
