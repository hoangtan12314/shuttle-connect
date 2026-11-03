import { Inject, Injectable } from '@nestjs/common';
import {
  CreateRequestInput,
  RequestItemResponse,
  RequestStatus,
  SessionStatus,
} from '@shuttle-connect/types';
import {
  SESSION_REPOSITORY,
  SessionNotOpenError,
  type SessionRepository,
} from '../../domain/session';
import { Request, REQUEST_REPOSITORY, type RequestRepository } from '../../domain/request';
import { USER_REPOSITORY, type UserRepository } from '../../domain/user';
import { CannotJoinOwnSessionError, EntityNotFoundError } from '../../domain/shared/errors';

@Injectable()
export class CreateRequestUseCase {
  constructor(
    @Inject(REQUEST_REPOSITORY) private requestRepository: RequestRepository,
    @Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository,
    @Inject(USER_REPOSITORY) private userRepository: UserRepository,
  ) {}

  async execute(userId: string, input: CreateRequestInput): Promise<RequestItemResponse> {
    const session = await this.sessionRepository.findById(input.sessionId);

    if (!session) {
      throw new EntityNotFoundError(`Session ${input.sessionId}`);
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new EntityNotFoundError('Request user');
    }

    if (userId === session.host.id) {
      throw new CannotJoinOwnSessionError();
    }

    if (session.status !== SessionStatus.OPEN) {
      throw new SessionNotOpenError(session.status);
    }

    // Only a WITHDRAWN existing request is ever rejoinable (create()'s repository-level
    // condition already blocks PENDING/APPROVED/REJECTED) -- the anti-churn check only applies
    // to that case, not to a brand-new join.
    const existingRequest = await this.requestRepository.getBySessionAndUser(
      input.sessionId,
      userId,
    );
    if (existingRequest?.status === RequestStatus.WITHDRAWN) {
      Request.assertCanRejoin(
        {
          joinCount: existingRequest.joinCount,
          withdrawnAt: existingRequest.withdrawnAt ? new Date(existingRequest.withdrawnAt) : null,
        },
        new Date(),
      );
    }

    // Gated the same way as the assertCanRejoin check above -- previousJoinCount only means
    // anything for an existing WITHDRAWN row. The repository's own create() condition also
    // happens to reject a non-WITHDRAWN existing row, but this shouldn't rely on that separate
    // guard to stay correct; it should be correct on its own terms.
    const previousJoinCount =
      existingRequest?.status === RequestStatus.WITHDRAWN ? existingRequest.joinCount : undefined;

    const requestToBeCreated = Request.create({
      userId,
      sessionId: input.sessionId,
      previousJoinCount,
    });

    return this.requestRepository.create(requestToBeCreated, session, user);
  }
}
