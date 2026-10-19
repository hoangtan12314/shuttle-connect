import { CourtItemOverview, CourtItemResponse } from '@shuttle-connect/types';
import { Court } from '../../../domain/court';
import { fromLocationKey, toLocationKey } from './location';
import { courtGsi1 } from './index-keys';

export interface CourtRecord {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: number;
  name: string;
  address: string;
  location: string;
  latitude: number;
  longitude: number;
  created_at: number;
}

export class CourtMapper {
  static toPersistence(court: Court): Record<string, any> {
    const data = court.toJSON();
    const createdAt = data.createdAt.getTime();

    return {
      PK: `COURT#${court.id}`,
      SK: 'META',
      name: data.name,
      address: data.address,
      location: toLocationKey(data.city, data.district),
      ...courtGsi1(data.city, data.district, createdAt),
      latitude: data.latitude,
      longitude: data.longitude,
      created_at: createdAt,
    };
  }

  // Two sources for the same output shape: a persisted DynamoDB record (the read path) or a
  // freshly-created entity (the create path -- no second DynamoDB read; unlike session's
  // court/host or request's session/user, CourtItemResponse's fields are a 1:1 match with what
  // Court.toJSON() already has, no denormalized cross-entity data needed, so nothing extra to pass
  // in). See SessionMapper.toResponse for the same overload pattern.
  static toResponse(record: Record<string, any>): CourtItemResponse;
  static toResponse(court: Court): CourtItemResponse;
  static toResponse(recordOrCourt: Record<string, any> | Court): CourtItemResponse {
    if (recordOrCourt instanceof Court) {
      const data = recordOrCourt.toJSON();
      return {
        id: data.id,
        name: data.name,
        address: data.address,
        district: data.district,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        createdAt: data.createdAt.toISOString(),
      };
    }

    const record = recordOrCourt;
    const { city, district } = fromLocationKey(record.location);

    return {
      id: record.PK.replace('COURT#', ''),
      name: record.name,
      address: record.address,
      district,
      city,
      latitude: record.latitude,
      longitude: record.longitude,
      createdAt: new Date(record.created_at).toISOString(),
    };
  }

  static toOverview(record: Record<string, any>): CourtItemOverview {
    return {
      id: record.PK.replace('COURT#', ''),
      name: record.name,
      address: record.address,
    };
  }
}
