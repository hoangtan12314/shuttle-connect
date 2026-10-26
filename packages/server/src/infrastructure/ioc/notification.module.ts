import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { NotificationController } from '../../controller/notification';
import { NOTIFICATION_REPOSITORY } from '../../domain/notification';
import { NotificationRepositoryDynamoDB } from '../dynamodb/repository';
import {
  ListNotificationsUseCase,
  MarkNotificationsReadUseCase,
} from '../../application/notification';
import { DynamoDbClientProvider, TableNameProvider } from '../dynamodb/provider';

// HTTP side only: imported by UserModule so the user Lambda serves GET/PATCH
// /users/me/notifications (already covered by infra/api.ts's GET/PATCH /users/{proxy+} routes).
// The stream Lambda uses NotificationStreamModule instead -- see that file for why.
@Module({
  imports: [AuthModule],
  controllers: [NotificationController],
  providers: [
    ListNotificationsUseCase,
    MarkNotificationsReadUseCase,
    DynamoDbClientProvider,
    TableNameProvider,
    { provide: NOTIFICATION_REPOSITORY, useClass: NotificationRepositoryDynamoDB },
  ],
})
export class NotificationModule {}
