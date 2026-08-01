import { ErrorCode } from '@shuttle-connect/types';
import { ValidationError } from './validation.error';

export class InvalidEmailError extends ValidationError {
  readonly code = ErrorCode.INVALID_EMAIL;
  constructor() {
    super('Invalid email address');
  }
}
