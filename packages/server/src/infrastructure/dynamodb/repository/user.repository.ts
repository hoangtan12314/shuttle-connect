import { Inject, Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { SkillLevel, UserItemResponse } from '@shuttle-connect/types';
import { type FindByAuthIdOptions, User, UserRepository } from '../../../domain/user';
import { DYNAMODB_CLIENT, TABLE_NAME } from '../provider';
import { UserMapper } from '../mapper';
import { EntityNotFoundError } from '../../../domain/shared/errors';

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

  async update(
    id: string,
    fields: { fullName?: string; skillLevel?: SkillLevel },
  ): Promise<UserItemResponse> {
    const sets: string[] = [];
    const values: Record<string, any> = {};

    if (fields.fullName !== undefined) {
      sets.push('full_name = :fullName');
      values[':fullName'] = fields.fullName;
    }
    if (fields.skillLevel !== undefined) {
      sets.push('skill_level = :skillLevel');
      values[':skillLevel'] = fields.skillLevel;
    }

    if (sets.length === 0) {
      const current = await this.findById(id);
      if (!current) throw new EntityNotFoundError('User');
      return current;
    }

    try {
      const result = await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { PK: `USER#${id}`, SK: 'META' },
          UpdateExpression: `SET ${sets.join(', ')}`,
          ExpressionAttributeValues: values,
          ConditionExpression: 'attribute_exists(PK)',
          ReturnValues: 'ALL_NEW',
        }),
      );

      return UserMapper.toResponse(result.Attributes!);
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) {
        throw new EntityNotFoundError('User');
      }
      throw err;
    }
  }

  async completeOnboarding(
    id: string,
    fields: { fullName: string; skillLevel: SkillLevel },
  ): Promise<UserItemResponse> {
    try {
      const result = await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { PK: `USER#${id}`, SK: 'META' },
          // if_not_exists keeps the FIRST onboarding time: a double-submit or retry becomes a
          // harmless edit of name/level instead of an error or a moving timestamp.
          UpdateExpression:
            'SET full_name = :fullName, skill_level = :skillLevel, onboarded_at = if_not_exists(onboarded_at, :now)',
          ExpressionAttributeValues: {
            ':fullName': fields.fullName,
            ':skillLevel': fields.skillLevel,
            ':now': Date.now(),
          },
          ConditionExpression: 'attribute_exists(PK)',
          ReturnValues: 'ALL_NEW',
        }),
      );

      return UserMapper.toResponse(result.Attributes!);
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) {
        throw new EntityNotFoundError('User');
      }
      throw err;
    }
  }
}
