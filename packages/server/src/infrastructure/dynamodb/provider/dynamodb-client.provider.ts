// infrastructure/dynamodb/dynamodb-client.provider.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const DYNAMODB_CLIENT = Symbol('DynamoDBDocumentClient');

export const DynamoDbClientProvider = {
  provide: DYNAMODB_CLIENT,
  useFactory: (): DynamoDBDocumentClient => {
    const client = new DynamoDBClient({}); // picks up region/credentials automatically in Lambda
    return DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true }, // avoids errors when optional fields are undefined
    });
  },
};
