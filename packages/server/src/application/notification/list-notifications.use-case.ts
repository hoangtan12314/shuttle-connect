import { Inject, Injectable } from '@nestjs/common';
import { NotificationListResponse } from '@shuttle-connect/types';
import { NOTIFICATION_REPOSITORY, type NotificationRepository } from '../../domain/notification';

const LIST_LIMIT = 30;

@Injectable()
export class ListNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private notificationRepository: NotificationRepository,
  ) {}

  async execute(userId: string): Promise<NotificationListResponse> {
    const [items, readAt] = await Promise.all([
      this.notificationRepository.listForUser(userId, LIST_LIMIT),
      this.notificationRepository.getReadAt(userId),
    ]);

    return { items, lastReadAt: readAt ? readAt.toISOString() : null };
  }
}
