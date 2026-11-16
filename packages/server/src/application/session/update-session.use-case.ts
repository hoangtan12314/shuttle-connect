import { Inject, Injectable } from '@nestjs/common';
import { SessionItemResponse, SessionStatus, UpdateSessionInput } from '@shuttle-connect/types';
import { Session, SESSION_REPOSITORY, type SessionRepository } from '../../domain/session';
import {
  EntityNotFoundError,
  ForbiddenError,
  SessionNotEditableError,
} from '../../domain/shared/errors';

@Injectable()
export class UpdateSessionUseCase {
  constructor(@Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository) {}

  async execute(
    userId: string,
    sessionId: string,
    input: UpdateSessionInput,
  ): Promise<SessionItemResponse> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new EntityNotFoundError('Session');
    }

    if (userId !== session.host.id) {
      throw new ForbiddenError();
    }

    if (session.status === SessionStatus.CANCELLED) {
      throw new SessionNotEditableError('the session was cancelled');
    }

    if (new Date(session.startTime).getTime() <= Date.now()) {
      throw new SessionNotEditableError('the session has already started');
    }

    Session.assertValidDescription(input.description);

    const slots =
      input.slotsTotal !== undefined && input.slotsTotal !== session.slotsTotal
        ? {
            slotsTotal: input.slotsTotal,
            ...Session.resizeSlots(session.slotsTotal, session.slotsRemaining, input.slotsTotal),
          }
        : undefined;

    const changes = {
      priceMale: input.priceMale,
      priceFemale: input.priceFemale,
      shuttleType: input.shuttleType,
      minSkillLevel: input.minSkillLevel,
      description: input.description,
      slots,
    };

    // Nothing to change (empty body, or the total re-sent unchanged): skip the write. An UpdateItem
    // with no SET would be a pointless write that could still fail on a race.
    if (Object.values(changes).every((value) => value === undefined)) {
      return session;
    }

    return this.sessionRepository.update(
      sessionId,
      userId,
      { slotsTotal: session.slotsTotal, slotsRemaining: session.slotsRemaining },
      changes,
    );
  }
}
