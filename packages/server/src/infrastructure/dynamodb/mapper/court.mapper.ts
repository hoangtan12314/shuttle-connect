import { Area, City, CourtItemResponse } from '@shuttle-connect/types';
import { Court } from '../../../domain/court';

export interface CourtRecord {
  PK: string;
  SK: string;
  name: string;
  address: string;
  district: Area;
  city: City;
  latitude: number;
  longitude: number;
  created_at: number;
}

export class CourtMapper {
  static toPersistence(court: Court): Record<string, any> {
    const data = court.toJSON();
    return {
      PK: `COURT#${court.id}`,
      SK: 'META',
      name: data.name,
      address: data.address,
      district: data.district,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      created_at: data.createdAt.getTime(),
    };
  }

  static toResponse(record: Record<string, any>): CourtItemResponse {
    return {
      id: record.PK.replace('COURT#', ''),
      name: record.name,
      address: record.address,
      district: record.district,
      city: record.city,
      latitude: record.latitude,
      longitude: record.longitude,
      createdAt: new Date(record.created_at),
    };
  }
}
