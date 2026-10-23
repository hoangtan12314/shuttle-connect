import {
  RequestItemResponse,
  RequestStatus,
  SessionItemResponse,
  UserItemResponse,
} from '@shuttle-connect/types';
import { Request } from './request.entity';

export interface RequestRepository {
  create(
    request: Request,
    session: SessionItemResponse,
    user: UserItemResponse,
  ): Promise<RequestItemResponse>;
  getByUserId(userId: string): Promise<RequestItemResponse[]>;
  getBySessionId(sessionId: string): Promise<RequestItemResponse[]>;
  getBySessionAndUser(sessionId: string, userId: string): Promise<RequestItemResponse | null>;
  approveRequest(sessionId: string, userId: string, currentSlotsRemaining: number): Promise<void>;
  rejectRequest(sessionId: string, userId: string): Promise<RequestItemResponse>;
  // Both undo an APPROVED/REJECTED decision back to PENDING -- revertApproval is approveRequest's
  // mirror image (gives the slot back, flips FULL -> OPEN), revertRejection is a plain status flip
  // (rejected requests never touched slots, so neither does undoing one).
  revertApproval(sessionId: string, userId: string, currentSlotsRemaining: number): Promise<void>;
  revertRejection(sessionId: string, userId: string): Promise<void>;
  // Requester-initiated, from PENDING or APPROVED. wasApproved picks the shape: APPROVED mirrors
  // revertApproval (gives the slot back, flips FULL -> OPEN) but lands on WITHDRAWN instead of
  // PENDING; PENDING is a plain status flip, same as rejectRequest's shape.
  withdrawRequest(
    sessionId: string,
    userId: string,
    options: { wasApproved: boolean; currentSlotsRemaining: number },
  ): Promise<void>;
}

export const REQUEST_REPOSITORY = Symbol('RequestRepository');
