import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { INestApplicationContext } from '@nestjs/common';
import type { DynamoDBStreamEvent, DynamoDBRecord, Handler } from 'aws-lambda';
import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
// Imported directly, not via the '../../ioc' barrel -- that barrel's `export *` for every other
// module (session, court, request, auth, user) would get evaluated too, transitively pulling in
// the `sst` package's ESM-only dist, which ts-jest's CommonJS transform can't parse. Also just a
// smaller, more honest import surface for what this file actually needs.
import { NotificationStreamModule } from '../../ioc/notification-stream.module';
import {
  CreateRequestNotificationUseCase,
  RetractDecisionNotificationUseCase,
} from '../../../application/notification';
import type { RequestRecord } from '../../dynamodb/mapper';
import { classifyTransition } from './classify-transition';

const logger = new Logger('RequestStatusChangedHandler');

// unmarshall() returns `any`; pin the fields this handler reads to the request item's real shape.
type RequestImage = Pick<
  RequestRecord,
  'PK' | 'status' | 'user_id' | 'user_name' | 'court_name' | 'session_start_time'
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
  createUseCase: CreateRequestNotificationUseCase,
  retractUseCase: RetractDecisionNotificationUseCase,
): Promise<void> {
  const newImage = record.dynamodb?.NewImage;
  // Epoch SECONDS, set when DynamoDB captured the change -- identical on every redelivery.
  const capturedAt = record.dynamodb?.ApproximateCreationDateTime;
  if (!newImage || !record.eventID || capturedAt === undefined) return;

  const newItem = toRequestImage(newImage);
  // No OldImage on an INSERT (a first join) -- undefined is exactly what classifyTransition
  // expects for that case.
  const oldImage = record.dynamodb?.OldImage;
  const oldStatus = oldImage ? toRequestImage(oldImage).status : undefined;

  const action = classifyTransition(oldStatus, newItem.status);
  if (!action) return;

  const sessionId = sessionIdFromPk(newItem.PK);

  if (action.kind === 'retract') {
    await retractUseCase.execute({ sessionId, requesterId: newItem.user_id });
    logger.log(`Retracted decision notification for session ${sessionId}`);
    return;
  }

  await createUseCase.execute({
    type: action.type,
    sessionId,
    requesterId: newItem.user_id,
    eventId: record.eventID,
    occurredAt: new Date(Math.round(capturedAt * 1000)),
    actorName: newItem.user_name,
    courtName: newItem.court_name,
    sessionStartTime: new Date(newItem.session_start_time),
    wasApproved: action.wasApproved,
  });

  logger.log(`Processed ${action.type} notification for session ${sessionId}`);
}

export const handler: Handler<DynamoDBStreamEvent> = async (event: DynamoDBStreamEvent) => {
  const nestContext = await getContext();
  const createUseCase = nestContext.get(CreateRequestNotificationUseCase);
  const retractUseCase = nestContext.get(RetractDecisionNotificationUseCase);

  for (const record of event.Records) {
    await handleRecord(record, createUseCase, retractUseCase);
  }
};
