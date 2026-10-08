import { ErrorCode } from '@shuttle-connect/types';
import { ValidationError } from './validation.error';

export class CannotJoinOwnSessionError extends ValidationError {
  readonly code = ErrorCode.CANNOT_JOIN_OWN_SESSION;
  constructor() {
    super('Cannot join your own session.');
  }
}
