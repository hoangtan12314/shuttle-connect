import {
  Area,
  City,
  CourtItemResponse,
  SessionItemResponse,
  SessionOverview,
  UserItemResponse,
} from '@shuttle-connect/types';
import { Session } from './session.entity';

export interface SessionRepository {
  listSessionsByDistrict(city: City, area: Area, startTime?: Date): Promise<SessionOverview[]>;
  findById(id: string): Promise<SessionItemResponse | null>;
  getByUserId(userId: string): Promise<SessionOverview[]>;
  create(
    session: Session,
    court: CourtItemResponse,
    host: UserItemResponse,
  ): Promise<SessionItemResponse>;
  // Points the session at a new cover key, in one conditional write: only the host, and only
  // while the session is under maxChanges cover changes. Returns the previous key (so the
  // caller can delete the old object) and the updated session.
  setCover(
    sessionId: string,
    hostId: string,
    coverKey: string,
    maxChanges: number,
  ): Promise<{ previousCoverKey: string | null; session: SessionItemResponse }>;
}

export const SESSION_REPOSITORY = Symbol('SessionRepository');
