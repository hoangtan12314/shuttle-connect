import { Inject, Injectable } from '@nestjs/common';
import { SessionOverview } from '@shuttle-connect/types';
import { SESSION_REPOSITORY, type SessionRepository } from '../../domain/session';

@Injectable()
export class GetSessionsByUserIdUseCase {
  constructor(@Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository) {}

  async execute(userId: string): Promise<SessionOverview[]> {
    const sessions = await this.sessionRepository.getByUserId(userId);

    return sessions;
  }
}
