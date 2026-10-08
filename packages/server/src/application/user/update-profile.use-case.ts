import { Inject, Injectable } from '@nestjs/common';
import { UpdateProfileInput, UserItemResponse } from '@shuttle-connect/types';
import { User, USER_REPOSITORY, type UserRepository } from '../../domain/user';
import { EntityNotFoundError } from '../../domain/shared/errors';

@Injectable()
export class UpdateProfileUseCase {
  constructor(@Inject(USER_REPOSITORY) private userRepository: UserRepository) {}

  async execute(userId: string, input: UpdateProfileInput): Promise<UserItemResponse> {
    if (input.fullName) {
      User.assertValidFullName(input.fullName); // domain is authoritative again
    }

    const user = await this.userRepository.update(userId, {
      fullName: input.fullName,
      skillLevel: input.skillLevel,
    });

    return user;
  }
}
