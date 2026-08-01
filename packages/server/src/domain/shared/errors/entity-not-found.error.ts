import { ErrorCode } from '@shuttle-connect/types';
import { NotFoundError } from './not-found.error';

export class EntityNotFoundError extends NotFoundError {
  readonly code = ErrorCode.ENTITY_NOT_FOUND;
  constructor(entityName: string) {
    super(`The entity "${entityName}" was not found.`);
  }
}
