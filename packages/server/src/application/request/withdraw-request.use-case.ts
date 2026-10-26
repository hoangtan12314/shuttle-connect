import { Inject, Injectable } from '@nestjs/common';
import { RequestItemResponse, RequestStatus, WITHDRAW_CUTOFF_HOURS } from '@shuttle-connect/types';
import { SESSION_REPOSITORY, type SessionRepository } from '../../domain/session';
import { REQUEST_REPOSITORY, type RequestRepository } from '../../domain/request';
import {
  EntityNotFoundError,
  RequestNotWithdrawableError,
  WithdrawalWindowClosedError,
} from '../../domain/shared/errors';

const WITHDRAW_CUTOFF_MS = WITHDRAW_CUTOFF_HOURS * 60 * 60 * 1000;

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

    // PENDING withdrawals stay allowed at any time -- the host never counted on that slot. Only
    // an APPROVED request has a court the host paid for, so only that case needs the cutoff.
    if (
      request.status === RequestStatus.APPROVED &&
      new Date(session.startTime).getTime() - Date.now() < WITHDRAW_CUTOFF_MS
    ) {
      throw new WithdrawalWindowClosedError();
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
