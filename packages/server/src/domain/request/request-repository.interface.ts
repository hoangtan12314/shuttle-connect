import { SessionItemResponse } from '@shuttle-connect/types';
import { Request } from './request.entity';

export interface RequestRepository {
  create(request: Request, session: SessionItemResponse): Promise<void>;
}

export const REQUEST_REPOSITORY = Symbol('RequestRepository');
