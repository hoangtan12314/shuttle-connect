import { Module } from '@nestjs/common';
import { SessionController } from '../../controller/session';
import { CreateSessionsUseCase, ListAllSessionsUseCase } from '../../application/session';
import { SESSION_REPOSITORY } from '../../domain/session';
import { SessionRepositoryDynamoDB } from '../dynamodb';
import { DynamoDbClientProvider, TableNameProvider } from '../dynamodb/provider';

@Module({
  controllers: [SessionController],
  providers: [
    ListAllSessionsUseCase,
    CreateSessionsUseCase,
    DynamoDbClientProvider,
    TableNameProvider,
    { provide: SESSION_REPOSITORY, useClass: SessionRepositoryDynamoDB },
  ],
})
export class SessionModule {}
