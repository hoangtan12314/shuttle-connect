import { Inject, Injectable } from '@nestjs/common';
import {
  Area,
  City,
  CourtItemResponse,
  SessionItemResponse,
  SessionOverview,
  SessionStatus,
  UserItemResponse,
} from '@shuttle-connect/types';
import { Session, SessionRepository } from '../../../domain/session';
import { SessionMapper, sessionGsi1, sessionGsi2, toLocationKey } from '../mapper';
import { DYNAMODB_CLIENT, TABLE_NAME } from '../provider';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import {
  ConcurrentUpdateError,
  CoverChangeLimitReachedError,
  EntityNotFoundError,
  ForbiddenError,
  InvalidCoverUploadError,
  SessionNotEditableError,
} from '../../../domain/shared/errors';

@Injectable()
export class SessionRepositoryDynamoDB implements SessionRepository {
  constructor(
    @Inject(DYNAMODB_CLIENT) private client: DynamoDBDocumentClient,
    @Inject(TABLE_NAME) private tableName: string,
  ) {}

  async listSessionsByDistrict(
    city: City,
    area: Area,
    startTime: Date,
  ): Promise<SessionOverview[]> {
    const { GSI1PK, GSI1SK } = sessionGsi1(city, area, startTime.getTime());

    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK >= :from',
        ExpressionAttributeValues: {
          ':pk': GSI1PK,
          ':from': GSI1SK,
        },
        ScanIndexForward: true,
        Limit: 50,
      }),
    );
    return (result.Items ?? []).map(SessionMapper.toOverview);
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

  async getByUserId(userId: string): Promise<SessionOverview[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK BETWEEN :from AND :to',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':from': `SESSION#${new Date().getTime()}`,
          ':to': `SESSION#9999999999999`,
        },
        ScanIndexForward: true,
        Limit: 50,
      }),
    );

    return (result.Items ?? []).map(SessionMapper.toOverview);
  }

  async create(
    session: Session,
    court: CourtItemResponse,
    host: UserItemResponse,
  ): Promise<SessionItemResponse> {
    const item = SessionMapper.toPersistence(session);

    const denormalizeData = {
      lat: court.latitude,
      lng: court.longitude,
      court_name: court.name,
      location: toLocationKey(court.city, court.district),
      user_name: host.fullName,
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

    // No second read -- `court`/`host` are exactly what was just denormalized onto the item, and
    // `session` is the entity that produced it; PutCommand can't hand back "the new item" the way
    // UpdateCommand's ReturnValues: 'ALL_NEW' can (an UpdateItem-only feature), and doesn't need to.
    return SessionMapper.toResponse(session, court, host);
  }

  async update(
    sessionId: string,
    hostId: string,
    expected: { slotsTotal: number; slotsRemaining: number },
    changes: Parameters<SessionRepository['update']>[3],
  ): Promise<SessionItemResponse> {
    const sets: string[] = [];
    const values: Record<string, unknown> = {
      ':host': hostId,
      ':now': Date.now(),
      ':open': SessionStatus.OPEN,
      ':full': SessionStatus.FULL,
    };
    const set = (attr: string, key: string, value: unknown) => {
      sets.push(`${attr} = ${key}`);
      values[key] = value;
    };

    if (changes.priceMale !== undefined) set('price_male', ':pm', changes.priceMale);
    if (changes.priceFemale !== undefined) set('price_female', ':pf', changes.priceFemale);
    if (changes.shuttleType !== undefined) set('shuttle_type', ':sh', changes.shuttleType);
    if (changes.minSkillLevel !== undefined) set('min_skill_level', ':ml', changes.minSkillLevel);
    if (changes.description !== undefined) set('description', ':desc', changes.description);
    if (changes.slots) {
      values[':oldTotal'] = expected.slotsTotal;
      values[':oldRemaining'] = expected.slotsRemaining;
      set('slots_total', ':newTotal', changes.slots.slotsTotal);
      set('slots_remaining', ':newRemaining', changes.slots.slotsRemaining);
      set('#s', ':newStatus', changes.slots.status);
    }

    try {
      const result = await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { PK: `SESSION#${sessionId}`, SK: 'META' },
          UpdateExpression: sets.length ? `SET ${sets.join(', ')}` : undefined,
          // start_time/status re-check "still editable" at the write, like setCover does. The slot
          // check is the same optimistic one approveRequest uses: if an approval/withdrawal landed
          // between the use case's read and now, slots_total/slots_remaining no longer match
          // `expected` and this fails instead of overwriting the new count. It's only added when
          // this write actually sets the slot fields -- a price/notes edit doesn't touch them, so
          // a concurrent approval is no reason to reject it.
          ConditionExpression:
            'attribute_exists(PK) AND user_id = :host AND start_time > :now AND (#s = :open OR #s = :full)' +
            (changes.slots
              ? ' AND slots_total = :oldTotal AND slots_remaining = :oldRemaining'
              : ''),
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: values,
          ReturnValues: 'ALL_NEW',
        }),
      );
      return SessionMapper.toResponse(result.Attributes!);
    } catch (error) {
      if (!(error instanceof ConditionalCheckFailedException)) {
        throw error;
      }
      // DynamoDB doesn't say which conjunct failed -- re-read to report the real cause.
      const current = await this.findById(sessionId);
      if (!current) {
        throw new EntityNotFoundError('Session');
      }
      if (current.host.id !== hostId) {
        throw new ForbiddenError();
      }
      if (current.status === SessionStatus.CANCELLED) {
        throw new SessionNotEditableError('the session was cancelled');
      }
      if (new Date(current.startTime).getTime() <= Date.now()) {
        throw new SessionNotEditableError('the session has already started');
      }
      throw new ConcurrentUpdateError();
    }
  }

  async setCover(
    sessionId: string,
    hostId: string,
    coverKey: string,
    maxChanges: number,
  ): Promise<{ previousCoverKey: string | null; session: SessionItemResponse }> {
    try {
      // ALL_OLD, not ALL_NEW: the old image is the only way to learn the previous cover_key (to
      // delete that object) in the same single write. The new state is just old + these two fields.
      const result = await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { PK: `SESSION#${sessionId}`, SK: 'META' },
          UpdateExpression:
            'SET cover_key = :key, cover_change_count = if_not_exists(cover_change_count, :zero) + :one',
          // start_time > :now re-checks "hasn't started yet" at the actual write, not just when
          // UploadCoverUseCase read the session earlier in the request -- without this, a session
          // that starts in the gap between that read and this write would still accept a cover.
          ConditionExpression:
            'attribute_exists(PK) AND user_id = :host AND start_time > :now AND (attribute_not_exists(cover_change_count) OR cover_change_count < :max)',
          ExpressionAttributeValues: {
            ':key': coverKey,
            ':host': hostId,
            ':now': Date.now(),
            ':zero': 0,
            ':one': 1,
            ':max': maxChanges,
          },
          ReturnValues: 'ALL_OLD',
        }),
      );

      const old = result.Attributes!;
      return {
        previousCoverKey: (old.cover_key as string | undefined) ?? null,
        session: SessionMapper.toResponse({
          ...old,
          cover_key: coverKey,
          cover_change_count: ((old.cover_change_count as number | undefined) ?? 0) + 1,
        }),
      };
    } catch (error) {
      if (!(error instanceof ConditionalCheckFailedException)) {
        throw error;
      }
      // DynamoDB doesn't say which conjunct of the ConditionExpression failed -- UploadCoverUseCase
      // already checked existence/host/start-time before uploading the file, but that check is now
      // stale, so re-read to report the real cause instead of always blaming the change cap.
      const current = await this.findById(sessionId);
      if (!current) {
        throw new EntityNotFoundError('Session');
      }
      if (current.host.id !== hostId) {
        throw new ForbiddenError();
      }
      if (new Date(current.startTime).getTime() <= Date.now()) {
        throw new InvalidCoverUploadError('the session has already started');
      }
      throw new CoverChangeLimitReachedError();
    }
  }
}
