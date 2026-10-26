import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@shuttle-connect/types';
import {
  Notification,
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../../domain/notification';
import { SESSION_REPOSITORY, type SessionRepository } from '../../domain/session';

export interface CreateWithdrawalNotificationInput {
  sessionId: string;
  eventId: string;
  occurredAt: Date;
  actorName: string;
  courtName: string;
  sessionStartTime: Date;
  wasApproved: boolean;
}

// Called only from the DynamoDB Streams Lambda (infrastructure/function/stream/
// request-withdrawn.handler.ts), never from WithdrawRequestUseCase -- decoupling the
// notification from the withdraw transaction means a notification failure can never roll back,
// or even delay, the withdraw itself.
@Injectable()
export class CreateWithdrawalNotificationUseCase {
  private readonly logger = new Logger(CreateWithdrawalNotificationUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private notificationRepository: NotificationRepository,
    @Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository,
  ) {}

  async execute(input: CreateWithdrawalNotificationInput): Promise<void> {
    const session = await this.sessionRepository.findById(input.sessionId);
    if (!session) {
      // The session is gone by the time the stream record is processed -- nothing to notify.
      this.logger.warn(`Session ${input.sessionId} not found, skipping withdrawal notification`);
      return;
    }

    const notification = Notification.create({
      hostId: session.host.id,
      type: NotificationType.REQUEST_WITHDRAWN,
      sessionId: input.sessionId,
      courtName: input.courtName,
      sessionStartTime: input.sessionStartTime,
      actorName: input.actorName,
      wasApproved: input.wasApproved,
      eventId: input.eventId,
      occurredAt: input.occurredAt,
    });

    await this.notificationRepository.create(notification);
    this.logger.log(
      `Notified host ${session.host.id} of a withdrawal on session ${input.sessionId}`,
    );
  }
}
