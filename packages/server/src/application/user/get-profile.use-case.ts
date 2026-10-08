import { Inject, Injectable } from '@nestjs/common';
import { UserItemResponse } from '@shuttle-connect/types';
import { USER_REPOSITORY, type UserRepository } from '../../domain/user';
import { EntityNotFoundError } from '../../domain/shared/errors';

@Injectable()
export class GetProfileUseCase {
  constructor(@Inject(USER_REPOSITORY) private userRepository: UserRepository) {}

  async execute(userId: string): Promise<UserItemResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new EntityNotFoundError('User');
    }
    return user;
  }
}
