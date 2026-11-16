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
  WITHDRAW_CUTOFF_HOURS,
} from '@shuttle-connect/types';
import { WithdrawRequestUseCase } from './withdraw-request.use-case';
import type { RequestRepository } from '../../domain/request';
import type { SessionRepository } from '../../domain/session';
import {
  EntityNotFoundError,
  RequestNotWithdrawableError,
  WithdrawalWindowClosedError,
} from '../../domain/shared/errors';

const CUTOFF_MS = WITHDRAW_CUTOFF_HOURS * 60 * 60 * 1000;

function makeSession(overrides: Partial<SessionItemResponse> = {}): SessionItemResponse {
  return {
    id: 'session-1',
    status: SessionStatus.OPEN,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day out by default
    endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    slotsRemaining: 1,
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
    setCover: jest.fn(),
    update: jest.fn(),
    ...overrides,
  };
}

describe('WithdrawRequestUseCase', () => {
  it('throws EntityNotFoundError when the session does not exist', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new WithdrawRequestUseCase(makeRequestRepo(), sessionRepo);

    await expect(useCase.execute('requester-1', 'session-1')).rejects.toThrow(EntityNotFoundError);
  });

  it('throws EntityNotFoundError when the request does not exist', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const requestRepo = makeRequestRepo({ getBySessionAndUser: jest.fn().mockResolvedValue(null) });
    const useCase = new WithdrawRequestUseCase(requestRepo, sessionRepo);

    await expect(useCase.execute('requester-1', 'session-1')).rejects.toThrow(EntityNotFoundError);
  });

  it.each([RequestStatus.REJECTED, RequestStatus.WITHDRAWN])(
    'throws RequestNotWithdrawableError when the request is %s',
    async (status) => {
      const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
      const requestRepo = makeRequestRepo({
        getBySessionAndUser: jest.fn().mockResolvedValue(makeRequestItem({ status })),
      });
      const useCase = new WithdrawRequestUseCase(requestRepo, sessionRepo);

      await expect(useCase.execute('requester-1', 'session-1')).rejects.toThrow(
        RequestNotWithdrawableError,
      );
    },
  );

  it('allows withdrawing a PENDING request at any time, even inside what would be the APPROVED cutoff window', async () => {
    const soonSession = makeSession({
      startTime: new Date(Date.now() + 1000).toISOString(), // 1 second out -- inside the cutoff
    });
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(soonSession) });
    const withdrawn = makeRequestItem({ status: RequestStatus.WITHDRAWN });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest
        .fn()
        .mockResolvedValueOnce(makeRequestItem({ status: RequestStatus.PENDING }))
        .mockResolvedValueOnce(withdrawn),
      withdrawRequest: jest.fn().mockResolvedValue(undefined),
    });
    const useCase = new WithdrawRequestUseCase(requestRepo, sessionRepo);

    const result = await useCase.execute('requester-1', 'session-1');

    expect(requestRepo.withdrawRequest).toHaveBeenCalledWith('session-1', 'requester-1', {
      wasApproved: false,
      currentSlotsRemaining: soonSession.slotsRemaining,
    });
    expect(result).toBe(withdrawn);
  });

  it('throws WithdrawalWindowClosedError for an APPROVED request inside the cutoff window', async () => {
    const soonSession = makeSession({
      startTime: new Date(Date.now() + CUTOFF_MS - 1000).toISOString(), // 1s inside the cutoff
    });
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(soonSession) });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest
        .fn()
        .mockResolvedValue(makeRequestItem({ status: RequestStatus.APPROVED })),
    });
    const useCase = new WithdrawRequestUseCase(requestRepo, sessionRepo);

    await expect(useCase.execute('requester-1', 'session-1')).rejects.toThrow(
      WithdrawalWindowClosedError,
    );
    expect(requestRepo.withdrawRequest).not.toHaveBeenCalled();
  });

  it('allows withdrawing an APPROVED request exactly at the cutoff boundary and beyond', async () => {
    const atBoundary = makeSession({
      startTime: new Date(Date.now() + CUTOFF_MS + 1000).toISOString(), // 1s past the cutoff
    });
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(atBoundary) });
    const withdrawn = makeRequestItem({ status: RequestStatus.WITHDRAWN });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest
        .fn()
        .mockResolvedValueOnce(makeRequestItem({ status: RequestStatus.APPROVED }))
        .mockResolvedValueOnce(withdrawn),
      withdrawRequest: jest.fn().mockResolvedValue(undefined),
    });
    const useCase = new WithdrawRequestUseCase(requestRepo, sessionRepo);

    const result = await useCase.execute('requester-1', 'session-1');

    expect(requestRepo.withdrawRequest).toHaveBeenCalledWith('session-1', 'requester-1', {
      wasApproved: true,
      currentSlotsRemaining: atBoundary.slotsRemaining,
    });
    expect(result).toBe(withdrawn);
  });

  it('throws the "unreachable" fatal error if the request vanishes immediately after the withdraw', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest
        .fn()
        .mockResolvedValueOnce(makeRequestItem({ status: RequestStatus.PENDING }))
        .mockResolvedValueOnce(null),
      withdrawRequest: jest.fn().mockResolvedValue(undefined),
    });
    const useCase = new WithdrawRequestUseCase(requestRepo, sessionRepo);

    await expect(useCase.execute('requester-1', 'session-1')).rejects.toThrow(
      /vanished immediately/,
    );
  });
});
