// infrastructure/dynamodb/table-name.provider.ts
import { Resource } from 'sst';

export const TABLE_NAME = Symbol('TableName');

export const TableNameProvider = {
  provide: TABLE_NAME,
  useFactory: () => Resource['shuttle-connect'].name,
};
