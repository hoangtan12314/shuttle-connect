import { ErrorCode } from '@shuttle-connect/types';
import { ValidationError } from './validation.error';

export class InvalidGeoCoordinateError extends ValidationError {
  readonly code = ErrorCode.INVALID_GEO_COORDINATE;
  constructor(field: 'lat' | 'lng', value: number) {
    super(`Invalid ${field}: ${value}`);
  }
}
