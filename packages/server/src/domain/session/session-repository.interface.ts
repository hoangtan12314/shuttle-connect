import {
  Area,
  City,
  CourtItemResponse,
  SessionItemResponse,
  SessionOverview,
  SessionStatus,
  ShuttleType,
  SkillLevel,
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
  // One conditional write that changes only the fields present. `expected` is the slot state the
  // caller read: the write fails with ConcurrentUpdateError if an approval/withdrawal landed in
  // between, the same optimistic check approveRequest uses. Also fails (with the real cause) if
  // the caller isn't the host or the session has started/been cancelled.
  update(
    sessionId: string,
    hostId: string,
    expected: { slotsTotal: number; slotsRemaining: number },
    changes: {
      priceMale?: number;
      priceFemale?: number;
      shuttleType?: ShuttleType;
      minSkillLevel?: SkillLevel;
      description?: string;
      slots?: { slotsTotal: number; slotsRemaining: number; status: SessionStatus };
    },
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
