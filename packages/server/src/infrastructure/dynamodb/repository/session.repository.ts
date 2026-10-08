import { Inject, Injectable } from '@nestjs/common';
import {
  Area,
  City,
  CourtItemResponse,
  SessionItemResponse,
  SessionOverview,
  UserItemResponse,
} from '@shuttle-connect/types';
import { Session, SessionRepository } from '../../../domain/session';
import { SessionMapper, sessionGsi1, sessionGsi2, toLocationKey } from '../mapper';
import { DYNAMODB_CLIENT, TABLE_NAME } from '../provider';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

@Injectable()
export class SessionRepositoryDynamoDB implements SessionRepository {
  constructor(
    @Inject(DYNAMODB_CLIENT) private client: DynamoDBDocumentClient,
    @Inject(TABLE_NAME) private tableName: string,
  ) {}
  
  async listSessionsByDistrict(
    city: City,
    area: Area,
    startTime: Date,
  ): Promise<SessionOverview[]> {
    const { GSI1PK, GSI1SK } = sessionGsi1(city, area, startTime.getTime());

    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK >= :from',
        ExpressionAttributeValues: {
          ':pk': GSI1PK,
          ':from': GSI1SK,
        },
        ScanIndexForward: true,
        Limit: 50,
      }),
    );
    return (result.Items ?? []).map(SessionMapper.toOverview);
  }

  async findById(id: string): Promise<SessionItemResponse | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { PK: `SESSION#${id}`, SK: 'META' },
      }),
    );

    return result.Item ? SessionMapper.toResponse(result.Item) : null;
  }

  async getByUserId(userId: string): Promise<SessionOverview[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK BETWEEN :from AND :to',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':from': `SESSION#${new Date().getTime()}`,
          ':to': `SESSION#9999999999999`,
        },
        ScanIndexForward: true,
        Limit: 50,
      }),
    );

    return (result.Items ?? []).map(SessionMapper.toOverview);
  }

  async create(session: Session, court: CourtItemResponse, host: UserItemResponse): Promise<void> {
    const item = SessionMapper.toPersistence(session);

    const denormalizeData = {
      lat: court.latitude,
      lng: court.longitude,
      court_name: court.name,
      location: toLocationKey(court.city, court.district),
      user_name: host.fullName,
      // GSI1: browse this district. GSI2: this session shows up under its host's "hosted" list.
      ...sessionGsi1(court.city, court.district, item.start_time),
      ...sessionGsi2(item.user_id, item.start_time),
    };

    const itemToBeSaved = {
      ...item,
      ...denormalizeData,
    };

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: itemToBeSaved,
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    );
  }
}
