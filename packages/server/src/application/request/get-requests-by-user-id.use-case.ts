import { Inject, Injectable } from '@nestjs/common';
import { RequestItemResponse, SessionOverview } from '@shuttle-connect/types';
import { REQUEST_REPOSITORY, type RequestRepository } from '../../domain/request';
import { USER_REPOSITORY, type UserRepository } from '../../domain/user';
import { EntityNotFoundError } from '../../domain/shared/errors';

@Injectable()
export class GetRequestsByUserIdUseCase {
  constructor(
    @Inject(REQUEST_REPOSITORY) private requestRepository: RequestRepository,
    @Inject(USER_REPOSITORY) private userRepository: UserRepository
  ) {}

  async execute(userId: string): Promise<RequestItemResponse[]> {
    const host = await this.userRepository.findById(userId)

    if (!host) {
      throw new EntityNotFoundError("User")
    }

    const requests = await this.requestRepository.getByUserId(userId);

    return requests;
  }
}
