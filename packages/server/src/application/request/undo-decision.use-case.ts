import { Inject, Injectable } from '@nestjs/common';
import { RequestItemResponse, RequestStatus } from '@shuttle-connect/types';
import { SESSION_REPOSITORY, type SessionRepository } from '../../domain/session';
import { REQUEST_REPOSITORY, type RequestRepository } from '../../domain/request';
import {
  EntityNotFoundError,
  ForbiddenError,
  RequestNotDecidedError,
} from '../../domain/shared/errors';

// Host-initiated, distinct from DecideRequestUseCase (deciding vs. reversing a decision) --
// same authorization (only the session's host may do this), opposite precondition: decide
// requires PENDING, undo requires the request to currently be APPROVED or REJECTED.
@Injectable()
export class UndoDecisionUseCase {
  constructor(
    @Inject(REQUEST_REPOSITORY) private requestRepository: RequestRepository,
    @Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository,
  ) {}

  async execute(
    userId: string,
    sessionId: string,
    requesterId: string,
  ): Promise<RequestItemResponse> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new EntityNotFoundError('Session');
    }

    if (userId !== session.host.id) {
      throw new ForbiddenError();
    }

    const request = await this.requestRepository.getBySessionAndUser(sessionId, requesterId);

    if (!request) {
      throw new EntityNotFoundError('Request');
    }

    if (request.status === RequestStatus.APPROVED) {
      await this.requestRepository.revertApproval(sessionId, requesterId, session.slotsRemaining);
    } else if (request.status === RequestStatus.REJECTED) {
      await this.requestRepository.revertRejection(sessionId, requesterId);
    } else {
      throw new RequestNotDecidedError();
    }

    const reverted = await this.requestRepository.getBySessionAndUser(sessionId, requesterId);
    if (!reverted) {
      throw new Error(
        'Request vanished immediately after a successful undo. Fatal unreachable error.',
      );
    }
    return reverted;
  }
}
