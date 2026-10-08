import { Module } from '@nestjs/common';
import { SessionController } from '../../controller/session';
import {
  CreateSessionsUseCase,
  GetSessionByIdUseCase,
  GetSessionsByUserIdUseCase,
  ListSessionsByDistrictUseCase,
} from '../../application/session';
import { SESSION_REPOSITORY } from '../../domain/session';
import { COURT_REPOSITORY } from '../../domain/court';
import { CourtRepositoryDynamoDB, RequestRepositoryDynamoDB, SessionRepositoryDynamoDB } from '../dynamodb';
import { DynamoDbClientProvider, TableNameProvider } from '../dynamodb/provider';
import { AuthModule } from './auth.module';
import { DecideRequestUseCase, GetRequestsUseCase } from '../../application/request';
import { REQUEST_REPOSITORY } from '../../domain/request';

@Module({
  imports: [AuthModule],
  controllers: [SessionController],
  providers: [
    ListSessionsByDistrictUseCase,
    CreateSessionsUseCase,
    GetSessionByIdUseCase,
    GetSessionsByUserIdUseCase,
    DecideRequestUseCase,
    GetRequestsUseCase,
    DynamoDbClientProvider,
    TableNameProvider,
    { provide: SESSION_REPOSITORY, useClass: SessionRepositoryDynamoDB },
    { provide: COURT_REPOSITORY, useClass: CourtRepositoryDynamoDB },
    { provide: REQUEST_REPOSITORY, useClass: RequestRepositoryDynamoDB },
  ],
})
export class SessionModule {}
