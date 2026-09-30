import { ErrorCode } from '@shuttle-connect/types';
import { DomainError } from './domain.error';

export class ForbiddenError extends DomainError {
    readonly code = ErrorCode.FORBIDDEN;
    constructor() {
      super('Forbidden');
    }
}
