import { Session } from "./session.entity";

export interface SessionRepository {
    listAll(): Promise<Session[]>;
}

export const SESSION_REPOSITORY = Symbol("SessionRepository");