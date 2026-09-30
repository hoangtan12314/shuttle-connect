import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CognitoTokenVerifierProvider } from '../auth';
import { DynamoDbClientProvider, TableNameProvider } from '../dynamodb/provider';
import { USER_REPOSITORY } from '../../domain/user';
import { UserRepositoryDynamoDB } from '../dynamodb/repository/user.repository';
import { AuthGuard } from '../../controller/guard/auth.guard';
import { ResolveCurrentUserUseCase } from '../../application/user';

@Module({
  providers: [
    CognitoTokenVerifierProvider,
    DynamoDbClientProvider,
    TableNameProvider,
    ResolveCurrentUserUseCase,
    { provide: USER_REPOSITORY, useClass: UserRepositoryDynamoDB },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [USER_REPOSITORY],
})
export class AuthModule {}
