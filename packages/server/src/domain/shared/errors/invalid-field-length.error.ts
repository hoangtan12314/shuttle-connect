import { ErrorCode } from '@shuttle-connect/types';
import { ValidationError } from './validation.error';

export class InvalidFieldLengthError extends ValidationError {
  readonly code = ErrorCode.INVALID_FIELD_LENGTH;
  constructor(fieldName: string, minLength: number, maxLength: number) {
    super(
      `The field "${fieldName}" must be between ${minLength} and ${maxLength} characters long.`,
    );
  }
}
