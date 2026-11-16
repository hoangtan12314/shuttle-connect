// @typescript-eslint/unbound-method flags `expect(repo.someMethod).toHaveBeenCalledWith(...)`
// as an unbound method reference -- a real risk for a class instance method that reads `this`,
// but these are jest.fn() mocks with no `this` of their own, so the rule's concern doesn't apply.
/* eslint-disable @typescript-eslint/unbound-method */
import {
  Area,
  City,
  RequestItemResponse,
  RequestStatus,
  SessionItemResponse,
  SessionStatus,
  ShuttleType,
  SkillLevel,
  UserItemResponse,
} from '@shuttle-connect/types';
import { CreateRequestUseCase } from './create-request.use-case';
import type { RequestRepository } from '../../domain/request';
import type { SessionRepository } from '../../domain/session';
import { SessionNotOpenError } from '../../domain/session';
import type { UserRepository } from '../../domain/user';
import {
  CannotJoinOwnSessionError,
  EntityNotFoundError,
  RejoinCooldownError,
} from '../../domain/shared/errors';

function makeSession(overrides: Partial<SessionItemResponse> = {}): SessionItemResponse {
  return {
    id: 'session-1',
    status: SessionStatus.OPEN,
    startTime: '2026-06-01T10:00:00.000Z',
    endTime: '2026-06-01T12:00:00.000Z',
    slotsRemaining: 2,
    slotsTotal: 4,
    priceMale: 50000,
    priceFemale: 50000,
    shuttleType: ShuttleType.YONEX_AS30,
    minSkillLevel: SkillLevel.BEGINNER,
    description: '',
    createdAt: '2026-05-01T00:00:00.000Z',
    court: {
      id: 'court-1',
      name: 'T19 Badminton',
      coordinates: { lat: 10.77, lng: 106.7 },
      district: Area.HCM_DISTRICT_10,
      city: City.HO_CHI_MINH,
    },
    host: { id: 'host-1', name: 'Host' },
    coverUrl: null,
    ...overrides,
  };
}

function makeUser(overrides: Partial<UserItemResponse> = {}): UserItemResponse {
  return {
    id: 'requester-1',
    fullName: 'Player 1',
    email: 'player@example.com',
    skillLevel: SkillLevel.BEGINNER,
    createdAt: '2026-01-01T00:00:00.000Z',
    onboarded: true,
    ...overrides,
  };
}

function makeRequestItem(overrides: Partial<RequestItemResponse> = {}): RequestItemResponse {
  return {
    user: { id: 'requester-1', name: 'Player', skillLevel: SkillLevel.BEGINNER },
    session: {
      id: 'session-1',
      startTime: '2026-06-01T10:00:00.000Z',
      endTime: '2026-06-01T12:00:00.000Z',
    },
    court: {
      name: 'T19 Badminton',
      district: Area.HCM_DISTRICT_10,
      city: City.HO_CHI_MINH,
      coordinates: { lat: 10.77, lng: 106.7 },
    },
    status: RequestStatus.WITHDRAWN,
    createdAt: '2026-06-01T09:00:00.000Z',
    joinCount: 1,
    withdrawnAt: '2026-06-01T09:30:00.000Z',
    ...overrides,
  };
}

function makeRequestRepo(
  overrides: Partial<jest.Mocked<RequestRepository>> = {},
): jest.Mocked<RequestRepository> {
  return {
    create: jest.fn(),
    getByUserId: jest.fn(),
    getBySessionId: jest.fn(),
    getBySessionAndUser: jest.fn().mockResolvedValue(null),
    approveRequest: jest.fn(),
    rejectRequest: jest.fn(),
    revertApproval: jest.fn(),
    revertRejection: jest.fn(),
    withdrawRequest: jest.fn(),
    ...overrides,
  };
}

function makeSessionRepo(
  overrides: Partial<jest.Mocked<SessionRepository>> = {},
): jest.Mocked<SessionRepository> {
  return {
    listSessionsByDistrict: jest.fn(),
    findById: jest.fn(),
    getByUserId: jest.fn(),
    create: jest.fn(),
    setCover: jest.fn(),
    update: jest.fn(),
    ...overrides,
  };
}

function makeUserRepo(
  overrides: Partial<jest.Mocked<UserRepository>> = {},
): jest.Mocked<UserRepository> {
  return {
    findByAuthId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    completeOnboarding: jest.fn(),
    ...overrides,
  };
}

