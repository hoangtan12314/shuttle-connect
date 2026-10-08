import { ErrorCode } from '@shuttle-connect/types';
import { ValidationError } from './validation.error';

export class InvalidSessionTimeError extends ValidationError {
  readonly code = ErrorCode.INVALID_SESSION_TIME;
  constructor(startTime: Date, endTime: Date) {
    super(
      `Invalid session time: startTime (${startTime.toISOString()}) must be before endTime (${endTime.toISOString()}).`,
    );
  }
}
