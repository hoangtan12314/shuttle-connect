import { Module } from '@nestjs/common';
import { RequestController } from '../../controller/request';
import {
  CreateRequestUseCase,
  DecideRequestUseCase,
  GetRequestsByUserIdUseCase,
  GetRequestsUseCase,
} from '../../application/request';
import { REQUEST_REPOSITORY } from '../../domain/request';
import { SESSION_REPOSITORY } from '../../domain/session';
import { RequestRepositoryDynamoDB, SessionRepositoryDynamoDB } from '../dynamodb';
import { DynamoDbClientProvider, TableNameProvider } from '../dynamodb/provider';
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RequestController],
  providers: [
    CreateRequestUseCase,
    GetRequestsByUserIdUseCase,
    DynamoDbClientProvider,
    TableNameProvider,
    { provide: REQUEST_REPOSITORY, useClass: RequestRepositoryDynamoDB },
    { provide: SESSION_REPOSITORY, useClass: SessionRepositoryDynamoDB },
  ],
})
export class RequestModule {}
