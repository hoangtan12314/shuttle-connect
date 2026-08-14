import { Inject, Injectable } from '@nestjs/common';
import { CourtItemResponse } from '@shuttle-connect/types';
import { CourtMapper } from '../mapper';
import { DYNAMODB_CLIENT, TABLE_NAME } from '../provider';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Court, CourtRepository } from '../../../domain/court';

@Injectable()
export class CourtRepositoryDynamoDB implements CourtRepository {
  constructor(
    @Inject(DYNAMODB_CLIENT) private client: DynamoDBDocumentClient,
    @Inject(TABLE_NAME) private tableName: string,
  ) {}

  async findById(id: string): Promise<CourtItemResponse | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { PK: `COURT#${id}`, SK: 'META' },
      }),
    );

    return result.Item ? CourtMapper.toResponse(result.Item) : null;
  }

  async create(court: Court): Promise<void> {
    const item = CourtMapper.toPersistence(court);

    console.log('Item: ', item);

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    );
  }
}
