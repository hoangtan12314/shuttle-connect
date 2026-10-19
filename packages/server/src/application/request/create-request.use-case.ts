import { Inject, Injectable } from '@nestjs/common';
import { CreateRequestInput, RequestItemResponse, SessionStatus } from '@shuttle-connect/types';
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

    const requestToBeCreated = Request.create({
      userId,
      sessionId: input.sessionId,
    });

    return this.requestRepository.create(requestToBeCreated, session, user);
  }
}
