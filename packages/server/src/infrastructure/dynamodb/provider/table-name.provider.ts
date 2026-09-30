// infrastructure/dynamodb/table-name.provider.ts
import { Resource } from 'sst';

export const TABLE_NAME = Symbol('TableName');

export const TableNameProvider = {
  provide: TABLE_NAME,
  useValue: Resource['shuttle-connect'].name,
};
