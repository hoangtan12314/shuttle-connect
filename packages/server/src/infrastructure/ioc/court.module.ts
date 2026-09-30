import { Module } from '@nestjs/common';
import { CourtController } from '../../controller/court';
import { CreateCourtUseCase, GetCourtByIdUseCase } from '../../application/court';
import { DynamoDbClientProvider, TableNameProvider } from '../dynamodb/provider';
import { COURT_REPOSITORY } from '../../domain/court';
import { CourtRepositoryDynamoDB } from '../dynamodb/repository';
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CourtController],
  providers: [
    CreateCourtUseCase,
    GetCourtByIdUseCase,
    DynamoDbClientProvider,
    TableNameProvider,
    { provide: COURT_REPOSITORY, useClass: CourtRepositoryDynamoDB },
  ],
})
export class CourtModule {}
