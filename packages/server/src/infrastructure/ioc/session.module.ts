import { Module } from '@nestjs/common';
import { SessionController } from '../../controller/session';
import {
  CreateSessionsUseCase,
  GetSessionByIdUseCase,
  ListAllSessionsUseCase,
} from '../../application/session';
import { SESSION_REPOSITORY } from '../../domain/session';
import { COURT_REPOSITORY } from '../../domain/court';
import { CourtRepositoryDynamoDB, SessionRepositoryDynamoDB } from '../dynamodb';
import { DynamoDbClientProvider, TableNameProvider } from '../dynamodb/provider';
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SessionController],
  providers: [
    ListAllSessionsUseCase,
    CreateSessionsUseCase,
    GetSessionByIdUseCase,
    DynamoDbClientProvider,
    TableNameProvider,
    { provide: SESSION_REPOSITORY, useClass: SessionRepositoryDynamoDB },
    { provide: COURT_REPOSITORY, useClass: CourtRepositoryDynamoDB },
  ],
})
export class SessionModule {}
