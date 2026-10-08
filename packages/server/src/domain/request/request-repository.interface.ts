import { RequestItemResponse, RequestStatus, SessionItemResponse, UserItemResponse } from '@shuttle-connect/types';
import { Request } from './request.entity';

export interface RequestRepository {
  create(request: Request, session: SessionItemResponse, user: UserItemResponse): Promise<void>;
  getByUserId(userId: string): Promise<RequestItemResponse[]>
  getBySessionId(sessionId: string): Promise<RequestItemResponse[]>
  getBySessionAndUser(sessionId: string, userId: string): Promise<RequestItemResponse | null>
  approveRequest(sessionId: string, userId: string, currentSlotsRemaining: number): Promise<void>
  rejectRequest(sessionId: string, userId: string): Promise<RequestItemResponse>
}

export const REQUEST_REPOSITORY = Symbol('RequestRepository');
