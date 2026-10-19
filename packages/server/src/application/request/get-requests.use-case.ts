import { Inject, Injectable } from '@nestjs/common';
import { RequestItemResponse } from '@shuttle-connect/types';
import { EntityNotFoundError, ForbiddenError } from '../../domain/shared/errors';
import { SESSION_REPOSITORY, type SessionRepository } from '../../domain/session';
import { REQUEST_REPOSITORY, type RequestRepository } from '../../domain/request';

@Injectable()
export class GetRequestsUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository,
    @Inject(REQUEST_REPOSITORY) private requestRepository: RequestRepository,
  ) {}

  async execute(userId: string, sessionId: string): Promise<RequestItemResponse[]> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new EntityNotFoundError('Session');
    }

    if (session.host.id !== userId) {
      throw new ForbiddenError();
    }

    const requests = await this.requestRepository.getBySessionId(sessionId);

    return requests;
  }
}
