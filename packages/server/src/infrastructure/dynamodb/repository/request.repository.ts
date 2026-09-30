import { Inject, Injectable } from '@nestjs/common';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Request, RequestRepository } from '../../../domain/request';
import { RequestMapper, requestGsi2, toLocationKey } from '../mapper';
import { DYNAMODB_CLIENT, TABLE_NAME } from '../provider';
import { SessionItemResponse } from '@shuttle-connect/types';

@Injectable()
export class RequestRepositoryDynamoDB implements RequestRepository {
  constructor(
    @Inject(DYNAMODB_CLIENT) private client: DynamoDBDocumentClient,
    @Inject(TABLE_NAME) private tableName: string,
  ) {}

  async create(request: Request, session: SessionItemResponse): Promise<void> {
    const item = RequestMapper.toPersistence(request);

    // TODO: Implement real user look up after wokring on Cognito
    const user = {
      PK: `USER#${item.user_id}`,
      SK: 'META',
      user_id: item.user_id,
      user_name: 'Some random name',
      skill_level: 1,
    };

    const sessionStartTime = new Date(session.startTime).getTime();

    const denormalizeData = {
      court_name: session.court.name,
      lat: session.court.coordinates.lat,
      lng: session.court.coordinates.lng,
      location: toLocationKey(session.court.city, session.court.district),
      // Named `session_*` on purpose: a copy of the SESSION's time, not the request's own.
      session_start_time: sessionStartTime,
      session_end_time: new Date(session.endTime).getTime(),
      user_name: user.user_name,
      skill_level: user.skill_level,
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
      ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
    });

    await this.client.send(command);
  }
}
