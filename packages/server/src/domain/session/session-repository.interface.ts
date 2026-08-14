import { SessionItemResponse, SessionOverview } from '@shuttle-connect/types';
import { Session } from './session.entity';

export interface SessionRepository {
  listAll(): Promise<SessionOverview[]>;
  findById(id: string): Promise<SessionItemResponse | null>;
  create(session: Session): Promise<void>;
}

export const SESSION_REPOSITORY = Symbol('SessionRepository');
