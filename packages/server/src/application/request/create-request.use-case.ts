import { Inject, Injectable } from '@nestjs/common';
import { CreateRequestInput } from '@shuttle-connect/types';
import { SESSION_REPOSITORY, type SessionRepository } from '../../domain/session';
import { Request, REQUEST_REPOSITORY, type RequestRepository } from '../../domain/request';
import { EntityNotFoundError } from '../../domain/shared/errors';

@Injectable()
export class CreateRequestUseCase {
  constructor(
    @Inject(REQUEST_REPOSITORY) private requestRepository: RequestRepository,
    @Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository,
  ) {}

  async execute(userId: string, input: CreateRequestInput): Promise<Request> {
    const session = await this.sessionRepository.findById(input.sessionId);

    if (!session) {
      throw new EntityNotFoundError(`Session ${input.sessionId}`);
    }

    const requestToBeCreated = Request.create({
      userId,
      sessionId: input.sessionId,
    });

    await this.requestRepository.create(requestToBeCreated, session);

    return requestToBeCreated;
  }
}
