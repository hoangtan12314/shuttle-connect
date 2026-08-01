import { Module } from '@nestjs/common';
import { SessionController } from '../../controller/session';
import {
  CreateSessionsUseCase,
  GetSessionByIdUseCase,
  ListAllSessionsUseCase,
} from '../../application/session';
import { SESSION_REPOSITORY } from '../../domain/session';
import { SessionRepositoryDynamoDB } from '../dynamodb';
import { DynamoDbClientProvider, TableNameProvider } from '../dynamodb/provider';

@Module({
  controllers: [SessionController],
  providers: [
    ListAllSessionsUseCase,
    CreateSessionsUseCase,
    GetSessionByIdUseCase,
    DynamoDbClientProvider,
    TableNameProvider,
    { provide: SESSION_REPOSITORY, useClass: SessionRepositoryDynamoDB },
  ],
})
export class SessionModule {}
