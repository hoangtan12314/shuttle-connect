import { Inject, Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Request, RequestRepository } from '../../../domain/request';
import { RequestMapper, requestGsi2, toLocationKey } from '../mapper';
import { DYNAMODB_CLIENT, TABLE_NAME } from '../provider';
import {
  RequestItemResponse,
  RequestStatus,
  SessionItemResponse,
  SessionStatus,
  UserItemResponse,
} from '@shuttle-connect/types';
import {
  ConditionalCheckFailedException,
  TransactionCanceledException,
} from '@aws-sdk/client-dynamodb';
import {
  ConcurrentUpdateError,
  DuplicateRequestError,
  EntityNotFoundError,
  RequestAlreadyDecidedError,
  RequestNotWithdrawableError,
} from '../../../domain/shared/errors';

@Injectable()
export class RequestRepositoryDynamoDB implements RequestRepository {
  constructor(
    @Inject(DYNAMODB_CLIENT) private client: DynamoDBDocumentClient,
    @Inject(TABLE_NAME) private tableName: string,
  ) {}

  async rejectRequest(sessionId: string, userId: string): Promise<RequestItemResponse> {
    try {
      const result = await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { PK: `SESSION#${sessionId}`, SK: `REQUEST#USER#${userId}` },
          UpdateExpression: 'SET #s = :rejected',
          ConditionExpression: '#s = :pending',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: {
            ':rejected': RequestStatus.REJECTED,
            ':pending': RequestStatus.PENDING,
          },
          ReturnValues: 'ALL_NEW',
        }),
      );
      return RequestMapper.toResponse(result.Attributes!);
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) {
        throw new RequestAlreadyDecidedError();
      }
      throw err;
    }
  }

  async approveRequest(
    sessionId: string,
    userId: string,
    currentSlotsRemaining: number,
  ): Promise<void> {
    try {
      const nextSlotsRemaining = currentSlotsRemaining - 1;
      await this.client.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Update: {
                TableName: this.tableName,
                Key: { PK: `SESSION#${sessionId}`, SK: `REQUEST#USER#${userId}` },
                UpdateExpression: 'SET #s = :approved',
                ConditionExpression: '#s = :pending',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: {
                  ':approved': RequestStatus.APPROVED,
                  ':pending': RequestStatus.PENDING,
                },
              },
            },
            {
              Update: {
                TableName: this.tableName,
                Key: { PK: `SESSION#${sessionId}`, SK: 'META' },
                UpdateExpression: 'SET slots_remaining = :next, #s = :nextStatus',
                ConditionExpression: 'slots_remaining = :current AND #s = :open',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: {
                  ':next': nextSlotsRemaining,
                  ':current': currentSlotsRemaining,
                  ':nextStatus': nextSlotsRemaining === 0 ? SessionStatus.FULL : SessionStatus.OPEN,
                  ':open': SessionStatus.OPEN,
                },
              },
            },
          ],
        }),
      );
    } catch (err) {
      if (err instanceof TransactionCanceledException) {
        throw new ConcurrentUpdateError();
      }
      throw err;
    }
  }

  // approveRequest's mirror image: give the slot back and flip FULL -> OPEN if freeing this slot
  // un-fills the session. Always lands on OPEN (never back on FULL), since freeing a slot can only
  // ever make a session less full, not more.
  async revertApproval(
    sessionId: string,
    userId: string,
    currentSlotsRemaining: number,
  ): Promise<void> {
    try {
      const nextSlotsRemaining = currentSlotsRemaining + 1;
      await this.client.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Update: {
                TableName: this.tableName,
                Key: { PK: `SESSION#${sessionId}`, SK: `REQUEST#USER#${userId}` },
                UpdateExpression: 'SET #s = :pending',
                ConditionExpression: '#s = :approved',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: {
                  ':pending': RequestStatus.PENDING,
                  ':approved': RequestStatus.APPROVED,
                },
              },
            },
            {
              Update: {
                TableName: this.tableName,
                Key: { PK: `SESSION#${sessionId}`, SK: 'META' },
                UpdateExpression: 'SET slots_remaining = :next, #s = :open',
                ConditionExpression: 'slots_remaining = :current AND (#s = :open OR #s = :full)',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: {
                  ':next': nextSlotsRemaining,
                  ':current': currentSlotsRemaining,
                  ':open': SessionStatus.OPEN,
                  ':full': SessionStatus.FULL,
                },
              },
            },
          ],
        }),
      );
    } catch (err) {
      if (err instanceof TransactionCanceledException) {
        throw new ConcurrentUpdateError();
      }
      throw err;
    }
  }

  // rejectRequest's mirror image -- rejected requests never touched slots_remaining, so neither
  // does undoing one. Plain conditional status flip, no transaction needed.
  async revertRejection(sessionId: string, userId: string): Promise<void> {
    try {
      await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { PK: `SESSION#${sessionId}`, SK: `REQUEST#USER#${userId}` },
          UpdateExpression: 'SET #s = :pending',
          ConditionExpression: '#s = :rejected',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: {
            ':pending': RequestStatus.PENDING,
            ':rejected': RequestStatus.REJECTED,
          },
        }),
      );
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) {
        throw new RequestAlreadyDecidedError();
      }
      throw err;
    }
  }

  // Requester-initiated. wasApproved picks the shape: false is rejectRequest's shape (plain
  // conditional flip, PENDING -> WITHDRAWN, no slots touched); true is revertApproval's shape
  // (give the slot back, flip FULL -> OPEN) but landing on WITHDRAWN instead of PENDING.
  async withdrawRequest(
    sessionId: string,
    userId: string,
    { wasApproved, currentSlotsRemaining }: { wasApproved: boolean; currentSlotsRemaining: number },
  ): Promise<void> {
    if (!wasApproved) {
      try {
        await this.client.send(
          new UpdateCommand({
            TableName: this.tableName,
            Key: { PK: `SESSION#${sessionId}`, SK: `REQUEST#USER#${userId}` },
            UpdateExpression: 'SET #s = :withdrawn',
            ConditionExpression: '#s = :pending',
            ExpressionAttributeNames: { '#s': 'status' },
            ExpressionAttributeValues: {
              ':withdrawn': RequestStatus.WITHDRAWN,
              ':pending': RequestStatus.PENDING,
            },
          }),
        );
      } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
          throw new RequestNotWithdrawableError();
        }
        throw err;
      }
      return;
    }

    try {
      const nextSlotsRemaining = currentSlotsRemaining + 1;
      await this.client.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Update: {
                TableName: this.tableName,
                Key: { PK: `SESSION#${sessionId}`, SK: `REQUEST#USER#${userId}` },
                UpdateExpression: 'SET #s = :withdrawn',
                ConditionExpression: '#s = :approved',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: {
                  ':withdrawn': RequestStatus.WITHDRAWN,
                  ':approved': RequestStatus.APPROVED,
                },
              },
            },
            {
              Update: {
                TableName: this.tableName,
                Key: { PK: `SESSION#${sessionId}`, SK: 'META' },
                UpdateExpression: 'SET slots_remaining = :next, #s = :open',
                ConditionExpression: 'slots_remaining = :current AND (#s = :open OR #s = :full)',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: {
                  ':next': nextSlotsRemaining,
                  ':current': currentSlotsRemaining,
                  ':open': SessionStatus.OPEN,
                  ':full': SessionStatus.FULL,
                },
              },
            },
          ],
        }),
      );
    } catch (err) {
      if (err instanceof TransactionCanceledException) {
        throw new ConcurrentUpdateError();
      }
      throw err;
    }
  }

  async getBySessionAndUser(
    sessionId: string,
    userId: string,
  ): Promise<RequestItemResponse | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { PK: `SESSION#${sessionId}`, SK: `REQUEST#USER#${userId}` },
      }),
    );

    return result.Item ? RequestMapper.toResponse(result.Item) : null;
  }

  async getByUserId(userId: string): Promise<RequestItemResponse[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK BETWEEN :from AND :to',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':from': `REQUEST#${new Date().getTime()}`,
          ':to': `REQUEST#9999999999999`,
        },
        ScanIndexForward: true,
        Limit: 50,
      }),
    );

    return (result.Items ?? []).map(RequestMapper.toResponse);
  }

  async getBySessionId(sessionId: string): Promise<RequestItemResponse[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `SESSION#${sessionId}`,
          ':skPrefix': 'REQUEST#',
        },
        ScanIndexForward: true,
        Limit: 50,
      }),
    );

    return (result.Items ?? []).map(RequestMapper.toResponse);
  }

  async create(
    request: Request,
    session: SessionItemResponse,
    user: UserItemResponse,
  ): Promise<RequestItemResponse> {
    const item = RequestMapper.toPersistence(request);

    const sessionStartTime = new Date(session.startTime).getTime();

    const denormalizeData = {
      court_name: session.court.name,
      lat: session.court.coordinates.lat,
      lng: session.court.coordinates.lng,
      location: toLocationKey(session.court.city, session.court.district),
      // Named `session_*` on purpose: a copy of the SESSION's time, not the request's own.
      session_start_time: sessionStartTime,
      session_end_time: new Date(session.endTime).getTime(),
      user_name: user.fullName,
      skill_level: user.skillLevel,
      // GSI2 only: this request shows up under the requester's "requested" list. No GSI1 keys are
      // ever written here, so a request can never enter GSI1 regardless of field names.
      ...requestGsi2(item.user_id, sessionStartTime),
    };

    const itemToBeSaved = {
      ...item,
      ...denormalizeData,
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: itemToBeSaved,
      // A withdrawn request's item can be overwritten by a fresh one -- withdrawing frees the
      // user to request the same session again (see JoinerSessionView's note copy for a
      // WITHDRAWN existing request). REJECTED is deliberately NOT included: the host said no,
      // and the design only offers "find another session" for that case, not a retry -- so the
      // duplicate guard still blocks it.
      ConditionExpression: 'attribute_not_exists(PK) OR #s = :withdrawn',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':withdrawn': RequestStatus.WITHDRAWN },
    });

    try {
      await this.client.send(command);
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) {
        throw new DuplicateRequestError();
      }
      throw err;
    }

    // No second read -- `session`/`user` are exactly what was just denormalized onto the item.
    return RequestMapper.toResponse(request, session, user);
  }
}
