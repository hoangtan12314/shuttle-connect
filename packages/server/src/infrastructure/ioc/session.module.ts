import { Module } from '@nestjs/common';
import { SessionController } from '../../controller/session';
import {
  CreateSessionsUseCase,
  GetSessionByIdUseCase,
  GetSessionsByUserIdUseCase,
  ListSessionsByDistrictUseCase,
  UploadCoverUseCase,
} from '../../application/session';
import { COVER_STORAGE, SESSION_REPOSITORY } from '../../domain/session';
import { RATE_LIMITER } from '../../domain/shared/rate-limit';
import { MediaBucketProvider, S3ClientProvider, S3CoverStorage } from '../s3';
import { COURT_REPOSITORY } from '../../domain/court';
import {
  CourtRepositoryDynamoDB,
  RateLimiterDynamoDB,
  RequestRepositoryDynamoDB,
  SessionRepositoryDynamoDB,
} from '../dynamodb';
import { DynamoDbClientProvider, TableNameProvider } from '../dynamodb/provider';
import { AuthModule } from './auth.module';
import {
  DecideRequestUseCase,
  GetRequestsUseCase,
  UndoDecisionUseCase,
  WithdrawRequestUseCase,
} from '../../application/request';
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
    UndoDecisionUseCase,
    WithdrawRequestUseCase,
    UploadCoverUseCase,
    DynamoDbClientProvider,
    TableNameProvider,
    { provide: SESSION_REPOSITORY, useClass: SessionRepositoryDynamoDB },
    { provide: COURT_REPOSITORY, useClass: CourtRepositoryDynamoDB },
    { provide: REQUEST_REPOSITORY, useClass: RequestRepositoryDynamoDB },
    S3ClientProvider,
    MediaBucketProvider,
    { provide: COVER_STORAGE, useClass: S3CoverStorage },
    { provide: RATE_LIMITER, useClass: RateLimiterDynamoDB },
  ],
})
export class SessionModule {}
