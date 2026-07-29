import { ErrorCode } from '@shuttle-connect/types';
import { DomainError } from "./domain.error";

export class InvalidFieldLengthError extends DomainError {
  readonly code = ErrorCode.INVALID_FIELD_LENGTH;
  constructor(fieldName: string, minLength: number, maxLength: number) {
    super(
      `The field "${fieldName}" must be between ${minLength} and ${maxLength} characters long.`,
    );
  }
}
