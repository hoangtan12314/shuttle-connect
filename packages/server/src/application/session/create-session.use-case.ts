import { Inject, Injectable } from '@nestjs/common';
import { CreateSessionInput, SessionStatus } from '@shuttle-connect/types';
import { Session, SESSION_REPOSITORY, type SessionRepository } from '../../domain/session';
import { COURT_REPOSITORY, type CourtRepository } from '../../domain/court';
import { EntityNotFoundError } from '../../domain/shared/errors';

@Injectable()
export class CreateSessionsUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository,
    @Inject(COURT_REPOSITORY) private courtRepository: CourtRepository,
  ) {}

  async execute(hostId: string, input: CreateSessionInput): Promise<Session> {
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    const court = await this.courtRepository.findById(input.courtId);

    if (!court) {
      throw new EntityNotFoundError(`Court ${input.courtId}`);
    }

    const sessionToBeCreated = Session.create({
      ...input,
      hostId,
      status: SessionStatus.OPEN,
      startTime,
      endTime,
    });

    await this.sessionRepository.create(sessionToBeCreated, court);

    return sessionToBeCreated;
  }
}