describe('CreateRequestUseCase', () => {
  it('throws EntityNotFoundError when the session does not exist', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new CreateRequestUseCase(makeRequestRepo(), sessionRepo, makeUserRepo());

    await expect(useCase.execute('requester-1', { sessionId: 'session-1' })).rejects.toThrow(
      EntityNotFoundError,
    );
  });

  it('throws EntityNotFoundError when the requesting user does not exist', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const userRepo = makeUserRepo({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new CreateRequestUseCase(makeRequestRepo(), sessionRepo, userRepo);

    await expect(useCase.execute('requester-1', { sessionId: 'session-1' })).rejects.toThrow(
      EntityNotFoundError,
    );
  });

  it('throws CannotJoinOwnSessionError when the caller is the session host', async () => {
    const sessionRepo = makeSessionRepo({
      findById: jest.fn().mockResolvedValue(makeSession({ host: { id: 'host-1', name: 'Host' } })),
    });
    const userRepo = makeUserRepo({
      findById: jest.fn().mockResolvedValue(makeUser({ id: 'host-1' })),
    });
    const useCase = new CreateRequestUseCase(makeRequestRepo(), sessionRepo, userRepo);

    await expect(useCase.execute('host-1', { sessionId: 'session-1' })).rejects.toThrow(
      CannotJoinOwnSessionError,
    );
  });

  it('throws SessionNotOpenError when the session is not OPEN', async () => {
    const sessionRepo = makeSessionRepo({
      findById: jest.fn().mockResolvedValue(makeSession({ status: SessionStatus.FULL })),
    });
    const userRepo = makeUserRepo({ findById: jest.fn().mockResolvedValue(makeUser()) });
    const useCase = new CreateRequestUseCase(makeRequestRepo(), sessionRepo, userRepo);

    await expect(useCase.execute('requester-1', { sessionId: 'session-1' })).rejects.toThrow(
      SessionNotOpenError,
    );
  });

  it('creates a brand-new request with no rejoin check when there is no existing request', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const userRepo = makeUserRepo({ findById: jest.fn().mockResolvedValue(makeUser()) });
    const created = makeRequestItem({ status: RequestStatus.PENDING, joinCount: 1 });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(created),
    });
    const useCase = new CreateRequestUseCase(requestRepo, sessionRepo, userRepo);

    const result = await useCase.execute('requester-1', { sessionId: 'session-1' });

    expect(result).toBe(created);
    const [passedRequest] = requestRepo.create.mock.calls[0];
    expect(passedRequest.toJSON()).toMatchObject({ joinCount: 1 });
  });

  it('does not apply the rejoin check for a PENDING/APPROVED/REJECTED existing request (only WITHDRAWN is rejoinable)', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const userRepo = makeUserRepo({ findById: jest.fn().mockResolvedValue(makeUser()) });
    const created = makeRequestItem({ status: RequestStatus.PENDING, joinCount: 1 });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest
        .fn()
        .mockResolvedValue(makeRequestItem({ status: RequestStatus.REJECTED })),
      create: jest.fn().mockResolvedValue(created),
    });
    const useCase = new CreateRequestUseCase(requestRepo, sessionRepo, userRepo);

    await useCase.execute('requester-1', { sessionId: 'session-1' });

    // previousJoinCount should NOT have been carried over from the REJECTED row.
    const [passedRequest] = requestRepo.create.mock.calls[0];
    expect(passedRequest.toJSON()).toMatchObject({ joinCount: 1 });
  });

  it('runs the rejoin cooldown/cap check and bumps joinCount when rejoining a WITHDRAWN request', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const userRepo = makeUserRepo({ findById: jest.fn().mockResolvedValue(makeUser()) });
    const withdrawnJustNow = makeRequestItem({
      status: RequestStatus.WITHDRAWN,
      joinCount: 1,
      withdrawnAt: new Date().toISOString(),
    });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest.fn().mockResolvedValue(withdrawnJustNow),
    });
    const useCase = new CreateRequestUseCase(requestRepo, sessionRepo, userRepo);

    // Still inside the cooldown window (withdrawn "just now") -- must be blocked.
    await expect(useCase.execute('requester-1', { sessionId: 'session-1' })).rejects.toThrow(
      RejoinCooldownError,
    );
    expect(requestRepo.create).not.toHaveBeenCalled();
  });

  it('carries the previous joinCount forward on a successful rejoin outside the cooldown', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const userRepo = makeUserRepo({ findById: jest.fn().mockResolvedValue(makeUser()) });
    const longAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h ago, well past cooldown
    const existing = makeRequestItem({
      status: RequestStatus.WITHDRAWN,
      joinCount: 1,
      withdrawnAt: longAgo,
    });
    const created = makeRequestItem({ status: RequestStatus.PENDING, joinCount: 2 });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest.fn().mockResolvedValue(existing),
      create: jest.fn().mockResolvedValue(created),
    });
    const useCase = new CreateRequestUseCase(requestRepo, sessionRepo, userRepo);

    const result = await useCase.execute('requester-1', { sessionId: 'session-1' });

    expect(result).toBe(created);
    const [passedRequest] = requestRepo.create.mock.calls[0];
    expect(passedRequest.toJSON()).toMatchObject({ joinCount: 2 });
  });
});
