import { Area, City } from '@shuttle-connect/types';
import {
  Court,
  MAX_ADDRESS_LENGTH,
  MAX_NAME_LENGTH,
  MIN_ADDRESS_LENGTH,
  MIN_NAME_LENGTH,
} from './court.entity';
import {
  InvalidCityDistrictError,
  InvalidFieldLengthError,
  InvalidGeoCoordinateError,
} from '../shared/errors';

function baseProps(overrides: Partial<Parameters<typeof Court.create>[0]> = {}) {
  return {
    name: 'T19 Badminton',
    address: '19 Nguyen Van Troi',
    district: Area.HCM_DISTRICT_10,
    city: City.HO_CHI_MINH,
    latitude: 10.7769,
    longitude: 106.7009,
    ...overrides,
  };
}

describe('Court.create', () => {
  it('creates a court with the given props', () => {
    const court = Court.create(baseProps());
    expect(court.toJSON()).toMatchObject({
      name: 'T19 Badminton',
      address: '19 Nguyen Van Troi',
      district: Area.HCM_DISTRICT_10,
      city: City.HO_CHI_MINH,
      latitude: 10.7769,
      longitude: 106.7009,
    });
    expect(court.id).toEqual(expect.any(String));
  });

  it('throws InvalidFieldLengthError for a name shorter than the minimum', () => {
    expect(() => Court.create(baseProps({ name: 'a'.repeat(MIN_NAME_LENGTH - 1) }))).toThrow(
      InvalidFieldLengthError,
    );
  });

  it('throws InvalidFieldLengthError for a name longer than the maximum', () => {
    expect(() => Court.create(baseProps({ name: 'a'.repeat(MAX_NAME_LENGTH + 1) }))).toThrow(
      InvalidFieldLengthError,
    );
  });

  it('throws InvalidFieldLengthError for an address shorter than the minimum', () => {
    expect(() => Court.create(baseProps({ address: 'a'.repeat(MIN_ADDRESS_LENGTH - 1) }))).toThrow(
      InvalidFieldLengthError,
    );
  });

  it('throws InvalidFieldLengthError for an address longer than the maximum', () => {
    expect(() => Court.create(baseProps({ address: 'a'.repeat(MAX_ADDRESS_LENGTH + 1) }))).toThrow(
      InvalidFieldLengthError,
    );
  });

  it('throws InvalidCityDistrictError when the district does not belong to the city', () => {
    expect(() =>
      Court.create(baseProps({ city: City.HANOI, district: Area.HCM_DISTRICT_10 })),
    ).toThrow(InvalidCityDistrictError);
  });

  it('accepts a district that does belong to the given city', () => {
    expect(() =>
      Court.create(baseProps({ city: City.HANOI, district: Area.HN_BA_DINH })),
    ).not.toThrow();
  });

  it('delegates coordinate validation to GeoCoordinate.create', () => {
    expect(() => Court.create(baseProps({ latitude: 999 }))).toThrow(InvalidGeoCoordinateError);
  });
});
