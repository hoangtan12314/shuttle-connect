import { ErrorCode } from '@shuttle-connect/types';
import { ValidationError } from './validation.error';

export class InvalidCoverUploadError extends ValidationError {
  readonly code = ErrorCode.INVALID_COVER_UPLOAD;
  constructor(reason: string) {
    super(`Invalid cover upload: ${reason}`);
  }
}
