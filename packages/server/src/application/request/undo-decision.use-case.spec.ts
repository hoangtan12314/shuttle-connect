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
} from '@shuttle-connect/types';
import { UndoDecisionUseCase } from './undo-decision.use-case';
import type { RequestRepository } from '../../domain/request';
import type { SessionRepository } from '../../domain/session';
import {
  EntityNotFoundError,
  ForbiddenError,
  RequestNotDecidedError,
} from '../../domain/shared/errors';

function makeSession(overrides: Partial<SessionItemResponse> = {}): SessionItemResponse {
  return {
    id: 'session-1',
    status: SessionStatus.OPEN,
    startTime: '2026-06-01T10:00:00.000Z',
    endTime: '2026-06-01T12:00:00.000Z',
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
    status: RequestStatus.APPROVED,
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

describe('UndoDecisionUseCase', () => {
  it('throws EntityNotFoundError when the session does not exist', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new UndoDecisionUseCase(makeRequestRepo(), sessionRepo);

    await expect(useCase.execute('host-1', 'session-1', 'requester-1')).rejects.toThrow(
      EntityNotFoundError,
    );
  });

  it('throws ForbiddenError when the caller is not the session host', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const useCase = new UndoDecisionUseCase(makeRequestRepo(), sessionRepo);

    await expect(useCase.execute('not-the-host', 'session-1', 'requester-1')).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('throws EntityNotFoundError when the request does not exist', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const requestRepo = makeRequestRepo({ getBySessionAndUser: jest.fn().mockResolvedValue(null) });
    const useCase = new UndoDecisionUseCase(requestRepo, sessionRepo);

    await expect(useCase.execute('host-1', 'session-1', 'requester-1')).rejects.toThrow(
      EntityNotFoundError,
    );
  });

  it('throws RequestNotDecidedError when the request is still PENDING', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest
        .fn()
        .mockResolvedValue(makeRequestItem({ status: RequestStatus.PENDING })),
    });
    const useCase = new UndoDecisionUseCase(requestRepo, sessionRepo);

    await expect(useCase.execute('host-1', 'session-1', 'requester-1')).rejects.toThrow(
      RequestNotDecidedError,
    );
  });

  it('reverts an APPROVED request via revertApproval, passing the session slotsRemaining', async () => {
    const sessionRepo = makeSessionRepo({
      findById: jest.fn().mockResolvedValue(makeSession({ slotsRemaining: 1 })),
    });
    const reverted = makeRequestItem({ status: RequestStatus.PENDING });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest
        .fn()
        .mockResolvedValueOnce(makeRequestItem({ status: RequestStatus.APPROVED }))
        .mockResolvedValueOnce(reverted),
      revertApproval: jest.fn().mockResolvedValue(undefined),
    });
    const useCase = new UndoDecisionUseCase(requestRepo, sessionRepo);

    const result = await useCase.execute('host-1', 'session-1', 'requester-1');

    expect(requestRepo.revertApproval).toHaveBeenCalledWith('session-1', 'requester-1', 1);
    expect(requestRepo.revertRejection).not.toHaveBeenCalled();
    expect(result).toBe(reverted);
  });

  it('reverts a REJECTED request via revertRejection, without touching slots', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const reverted = makeRequestItem({ status: RequestStatus.PENDING });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest
        .fn()
        .mockResolvedValueOnce(makeRequestItem({ status: RequestStatus.REJECTED }))
        .mockResolvedValueOnce(reverted),
      revertRejection: jest.fn().mockResolvedValue(undefined),
    });
    const useCase = new UndoDecisionUseCase(requestRepo, sessionRepo);

    const result = await useCase.execute('host-1', 'session-1', 'requester-1');

    expect(requestRepo.revertRejection).toHaveBeenCalledWith('session-1', 'requester-1');
    expect(requestRepo.revertApproval).not.toHaveBeenCalled();
    expect(result).toBe(reverted);
  });

  it('throws the "unreachable" fatal error if the request vanishes immediately after the undo', async () => {
    const sessionRepo = makeSessionRepo({ findById: jest.fn().mockResolvedValue(makeSession()) });
    const requestRepo = makeRequestRepo({
      getBySessionAndUser: jest
        .fn()
        .mockResolvedValueOnce(makeRequestItem({ status: RequestStatus.APPROVED }))
        .mockResolvedValueOnce(null),
      revertApproval: jest.fn().mockResolvedValue(undefined),
    });
    const useCase = new UndoDecisionUseCase(requestRepo, sessionRepo);

    await expect(useCase.execute('host-1', 'session-1', 'requester-1')).rejects.toThrow(
      /vanished immediately/,
    );
  });
});
