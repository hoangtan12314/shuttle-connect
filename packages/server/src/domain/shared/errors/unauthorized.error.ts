import { ErrorCode } from '@shuttle-connect/types';
import { DomainError } from './domain.error';

export class UnauthorizedError extends DomainError {
    readonly code = ErrorCode.UNAUTHORIZED;
    constructor() {
      super("Invalid token");
    }
}
