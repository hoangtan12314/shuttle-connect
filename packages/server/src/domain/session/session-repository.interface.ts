import { Session } from "./session.entity";

export interface SessionRepository {
    listAll(): Promise<Session[]>;
    create(session: Session): Promise<void>;
}

export const SESSION_REPOSITORY = Symbol("SessionRepository");