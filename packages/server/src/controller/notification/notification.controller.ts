import { Controller, Get, Inject, Patch } from '@nestjs/common';
import { type AuthUser, CurrentUser } from '../guard';
import {
  ListNotificationsUseCase,
  MarkNotificationsReadUseCase,
} from '../../application/notification';

@Controller('users/me/notifications')
export class NotificationController {
  constructor(
    @Inject(ListNotificationsUseCase)
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    @Inject(MarkNotificationsReadUseCase)
    private readonly markNotificationsReadUseCase: MarkNotificationsReadUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return this.listNotificationsUseCase.execute(user.id);
  }

  @Patch('read')
  async markRead(@CurrentUser() user: AuthUser) {
    return this.markNotificationsReadUseCase.execute(user.id);
  }
}
