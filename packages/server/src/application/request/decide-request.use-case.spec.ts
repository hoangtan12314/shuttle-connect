// @typescript-eslint/unbound-method flags `expect(repo.someMethod).toHaveBeenCalledWith(...)`
// as an unbound method reference -- a real risk for a class instance method that reads `this`,
// but these are jest.fn() mocks with no `this` of their own, so the rule's concern doesn't apply.
/* eslint-disable @typescript-eslint/unbound-method */
import {
  RequestItemResponse,
  RequestStatus,
  SessionItemResponse,
  SessionStatus,
  SkillLevel,
  ShuttleType,
  Area,
  City,
} from '@shuttle-connect/types';
import { DecideRequestUseCase } from './decide-request.use-case';
import type { RequestRepository } from '../../domain/request';
import type { SessionRepository } from '../../domain/session';
import { SessionFullError, SessionNotOpenError } from '../../domain/session';
import {
  EntityNotFoundError,
  ForbiddenError,
  RequestAlreadyDecidedError,
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
    status: RequestStatus.PENDING,
    createdAt: '2026-06-01T09:00:00.000Z',
    joinCount: 1,
    withdrawnAt: null,
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
    getBySessionAndUser: jest.fn(),
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
    ...overrides,
  };
}

describe('DecideRequestUseCase', () => {
  it('throws EntityNotFoundError when the session does not exist', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new DecideRequestUseCase(makeRequestRepo(), sessionRepo);

    await expect(
      useCase.execute('host-1', 'session-1', 'requester-1', { status: RequestStatus.REJECTED }),
    ).rejects.toThrow(EntityNotFoundError);
  });

  it('throws ForbiddenError when the caller is not the session host', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const useCase = new DecideRequestUseCase(makeRequestRepo(), sessionRepo);

    await expect(
      useCase.execute('not-the-host', 'session-1', 'requester-1', {
        status: RequestStatus.REJECTED,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws EntityNotFoundError when the request does not exist', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const requestRepo = makeRequestRepo({ getBySessionAndUser: jest.fn().mockResolvedValue(null) });
    const useCase = new DecideRequestUseCase(requestRepo, sessionRepo);

    await expect(
      useCase.execute('host-1', 'session-1', 'requester-1', { status: RequestStatus.REJECTED }),
    ).rejects.toThrow(EntityNotFoundError);
  });

  it('throws RequestAlreadyDecidedError when the request is not PENDING', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest
        .fn()
        .mockResolvedValue(makeRequestItem({ status: RequestStatus.APPROVED })),
    });
    const useCase = new DecideRequestUseCase(requestRepo, sessionRepo);

    await expect(
      useCase.execute('host-1', 'session-1', 'requester-1', { status: RequestStatus.REJECTED }),
    ).rejects.toThrow(RequestAlreadyDecidedError);
  });

  it('rejects a PENDING request without checking session capacity', async () => {
    const sessionRepo = makeSessionRepo({
      findById: jest
        .fn()
        .mockResolvedValue(makeSession({ status: SessionStatus.FULL, slotsRemaining: 0 })),
    });
    const rejected = makeRequestItem({ status: RequestStatus.REJECTED });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest.fn().mockResolvedValue(makeRequestItem()),
      rejectRequest: jest.fn().mockResolvedValue(rejected),
    });
    const useCase = new DecideRequestUseCase(requestRepo, sessionRepo);

    const result = await useCase.execute('host-1', 'session-1', 'requester-1', {
      status: RequestStatus.REJECTED,
    });

    expect(result).toBe(rejected);
    expect(requestRepo.rejectRequest).toHaveBeenCalledWith('session-1', 'requester-1');
  });

  it('throws SessionNotOpenError when approving but the session is not OPEN', async () => {
    const sessionRepo = makeSessionRepo({
      findById: jest.fn().mockResolvedValue(makeSession({ status: SessionStatus.CANCELLED })),
    });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest.fn().mockResolvedValue(makeRequestItem()),
    });
    const useCase = new DecideRequestUseCase(requestRepo, sessionRepo);

    await expect(
      useCase.execute('host-1', 'session-1', 'requester-1', { status: RequestStatus.APPROVED }),
    ).rejects.toThrow(SessionNotOpenError);
  });

  it('throws SessionFullError when approving but there are no slots left', async () => {
    const sessionRepo = makeSessionRepo({
      findById: jest.fn().mockResolvedValue(makeSession({ slotsRemaining: 0 })),
    });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest.fn().mockResolvedValue(makeRequestItem()),
    });
    const useCase = new DecideRequestUseCase(requestRepo, sessionRepo);

    await expect(
      useCase.execute('host-1', 'session-1', 'requester-1', { status: RequestStatus.APPROVED }),
    ).rejects.toThrow(SessionFullError);
  });

  it('approves a PENDING request when the session is open with slots available', async () => {
    const sessionRepo = makeSessionRepo({
      findById: jest.fn().mockResolvedValue(makeSession({ slotsRemaining: 2 })),
    });
    const approved = makeRequestItem({ status: RequestStatus.APPROVED });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest
        .fn()
        .mockResolvedValueOnce(makeRequestItem())
        .mockResolvedValueOnce(approved),
      approveRequest: jest.fn().mockResolvedValue(undefined),
    });
    const useCase = new DecideRequestUseCase(requestRepo, sessionRepo);

    const result = await useCase.execute('host-1', 'session-1', 'requester-1', {
      status: RequestStatus.APPROVED,
    });

    expect(requestRepo.approveRequest).toHaveBeenCalledWith('session-1', 'requester-1', 2);
    expect(result).toBe(approved);
  });

  it('throws the "unreachable" fatal error if the request vanishes immediately after approval', async () => {
    const sessionRepo = makeSessionRepo({
      findById: jest.fn().mockResolvedValue(makeSession({ slotsRemaining: 2 })),
    });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest
        .fn()
        .mockResolvedValueOnce(makeRequestItem())
        .mockResolvedValueOnce(null),
      approveRequest: jest.fn().mockResolvedValue(undefined),
    });
    const useCase = new DecideRequestUseCase(requestRepo, sessionRepo);

    await expect(
      useCase.execute('host-1', 'session-1', 'requester-1', { status: RequestStatus.APPROVED }),
    ).rejects.toThrow(/vanished immediately/);
  });

  it('throws the "unreachable" fatal error for an unhandled decision status', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest.fn().mockResolvedValue(makeRequestItem()),
    });
    const useCase = new DecideRequestUseCase(requestRepo, sessionRepo);

    await expect(
      useCase.execute('host-1', 'session-1', 'requester-1', {
        status: RequestStatus.PENDING,
      }),
    ).rejects.toThrow(/unhandled status/);
  });
});
