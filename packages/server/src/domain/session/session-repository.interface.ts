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
}

export const SESSION_REPOSITORY = Symbol('SessionRepository');
