import { randomUUID } from 'crypto';
import { Area, CITY_AREAS, City } from '@shuttle-connect/types';
import { InvalidCityDistrictError, InvalidFieldLengthError } from '../shared/errors';
import { GeoCoordinate } from '../shared/value-objects';

export interface CourtProps {
  name: string;
  address: string;
  district: Area;
  city: City;
  latitude: number;
  longitude: number;
}

export const MAX_NAME_LENGTH = 100;
export const MAX_ADDRESS_LENGTH = 200;
export const MIN_NAME_LENGTH = 2;
export const MIN_ADDRESS_LENGTH = 2;

export class Court {
  private constructor(
    public readonly id: string,
    private name: string,
    private address: string,
    private district: Area,
    private city: City,
    private coordinates: GeoCoordinate,
    private createdAt: Date,
  ) {}

  static create(props: CourtProps): Court {
    if (props.name.length < MIN_NAME_LENGTH || props.name.length > MAX_NAME_LENGTH) {
      throw new InvalidFieldLengthError('name', MIN_NAME_LENGTH, MAX_NAME_LENGTH);
    }

    if (props.address.length < MIN_ADDRESS_LENGTH || props.address.length > MAX_ADDRESS_LENGTH) {
      throw new InvalidFieldLengthError('address', MIN_ADDRESS_LENGTH, MAX_ADDRESS_LENGTH);
    }

    if (!CITY_AREAS[props.city].includes(props.district)) {
      throw new InvalidCityDistrictError(props.city, props.district);
    }

    return new Court(
      randomUUID(),
      props.name,
      props.address,
      props.district,
      props.city,
      GeoCoordinate.create(props.latitude, props.longitude),
      new Date(),
    );
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      district: this.district,
      city: this.city,
      latitude: this.coordinates.lat,
      longitude: this.coordinates.lng,
      createdAt: this.createdAt,
    };
  }
}
