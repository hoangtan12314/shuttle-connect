import { Inject, Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { NotificationItemResponse } from '@shuttle-connect/types';
import { Notification, NotificationRepository } from '../../../domain/notification';
import { EntityNotFoundError } from '../../../domain/shared/errors';
import { NotificationMapper } from '../mapper';
import { DYNAMODB_CLIENT, TABLE_NAME } from '../provider';

@Injectable()
export class NotificationRepositoryDynamoDB implements NotificationRepository {
  constructor(
    @Inject(DYNAMODB_CLIENT) private client: DynamoDBDocumentClient,
    @Inject(TABLE_NAME) private tableName: string,
  ) {}

  async create(notification: Notification): Promise<void> {
    const item = NotificationMapper.toPersistence(notification);
    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
          // Idempotency: a DynamoDB Streams record can be redelivered. The SK is built from the
          // stream record's own eventID, so a redelivery just fails this condition and is
          // swallowed here -- the host never sees a duplicate notification.
          ConditionExpression: 'attribute_not_exists(SK)',
        }),
      );
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) {
        return;
      }
      throw err;
    }
  }

  async listForUser(userId: string, limit: number): Promise<NotificationItemResponse[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':skPrefix': 'NOTIF#',
        },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );

    return (result.Items ?? []).map(NotificationMapper.toResponse);
  }

  async getReadAt(userId: string): Promise<Date | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { PK: `USER#${userId}`, SK: 'META' },
      }),
    );

    const readAt = result.Item?.notifications_read_at;
    return readAt !== undefined ? new Date(readAt) : null;
  }

  async markAllRead(userId: string, at: Date): Promise<void> {
    try {
      await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { PK: `USER#${userId}`, SK: 'META' },
          UpdateExpression: 'SET notifications_read_at = :at',
          ExpressionAttributeValues: { ':at': at.getTime() },
          ConditionExpression: 'attribute_exists(PK)',
        }),
      );
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) {
        throw new EntityNotFoundError('User');
      }
      throw err;
    }
  }
}
