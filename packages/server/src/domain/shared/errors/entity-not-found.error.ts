import { ErrorCode } from '@shuttle-connect/types';
import { DomainError } from './domain.error';

export class EntityNotFoundError extends DomainError {
  readonly code = ErrorCode.ENTITY_NOT_FOUND;
  constructor(entityName: string) {
    super(`The entity "${entityName}" was not found.`);
  }
}
