import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { NotificationModule } from './notification.module';
import { UserController } from '../../controller/user';
import { USER_REPOSITORY } from '../../domain/user';
import { UserRepositoryDynamoDB } from '../dynamodb/repository';
import {
  CompleteOnboardingUseCase,
  GetProfileUseCase,
  UpdateProfileUseCase,
} from '../../application/user';
import { DynamoDbClientProvider, TableNameProvider } from '../dynamodb/provider';

@Module({
  imports: [AuthModule, NotificationModule],
  controllers: [UserController],
  providers: [
    GetProfileUseCase,
    UpdateProfileUseCase,
    CompleteOnboardingUseCase,
    DynamoDbClientProvider,
    TableNameProvider,
    { provide: USER_REPOSITORY, useClass: UserRepositoryDynamoDB },
  ],
})
export class UserModule {}
