import { Inject, Injectable } from '@nestjs/common';
import { RequestItemResponse, RequestStatus } from '@shuttle-connect/types';
import { SESSION_REPOSITORY, type SessionRepository } from '../../domain/session';
import { REQUEST_REPOSITORY, type RequestRepository } from '../../domain/request';
import { EntityNotFoundError, RequestNotWithdrawableError } from '../../domain/shared/errors';

// Requester-initiated, distinct from DecideRequestUseCase/UndoDecisionUseCase (both host-only,
// acting on someone else's request). No ForbiddenError check needed here -- the caller IS the
// requester, there's no separate :userId route param that could mismatch.
@Injectable()
export class WithdrawRequestUseCase {
  constructor(
    @Inject(REQUEST_REPOSITORY) private requestRepository: RequestRepository,
    @Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository,
  ) {}

  async execute(userId: string, sessionId: string): Promise<RequestItemResponse> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new EntityNotFoundError('Session');
    }

    const request = await this.requestRepository.getBySessionAndUser(sessionId, userId);

    if (!request) {
      throw new EntityNotFoundError('Request');
    }

    if (request.status !== RequestStatus.PENDING && request.status !== RequestStatus.APPROVED) {
      throw new RequestNotWithdrawableError();
    }

    await this.requestRepository.withdrawRequest(sessionId, userId, {
      wasApproved: request.status === RequestStatus.APPROVED,
      currentSlotsRemaining: session.slotsRemaining,
    });

    const withdrawn = await this.requestRepository.getBySessionAndUser(sessionId, userId);
    if (!withdrawn) {
      throw new Error(
        'Request vanished immediately after a successful withdraw. Fatal unreachable error.',
      );
    }
    return withdrawn;
  }
}
