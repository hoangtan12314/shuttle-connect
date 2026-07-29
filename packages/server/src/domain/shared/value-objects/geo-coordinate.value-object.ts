import { InvalidGeoCoordinateError } from "../errors";

export class GeoCoordinate {
  private constructor(
    public readonly lat: number,
    public readonly lng: number,
  ) {}

  static create(lat: number, lng: number): GeoCoordinate {
    if (lat < -90 || lat > 90) {
      throw new InvalidGeoCoordinateError('lat', lat);
    }
    if (lng < -180 || lng > 180) {
      throw new InvalidGeoCoordinateError('lng', lng);
    }
    return new GeoCoordinate(lat, lng);
  }

  equals(other: GeoCoordinate): boolean {
    return this.lat === other.lat && this.lng === other.lng;
  }
}