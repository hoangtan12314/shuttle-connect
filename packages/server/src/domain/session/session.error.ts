import { ErrorCode } from '@shuttle-connect/types';
import { ValidationError } from '../shared/errors';

export class InvalidSlotValuesError extends ValidationError {
  readonly code = ErrorCode.INVALID_SLOT_VALUES;
  constructor(slotsRemaining: number, slotsTotal: number) {
    super(
      `Invalid slot values: slotsRemaining (${slotsRemaining}) cannot be less than 0 or greater than slotsTotal (${slotsTotal}).`,
    );
    this.name = 'InvalidSlotValuesError';
  }
}

export class SessionFullError extends ValidationError {
  readonly code = ErrorCode.SESSION_FULL;

  constructor() {
    super('Session is full. No slots remaining.');
    this.name = 'SessionFullError';
  }
}

export class SessionNotOpenError extends ValidationError {
  readonly code = ErrorCode.SESSION_NOT_OPEN;

  constructor(sessionStatus: string) {
    super(`Session is not open for registration. Current status: ${sessionStatus}`);
    this.name = 'SessionNotOpenError';
  }
}
