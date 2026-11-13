import { S3Client } from '@aws-sdk/client-s3';

export const S3_CLIENT = Symbol('S3Client');

export const S3ClientProvider = {
  provide: S3_CLIENT,
  useFactory: (): S3Client => new S3Client({}), // region/credentials come from the Lambda env
};
