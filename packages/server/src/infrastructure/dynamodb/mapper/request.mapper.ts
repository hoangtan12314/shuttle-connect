import {
  RequestItemResponse,
  RequestStatus,
  SessionItemResponse,
  SkillLevel,
  UserItemResponse,
} from '@shuttle-connect/types';
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
  // Missing on rows written before the anti-churn rate limit shipped -- toResponse treats a
  // missing value as 1 (as if this were the row's first join).
  join_count?: number;
  // Set by withdrawRequest, in both of its shapes. A rejoin's PutCommand rebuilds the whole item
  // from scratch (same as created_at -- a rejoin is a fresh Request, not a patch of the old one),
  // so this is actually DROPPED on rejoin, not carried over. Harmless: the next withdraw sets it
  // fresh again before anything ever reads it, so cooldown correctness never depends on this
  // surviving a rejoin.
  withdrawn_at?: number;
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
      join_count: data.joinCount,
    };
  }

  // Two sources for the same output shape: a persisted DynamoDB item (the read path) or a
  // freshly-created entity + the session/user already fetched to validate it (the create path --
  // no second DynamoDB read, see SessionMapper.toResponse for the same pattern).
  static toResponse(item: Record<string, any>): RequestItemResponse;
  static toResponse(
    request: Request,
    session: SessionItemResponse,
    user: UserItemResponse,
  ): RequestItemResponse;
  static toResponse(
    itemOrRequest: Record<string, any> | Request,
    session?: SessionItemResponse,
    user?: UserItemResponse,
  ): RequestItemResponse {
    if (itemOrRequest instanceof Request) {
      const data = itemOrRequest.toJSON();
      return {
        user: {
          id: user!.id,
          name: user!.fullName,
          skillLevel: user!.skillLevel,
        },
        session: {
          id: session!.id,
          startTime: session!.startTime,
          endTime: session!.endTime,
        },
        court: {
          name: session!.court.name,
          district: session!.court.district,
          city: session!.court.city,
          coordinates: session!.court.coordinates,
        },
        status: data.status,
        createdAt: data.createdAt.toISOString(),
        joinCount: data.joinCount,
        // A freshly-created Request has never been withdrawn.
        withdrawnAt: null,
      };
    }

    const item = itemOrRequest;
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
      joinCount: item.join_count ?? 1,
      withdrawnAt:
        item.withdrawn_at !== undefined ? new Date(item.withdrawn_at).toISOString() : null,
    };
  }
}
