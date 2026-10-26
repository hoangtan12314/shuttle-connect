import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY, type NotificationRepository } from '../../domain/notification';

@Injectable()
export class MarkNotificationsReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private notificationRepository: NotificationRepository,
  ) {}

  async execute(userId: string): Promise<{ lastReadAt: string }> {
    const now = new Date();
    await this.notificationRepository.markAllRead(userId, now);
    return { lastReadAt: now.toISOString() };
  }
}
