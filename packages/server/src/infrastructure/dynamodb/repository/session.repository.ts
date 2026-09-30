import { Inject, Injectable } from '@nestjs/common';
import { CourtItemResponse, SessionItemResponse, SessionOverview } from '@shuttle-connect/types';
import { Session, SessionRepository } from '../../../domain/session';
import { SessionMapper, sessionGsi1, sessionGsi2, toLocationKey } from '../mapper';
import { DYNAMODB_CLIENT, TABLE_NAME } from '../provider';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class SessionRepositoryDynamoDB implements SessionRepository {
  constructor(
    @Inject(DYNAMODB_CLIENT) private client: DynamoDBDocumentClient,
    @Inject(TABLE_NAME) private tableName: string,
  ) {}

  async listAll(): Promise<SessionOverview[]> {
    return [];
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

  async create(session: Session, court: CourtItemResponse): Promise<void> {
    const item = SessionMapper.toPersistence(session);

    const denormalizeData = {
      lat: court.latitude,
      lng: court.longitude,
      court_name: court.name,
      location: toLocationKey(court.city, court.district),
      user_name: 'Nguyen Van A',
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
