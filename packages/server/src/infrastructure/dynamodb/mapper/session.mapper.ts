import { SessionItemResponse, SessionOverview } from '@shuttle-connect/types';
import { Session } from '../../../domain/session';

export interface SessionRecord {
  PK: string;
  SK: string;
  court_id: string;
  user_id: string;
  start_time: number;
  end_time: number;
  slots_remaining: string;
  slots_total: string;
  status: string;
  price_male: string;
  price_female: string;
  shuttle_type: string;
  min_skill_level: string;
  description: string;
  created_at: number;
}

export class SessionMapper {
  static toPersistence(session: Session): Record<string, any> {
    const data = session.toJSON();
    return {
      PK: `SESSION#${data.id}`,
      SK: 'META',
      court_id: data.courtId,
      user_id: data.hostId,
      start_time: data.startTime.getTime(),
      end_time: data.endTime.getTime(),
      slots_remaining: data.slotsRemaining,
      slots_total: data.slotsTotal,
      status: data.status,
      price_male: data.priceMale,
      price_female: data.priceFemale,
      shuttle_type: data.shuttleType,
      min_skill_level: data.minSkillLevel,
      description: data.description,
      created_at: data.createdAt.getTime(),
    };
  }

  static toResponse(item: Record<string, any>): SessionItemResponse {
    return {
      id: item.PK.replace('SESSION#', ''),
      status: item.status,
      startTime: new Date(item.start_time).toISOString(),
      endTime: new Date(item.end_time).toISOString(),
      slotsRemaining: item.slots_remaining,
      slotsTotal: item.slots_total,
      priceMale: item.price_male,
      priceFemale: item.price_female,
      shuttleType: item.shuttle_type,
      minSkillLevel: item.min_skill_level,
      description: item.description,
      createdAt: new Date(item.created_at).toISOString(),
      court: {
        id: item.court_id,
        name: item.court_name,
        location: { lat: item.lat, lng: item.lng },
      },
      host: {
        id: item.user_id,
        name: item.user_name,
      },
    };
  }

  static toOverview(item: Record<string, any>): SessionOverview {
    return {
      id: item.PK.replace('SESSION#', ''),
      status: item.status,
      startTime: new Date(item.start_time).toISOString(),
      slotsRemaining: item.slots_remaining,
      slotsTotal: item.slots_total,
      shuttleType: item.shuttle_type,
      court: {
        id: item.court_id,
        name: item.court_name,
        location: { lat: item.lat, lng: item.lng },
      },
    };
  }
}
