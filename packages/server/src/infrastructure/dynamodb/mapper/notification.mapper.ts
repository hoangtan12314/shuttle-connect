import { NotificationItemResponse } from '@shuttle-connect/types';
import { Notification } from '../../../domain/notification';

const NOTIFICATION_TTL_SECONDS = 60 * 24 * 60 * 60; // 60 days -- DynamoDB deletes the row for free

export interface NotificationRecord {
  PK: string;
  SK: string;
  type: string;
  session_id: string;
  court_name: string;
  session_start_time: number;
  actor_name: string;
  was_approved: boolean;
  created_at: number;
  expires_at: number;
}

export class NotificationMapper {
  static toPersistence(notification: Notification): Record<string, any> {
    const data = notification.toJSON();
    const createdAtMs = data.createdAt.getTime();

    return {
      PK: `USER#${data.hostId}`,
      // Sortable newest-first by construction; the eventId suffix is what makes the item unique
      // and a redelivered stream record idempotent (see NotificationRepositoryDynamoDB.create).
      SK: `NOTIF#${createdAtMs}#${data.id}`,
      type: data.type,
      session_id: data.sessionId,
      court_name: data.courtName,
      session_start_time: data.sessionStartTime.getTime(),
      actor_name: data.actorName,
      was_approved: data.wasApproved,
      created_at: createdAtMs,
      expires_at: Math.floor(createdAtMs / 1000) + NOTIFICATION_TTL_SECONDS,
    };
  }

  static toResponse(item: Record<string, any>): NotificationItemResponse {
    return {
      id: item.SK.split('#')[2],
      type: item.type,
      sessionId: item.session_id,
      courtName: item.court_name,
      sessionStartTime: new Date(item.session_start_time).toISOString(),
      actorName: item.actor_name,
      wasApproved: item.was_approved,
      createdAt: new Date(item.created_at).toISOString(),
    };
  }
}
