import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { INestApplicationContext } from '@nestjs/common';
import type { DynamoDBStreamEvent, DynamoDBRecord, Handler } from 'aws-lambda';
import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { RequestStatus } from '@shuttle-connect/types';
import { NotificationStreamModule } from '../../ioc';
import { CreateWithdrawalNotificationUseCase } from '../../../application/notification';
import type { RequestRecord } from '../../dynamodb/mapper';

const logger = new Logger('RequestWithdrawnHandler');

// unmarshall() returns `any`; pin the fields this handler reads to the request item's real shape.
type RequestImage = Pick<
  RequestRecord,
  'PK' | 'status' | 'user_name' | 'court_name' | 'session_start_time'
>;

// aws-lambda and the AWS SDK each define their own AttributeValue type for the same wire format.
const toRequestImage = (image: NonNullable<DynamoDBRecord['dynamodb']>['NewImage']) =>
  unmarshall(image as Record<string, AttributeValue>) as RequestImage;

// Only a cold start pays for Nest's DI setup -- same caching idea as the HTTP Lambda entrypoints
// (infrastructure/function/lambda/*.lambda.ts), just with createApplicationContext instead of a
// full HTTP app, since this Lambda is never invoked over HTTP.
let cachedContext: INestApplicationContext | undefined;

async function getContext(): Promise<INestApplicationContext> {
  cachedContext =
    cachedContext ?? (await NestFactory.createApplicationContext(NotificationStreamModule));
  return cachedContext;
}

function sessionIdFromPk(pk: string): string {
  return pk.replace('SESSION#', '');
}

async function handleRecord(
  record: DynamoDBRecord,
  useCase: CreateWithdrawalNotificationUseCase,
): Promise<void> {
  const newImage = record.dynamodb?.NewImage;
  const oldImage = record.dynamodb?.OldImage;
  // Epoch SECONDS, set when DynamoDB captured the change -- identical on every redelivery.
  const capturedAt = record.dynamodb?.ApproximateCreationDateTime;
  if (!newImage || !oldImage || !record.eventID || capturedAt === undefined) return;

  const newItem = toRequestImage(newImage);
  const oldItem = toRequestImage(oldImage);

  await useCase.execute({
    sessionId: sessionIdFromPk(newItem.PK),
    eventId: record.eventID,
    occurredAt: new Date(Math.round(capturedAt * 1000)),
    actorName: newItem.user_name,
    courtName: newItem.court_name,
    sessionStartTime: new Date(newItem.session_start_time),
    wasApproved: oldItem.status === RequestStatus.APPROVED,
  });

  logger.log(`Processed withdrawal notification for session ${sessionIdFromPk(newItem.PK)}`);
}

export const handler: Handler<DynamoDBStreamEvent> = async (event: DynamoDBStreamEvent) => {
  const nestContext = await getContext();
  const useCase = nestContext.get(CreateWithdrawalNotificationUseCase);

  for (const record of event.Records) {
    await handleRecord(record, useCase);
  }
};
