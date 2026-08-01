import { Inject, Injectable } from '@nestjs/common';
import { SessionItemResponse, SessionOverview } from '@shuttle-connect/types';
import { Session, SessionRepository } from '../../../domain/session';
import { SessionMapper } from '../mapper';
import { DYNAMODB_CLIENT, TABLE_NAME } from '../provider';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class SessionRepositoryDynamoDB implements SessionRepository {
  constructor(
    @Inject(DYNAMODB_CLIENT) private client: DynamoDBDocumentClient,
    @Inject(TABLE_NAME) private tableName: string,
  ) {}

  async listAll(): Promise<SessionOverview[]> {
    return []
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

  async create(session: Session): Promise<void> {
    const item = SessionMapper.toPersistence(session);

    // TODO: implement logic to search for court to get cour data and validate court existence
    const denormalizeData = {
      lat: 10.771505716410465,
      lng: 106.66471299999887,
      court_name: 'T19',
      user_name: 'Nguyen Van A',
    };

    const itemToBeSaved = {
      ...item,
      ...denormalizeData,
    };

    console.log("Item: ", itemToBeSaved);

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: itemToBeSaved,
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    );
  }
}
