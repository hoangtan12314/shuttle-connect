import { NotificationItemResponse } from '@shuttle-connect/types';
import { Notification } from './notification.entity';

export interface NotificationRepository {
  // Swallows a duplicate stream delivery (same eventId, same SK) -- the caller doesn't need to
  // know whether this was a fresh write or a harmless no-op.
  create(notification: Notification): Promise<void>;
  // A host undoing a decision removes the player's earlier APPROVED/REJECTED notice for that
  // session instead of sending a new one -- the list always matches the current state. Naturally
  // idempotent: a redelivered undo event finds nothing left to delete.
  deleteDecisionNotifications(userId: string, sessionId: string): Promise<void>;
  listForUser(userId: string, limit: number): Promise<NotificationItemResponse[]>;
  // null = the user has never read any notifications (everything is unread).
  getReadAt(userId: string): Promise<Date | null>;
  markAllRead(userId: string, at: Date): Promise<void>;
}

export const NOTIFICATION_REPOSITORY = Symbol('NotificationRepository');
