import { Inject, Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { UserItemResponse } from '@shuttle-connect/types';
import { type FindByAuthIdOptions, User, UserRepository } from '../../../domain/user';
import { DYNAMODB_CLIENT, TABLE_NAME } from '../provider';
import { UserMapper } from '../mapper';

@Injectable()
export class UserRepositoryDynamoDB implements UserRepository {
  constructor(
    @Inject(DYNAMODB_CLIENT) private client: DynamoDBDocumentClient,
    @Inject(TABLE_NAME) private tableName: string,
  ) {}

  async findByAuthId(
    externalAuthId: string,
    options?: FindByAuthIdOptions,
  ): Promise<{ id: string } | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { PK: `AUTH#${externalAuthId}`, SK: 'META' },
        ConsistentRead: options?.consistentRead,
      }),
    );

    const item = result.Item ? { id: result.Item.app_user_id } : null;

    return item;
  }

  async findById(id: string): Promise<UserItemResponse | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { PK: `USER#${id}`, SK: 'META' },
      }),
    );
    return result.Item ? UserMapper.toResponse(result.Item) : null;
  }

  async create(user: User): Promise<void> {
    const userItem = UserMapper.toPersistence(user);
    const authItem = UserMapper.toAuthPointer(user);

    await this.client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: userItem,
              ConditionExpression: 'attribute_not_exists(PK)',
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: authItem,
              ConditionExpression: 'attribute_not_exists(PK)',
            },
          },
        ],
      }),
    );
  }
}
