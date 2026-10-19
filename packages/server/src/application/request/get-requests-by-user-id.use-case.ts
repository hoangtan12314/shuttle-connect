import { Inject, Injectable } from '@nestjs/common';
import { RequestItemResponse } from '@shuttle-connect/types';
import { REQUEST_REPOSITORY, type RequestRepository } from '../../domain/request';

@Injectable()
export class GetRequestsByUserIdUseCase {
  constructor(@Inject(REQUEST_REPOSITORY) private requestRepository: RequestRepository) {}

  async execute(userId: string): Promise<RequestItemResponse[]> {
    const requests = await this.requestRepository.getByUserId(userId);

    return requests;
  }
}
