import { Module } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY } from '../../domain/notification';
import { SESSION_REPOSITORY } from '../../domain/session';
import { NotificationRepositoryDynamoDB, SessionRepositoryDynamoDB } from '../dynamodb/repository';
import { CreateWithdrawalNotificationUseCase } from '../../application/notification';
import { DynamoDbClientProvider, TableNameProvider } from '../dynamodb/provider';

// Bootstrapped only by the DynamoDB Streams Lambda (request-withdrawn.handler.ts). Deliberately
// NOT NotificationModule: that one imports AuthModule for its HTTP routes, whose Cognito verifier
// reads Resource['shuttle-connect-user-pool'] -- a resource the stream Lambda isn't linked to, so
// reusing it crashes the Lambda at startup before any record is processed.
@Module({
  providers: [
    CreateWithdrawalNotificationUseCase,
    DynamoDbClientProvider,
    TableNameProvider,
    { provide: NOTIFICATION_REPOSITORY, useClass: NotificationRepositoryDynamoDB },
    { provide: SESSION_REPOSITORY, useClass: SessionRepositoryDynamoDB },
  ],
})
export class NotificationStreamModule {}
