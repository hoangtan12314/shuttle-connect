import { Inject, Injectable } from '@nestjs/common';
import { Area, City, CourtItemOverview, CourtItemResponse } from '@shuttle-connect/types';
import { courtLocationKey, CourtMapper } from '../mapper';
import { DYNAMODB_CLIENT, TABLE_NAME } from '../provider';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { Court, CourtRepository } from '../../../domain/court';

@Injectable()
export class CourtRepositoryDynamoDB implements CourtRepository {
  constructor(
    @Inject(DYNAMODB_CLIENT) private client: DynamoDBDocumentClient,
    @Inject(TABLE_NAME) private tableName: string,
  ) {}

  async listCourtsByDistrict(city: City, area: Area): Promise<CourtItemOverview[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: { ':pk': courtLocationKey(city, area) },
      }),
    );

    return (result.Items ?? []).map(CourtMapper.toOverview);
  }

  async findById(id: string): Promise<CourtItemResponse | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { PK: `COURT#${id}`, SK: 'META' },
      }),
    );

    return result.Item ? CourtMapper.toResponse(result.Item) : null;
  }

  async create(court: Court): Promise<CourtItemResponse> {
    const item = CourtMapper.toPersistence(court);

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    );

    // No second read -- CourtItemResponse's fields are a 1:1 match with the Court entity itself.
    return CourtMapper.toResponse(court);
  }
}
