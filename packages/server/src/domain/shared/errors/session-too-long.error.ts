import { ErrorCode, MAX_SESSION_HOURS } from '@shuttle-connect/types';
import { ValidationError } from './validation.error';

export class SessionTooLongError extends ValidationError {
  readonly code = ErrorCode.SESSION_TOO_LONG;
  constructor(startTime: Date, endTime: Date) {
    super(
      `Session is too long: startTime (${startTime.toISOString()}) to endTime ` +
        `(${endTime.toISOString()}) exceeds the maximum of ${MAX_SESSION_HOURS} hours.`,
    );
  }
}
