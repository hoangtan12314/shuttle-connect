import { randomUUID } from 'crypto';
import { InvalidFieldLengthError } from '../shared/errors';
import { GeoCoordinate } from '../shared/value-objects';

export interface CourtProps {
  name: string;
  address: string;
  district: string;
  city: string;
  latitude: number;
  longitude: number;
}

const MAX_NAME_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 200;
const MIN_NAME_LENGTH = 2;
const MIN_ADDRESS_LENGTH = 2;

export class Court {
  private constructor(
    private id: string,
    private name: string,
    private address: string,
    private district: string,
    private city: string,
    private location: GeoCoordinate,
    private createdAt: Date,
  ) {}

  static create(props: CourtProps): Court {
    if (props.name.length < MIN_NAME_LENGTH || props.name.length > MAX_NAME_LENGTH) {
      throw new InvalidFieldLengthError('name', MIN_NAME_LENGTH, MAX_NAME_LENGTH);
    }

    if (props.address.length < MIN_ADDRESS_LENGTH || props.address.length > MAX_ADDRESS_LENGTH) {
      throw new InvalidFieldLengthError('address', MIN_ADDRESS_LENGTH, MAX_ADDRESS_LENGTH);
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

  static fromPersistence(props: CourtProps & { id: string; createdAt: Date }): Court {
    return new Court(
      props.id,
      props.name,
      props.address,
      props.district,
      props.city,
      GeoCoordinate.create(props.latitude, props.longitude),
      props.createdAt,
    );
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      district: this.district,
      city: this.city,
      latitude: this.location.lat,
      longitude: this.location.lng,
      createdAt: this.createdAt,
    };
  }
}
