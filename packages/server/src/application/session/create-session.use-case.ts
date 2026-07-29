import { Inject, Injectable } from '@nestjs/common';
import { CreateSessionInput, SessionStatus } from '@shuttle-connect/types';
import { Session, SESSION_REPOSITORY, type SessionRepository } from '../../domain/session';

@Injectable()
export class CreateSessionsUseCase {
  constructor(@Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository) {}

  async execute(hostId: string, input: CreateSessionInput): Promise<Session> {
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    const sessionToBeCreated = Session.create({
      ...input,
      hostId,
      status: SessionStatus.OPEN,
      startTime,
      endTime,
    });

    await this.sessionRepository.create(sessionToBeCreated);

    return sessionToBeCreated;
  }
}
