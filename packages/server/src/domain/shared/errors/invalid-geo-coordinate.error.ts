import { ErrorCode } from '@shuttle-connect/types';
import { DomainError } from './domain.error';

export class InvalidGeoCoordinateError extends DomainError {
  readonly code = ErrorCode.INVALID_GEO_COORDINATE;
  constructor(field: 'lat' | 'lng', value: number) {
    super(`Invalid ${field}: ${value}`);
  }
}
