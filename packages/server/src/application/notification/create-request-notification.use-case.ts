import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@shuttle-connect/types';
import {
  Notification,
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../../domain/notification';
import { SESSION_REPOSITORY, type SessionRepository } from '../../domain/session';

export interface CreateRequestNotificationInput {
  type: NotificationType;
  sessionId: string;
  requesterId: string;
  eventId: string;
  occurredAt: Date;
  actorName: string;
  courtName: string;
  sessionStartTime: Date;
  // Only meaningful for WITHDRAWN; false for every other type.
  wasApproved: boolean;
}

// Called only from the DynamoDB Streams Lambda (infrastructure/function/stream/
// request-status-changed.handler.ts), never from a use case directly -- decoupling the
// notification from the request-status write means a notification failure can never roll back,
// or even delay, the write itself. Covers every "create a notification" transition
// (classifyTransition's CREATE actions); RetractDecisionNotificationUseCase handles the one
// DELETE action (host undo).
@Injectable()
export class CreateRequestNotificationUseCase {
  private readonly logger = new Logger(CreateRequestNotificationUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private notificationRepository: NotificationRepository,
    @Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository,
  ) {}

  async execute(input: CreateRequestNotificationInput): Promise<void> {
    const session = await this.sessionRepository.findById(input.sessionId);
    if (!session) {
      // The session is gone by the time the stream record is processed -- nothing to notify.
      this.logger.warn(`Session ${input.sessionId} not found, skipping notification`);
      return;
    }

    // CREATED/WITHDRAWN are things a player did, so the host is told, acted by the player
    // (actorName, already supplied by the caller from the request item's own denormalized
    // fields). APPROVED/REJECTED are things the host did, so the player is told instead, acted
    // by the host.
    const isHostFacing =
      input.type !== NotificationType.REQUEST_APPROVED &&
      input.type !== NotificationType.REQUEST_REJECTED;
    const recipientId = isHostFacing ? session.host.id : input.requesterId;
    const actorName = isHostFacing ? input.actorName : session.host.name;

    const notification = Notification.create({
      recipientId,
      type: input.type,
      sessionId: input.sessionId,
      courtName: input.courtName,
      sessionStartTime: input.sessionStartTime,
      actorName,
      wasApproved: input.wasApproved,
      eventId: input.eventId,
      occurredAt: input.occurredAt,
    });

    await this.notificationRepository.create(notification);
    this.logger.log(`Notified ${recipientId} of a ${input.type} on session ${input.sessionId}`);
  }
}
