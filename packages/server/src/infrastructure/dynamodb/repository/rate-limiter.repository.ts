import { Inject, Injectable } from '@nestjs/common';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { RateLimitRule } from '@shuttle-connect/types';
import type { RateLimitedAction, RateLimiter } from '../../../domain/shared/rate-limit';
import { RateLimitExceededError } from '../../../domain/shared/errors';
import { DYNAMODB_CLIENT, TABLE_NAME } from '../provider';

// Kept an hour past the window's end before the table's TTL (expires_at) may delete it, so a
// counter is never removed while its window is still live, even with clock skew.
const TTL_GRACE_SECONDS = 60 * 60;

// Fixed-window counter: one item per (user, action, window), PK RATE#<userId>,
// SK <action>#<windowStart>. A single conditional UpdateItem both checks and increments, so two
// parallel requests can't both pass the limit. Fixed (not sliding) windows mean a user can reach
// up to 2x the limit around a window boundary -- fine for bounding abuse, far simpler than a log.
@Injectable()
export class RateLimiterDynamoDB implements RateLimiter {
  constructor(
    @Inject(DYNAMODB_CLIENT) private client: DynamoDBDocumentClient,
    @Inject(TABLE_NAME) private tableName: string,
  ) {}

  async consume(userId: string, action: RateLimitedAction, rule: RateLimitRule): Promise<void> {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const windowStart = Math.floor(nowSeconds / rule.windowSeconds) * rule.windowSeconds;
    const windowEnd = windowStart + rule.windowSeconds;

    try {
      await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { PK: `RATE#${userId}`, SK: `${action}#${windowStart}` },
          UpdateExpression: 'ADD #count :one SET expires_at = :expiresAt',
          ConditionExpression: 'attribute_not_exists(#count) OR #count < :limit',
          ExpressionAttributeNames: { '#count': 'count' },
          ExpressionAttributeValues: {
            ':one': 1,
            ':limit': rule.limit,
            ':expiresAt': windowEnd + TTL_GRACE_SECONDS,
          },
        }),
      );
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        throw new RateLimitExceededError(action, new Date(windowEnd * 1000));
      }
      throw error;
    }
  }
}
