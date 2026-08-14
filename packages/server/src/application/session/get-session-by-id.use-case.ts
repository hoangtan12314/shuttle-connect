import { Inject, Injectable } from '@nestjs/common';
import { SessionItemResponse } from '@shuttle-connect/types';
import { SESSION_REPOSITORY, type SessionRepository } from '../../domain/session';
import { EntityNotFoundError } from '../../domain/shared/errors';

@Injectable()
export class GetSessionByIdUseCase {
  constructor(@Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository) {}

  async execute(id: string): Promise<SessionItemResponse> {
    const session = await this.sessionRepository.findById(id);

    if (!session) {
      throw new EntityNotFoundError(`Session with ID ${id} not found`);
    }

    return session;
  }
}
