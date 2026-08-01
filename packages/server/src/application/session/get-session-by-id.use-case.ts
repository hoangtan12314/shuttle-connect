import { Inject, Injectable } from '@nestjs/common';
import { SessionItemResponse } from '@shuttle-connect/types';
import { SESSION_REPOSITORY, type SessionRepository } from '../../domain/session';

@Injectable()
export class GetSessionByIdUseCase {
  constructor(@Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository) {}

  async execute(id: string): Promise<SessionItemResponse | null> {
    const session = await this.sessionRepository.findById(id);
    return session;
  }
}
