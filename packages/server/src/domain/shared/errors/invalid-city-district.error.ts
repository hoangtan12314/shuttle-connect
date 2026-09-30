import { Area, City, ErrorCode } from '@shuttle-connect/types';
import { ValidationError } from './validation.error';

export class InvalidCityDistrictError extends ValidationError {
  readonly code = ErrorCode.INVALID_CITY_DISTRICT;
  constructor(city: City, district: Area) {
    super(`District "${district}" does not belong to city "${city}".`);
  }
}
