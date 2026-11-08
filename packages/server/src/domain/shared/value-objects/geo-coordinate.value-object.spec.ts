import { GeoCoordinate } from './geo-coordinate.value-object';
import { InvalidGeoCoordinateError } from '../errors';

describe('GeoCoordinate.create', () => {
  it('accepts coordinates at the exact boundaries', () => {
    expect(() => GeoCoordinate.create(-90, -180)).not.toThrow();
    expect(() => GeoCoordinate.create(90, 180)).not.toThrow();
  });

  it('accepts a typical coordinate', () => {
    const coord = GeoCoordinate.create(10.7769, 106.7009);
    expect(coord.lat).toBe(10.7769);
    expect(coord.lng).toBe(106.7009);
  });

  it('rejects latitude outside [-90, 90]', () => {
    expect(() => GeoCoordinate.create(90.1, 0)).toThrow(InvalidGeoCoordinateError);
    expect(() => GeoCoordinate.create(-90.1, 0)).toThrow(InvalidGeoCoordinateError);
  });

  it('rejects longitude outside [-180, 180]', () => {
    expect(() => GeoCoordinate.create(0, 180.1)).toThrow(InvalidGeoCoordinateError);
    expect(() => GeoCoordinate.create(0, -180.1)).toThrow(InvalidGeoCoordinateError);
  });
});

describe('GeoCoordinate.equals', () => {
  it('is true for the same lat/lng', () => {
    const a = GeoCoordinate.create(10.1, 20.2);
    const b = GeoCoordinate.create(10.1, 20.2);
    expect(a.equals(b)).toBe(true);
  });

  it('is false when either coordinate differs', () => {
    const a = GeoCoordinate.create(10.1, 20.2);
    expect(a.equals(GeoCoordinate.create(10.2, 20.2))).toBe(false);
    expect(a.equals(GeoCoordinate.create(10.1, 20.3))).toBe(false);
  });
});
