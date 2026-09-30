import { CourtItemResponse } from '@shuttle-connect/types';
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

  static toResponse(record: Record<string, any>): CourtItemResponse {
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
}
