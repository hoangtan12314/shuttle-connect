import { Inject, Injectable } from '@nestjs/common';
import {
  DecideRequestInput,
  RequestItemResponse,
  RequestStatus,
  SessionStatus,
} from '@shuttle-connect/types';
import {
  SESSION_REPOSITORY,
  SessionFullError,
  SessionNotOpenError,
  type SessionRepository,
} from '../../domain/session';
import { REQUEST_REPOSITORY, type RequestRepository } from '../../domain/request';
import {
  EntityNotFoundError,
  ForbiddenError,
  RequestAlreadyDecidedError,
} from '../../domain/shared/errors';

@Injectable()
export class DecideRequestUseCase {
  constructor(
    @Inject(REQUEST_REPOSITORY) private requestRepository: RequestRepository,
    @Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository,
  ) {}

  async execute(
    userId: string,
    sessionId: string,
    requesterId: string,
    input: DecideRequestInput,
  ): Promise<RequestItemResponse> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new EntityNotFoundError(`Session`);
    }

    if (userId !== session.host.id) {
      throw new ForbiddenError();
    }

    const request = await this.requestRepository.getBySessionAndUser(sessionId, requesterId);

    if (!request) {
      throw new EntityNotFoundError('Request');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new RequestAlreadyDecidedError();
    }

    if (input.status === RequestStatus.REJECTED) {
      return this.requestRepository.rejectRequest(sessionId, requesterId);
    }

    if (input.status !== RequestStatus.APPROVED) {
      throw new Error(
        `DecideRequestUseCase received an unhandled status "${input.status}". Fatal unreachable error.`,
      );
    }

    if (session.status !== SessionStatus.OPEN) {
      throw new SessionNotOpenError(session.status);
    }

    if (session.slotsRemaining <= 0) throw new SessionFullError();

    await this.requestRepository.approveRequest(sessionId, requesterId, session.slotsRemaining);
    const approved = await this.requestRepository.getBySessionAndUser(sessionId, requesterId);
    if (!approved) {
      throw new Error(
        'Request vanished immediately after a successful approval. Fatal unreachable error.',
      );
    }
    return approved;
  }
}
