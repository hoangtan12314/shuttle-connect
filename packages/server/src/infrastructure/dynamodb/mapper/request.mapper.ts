import { RequestItemResponse, RequestStatus, SkillLevel } from '@shuttle-connect/types';
import { Request } from '../../../domain/request';
import { fromLocationKey } from './location';

export interface RequestRecord {
  PK: string;
  SK: string;
  GSI2PK: string;
  GSI2SK: string;
  user_id: string;
  status: RequestStatus;
  location: string;
  lat: number;
  lng: number;
  user_name: string;
  skill_level: SkillLevel;
  // A copy of the SESSION's time (not the request's own) -- named `session_*` for readability.
  // Request items never carry GSI1PK/GSI1SK at all (see RequestRepositoryDynamoDB.create), so this
  // naming is no longer what keeps them out of GSI1 (unlike the table's previous semantic-key
  // design) -- membership is now controlled purely by which keys the repository writes.
  session_start_time: number;
  session_end_time: number;
  court_name: string;
  created_at: number;
}

export class RequestMapper {
  static toPersistence(request: Request): Record<string, any> {
    const data = request.toJSON();
    return {
      PK: `SESSION#${data.sessionId}`,
      SK: `REQUEST#USER#${data.userId}`,
      user_id: data.userId,
      status: data.status,
      created_at: data.createdAt.getTime(),
    };
  }

  static toResponse(item: RequestRecord): RequestItemResponse {
    const { city, district } = fromLocationKey(item.location);

    return {
      user: {
        id: item.user_id,
        name: item.user_name,
        skillLevel: item.skill_level,
      },
      session: {
        id: item.PK.replace('SESSION#', ''),
        startTime: new Date(item.session_start_time).toISOString(),
        endTime: new Date(item.session_end_time).toISOString(),
      },
      court: {
        name: item.court_name,
        district,
        city,
        coordinates: { lat: item.lat, lng: item.lng },
      },
      status: item.status,
      createdAt: new Date(item.created_at).toISOString(),
    };
  }
}
