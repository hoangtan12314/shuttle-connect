import { Inject, Injectable } from '@nestjs/common';
import { SessionOverview } from '@shuttle-connect/types';
import { SESSION_REPOSITORY, type SessionRepository } from '../../domain/session';
import { USER_REPOSITORY, type UserRepository } from '../../domain/user';
import { EntityNotFoundError } from '../../domain/shared/errors';

@Injectable()
export class GetSessionsByUserIdUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository,
    @Inject(USER_REPOSITORY) private userRepository: UserRepository
  ) {}

  async execute(userId: string): Promise<SessionOverview[]> {
    const host = await this.userRepository.findById(userId)

    if (!host) {
      throw new EntityNotFoundError("User")
    }

    const sessions = await this.sessionRepository.getByUserId(userId);

    return sessions;
  }
}
