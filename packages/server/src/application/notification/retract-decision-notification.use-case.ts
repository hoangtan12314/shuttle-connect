import { Inject, Injectable, Logger } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY, type NotificationRepository } from '../../domain/notification';

export interface RetractDecisionNotificationInput {
  sessionId: string;
  requesterId: string;
}

// Called when a host undoes an APPROVED/REJECTED decision back to PENDING
// (classifyTransition's RETRACT action). Deletes the player's earlier decision notice instead of
// sending a new one -- the list always matches the request's current state, per the user's
// 2026-10-26 decision. Naturally idempotent: a redelivered undo event finds nothing left to
// delete.
@Injectable()
export class RetractDecisionNotificationUseCase {
  private readonly logger = new Logger(RetractDecisionNotificationUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private notificationRepository: NotificationRepository,
  ) {}

  async execute(input: RetractDecisionNotificationInput): Promise<void> {
    await this.notificationRepository.deleteDecisionNotifications(
      input.requesterId,
      input.sessionId,
    );
    this.logger.log(
      `Retracted decision notification for ${input.requesterId} on session ${input.sessionId}`,
    );
  }
}
