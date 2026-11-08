// @typescript-eslint/unbound-method flags `expect(repo.someMethod).toHaveBeenCalledWith(...)`
// as an unbound method reference -- a real risk for a class instance method that reads `this`,
// but these are jest.fn() mocks with no `this` of their own, so the rule's concern doesn't apply.
/* eslint-disable @typescript-eslint/unbound-method */
import {
  Area,
  City,
  CourtItemResponse,
  CreateSessionInput,
  ShuttleType,
  SkillLevel,
  UserItemResponse,
} from '@shuttle-connect/types';
import { CreateSessionsUseCase } from './create-session.use-case';
import type { SessionRepository } from '../../domain/session';
import type { CourtRepository } from '../../domain/court';
import type { UserRepository } from '../../domain/user';
import { EntityNotFoundError } from '../../domain/shared/errors';

function makeCourt(overrides: Partial<CourtItemResponse> = {}): CourtItemResponse {
  return {
    id: 'court-1',
    name: 'T19 Badminton',
    address: '19 Nguyen Van Troi',
    district: Area.HCM_DISTRICT_10,
    city: City.HO_CHI_MINH,
    latitude: 10.77,
    longitude: 106.7,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeHost(overrides: Partial<UserItemResponse> = {}): UserItemResponse {
  return {
    id: 'host-1',
    fullName: 'Host Name',
    email: 'host@example.com',
    skillLevel: SkillLevel.INTERMEDIATE,
    createdAt: '2026-01-01T00:00:00.000Z',
    onboarded: true,
    ...overrides,
  };
}

function makeInput(overrides: Partial<CreateSessionInput> = {}): CreateSessionInput {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    courtId: 'court-1',
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    slotsRemaining: 4,
    slotsTotal: 4,
    priceMale: 50000,
    priceFemale: 50000,
    shuttleType: ShuttleType.YONEX_AS30,
    minSkillLevel: SkillLevel.BEGINNER,
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

function makeCourtRepo(
  overrides: Partial<jest.Mocked<CourtRepository>> = {},
): jest.Mocked<CourtRepository> {
  return {
    listCourtsByDistrict: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
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

describe('CreateSessionsUseCase', () => {
  it('throws EntityNotFoundError when the court does not exist', async () => {
    const courtRepo = makeCourtRepo({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new CreateSessionsUseCase(makeSessionRepo(), courtRepo, makeUserRepo());

    await expect(useCase.execute('host-1', makeInput())).rejects.toThrow(EntityNotFoundError);
  });

  it('throws EntityNotFoundError when the host does not exist (checked after court, before persisting)', async () => {
    const courtRepo = makeCourtRepo({ findById: jest.fn().mockResolvedValue(makeCourt()) });
    const userRepo = makeUserRepo({ findById: jest.fn().mockResolvedValue(null) });
    const sessionRepo = makeSessionRepo();
    const useCase = new CreateSessionsUseCase(sessionRepo, courtRepo, userRepo);

    await expect(useCase.execute('host-1', makeInput())).rejects.toThrow(EntityNotFoundError);
    expect(sessionRepo.create).not.toHaveBeenCalled();
  });

  it('propagates Session.create validation errors (e.g. an invalid time slot) without persisting', async () => {
    const courtRepo = makeCourtRepo({ findById: jest.fn().mockResolvedValue(makeCourt()) });
    const userRepo = makeUserRepo({ findById: jest.fn().mockResolvedValue(makeHost()) });
    const sessionRepo = makeSessionRepo();
    const useCase = new CreateSessionsUseCase(sessionRepo, courtRepo, userRepo);

    const pastStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await expect(useCase.execute('host-1', makeInput({ startTime: pastStart }))).rejects.toThrow();
    expect(sessionRepo.create).not.toHaveBeenCalled();
  });

  it('persists the session with the denormalized court and host on success', async () => {
    const court = makeCourt();
    const host = makeHost();
    const courtRepo = makeCourtRepo({ findById: jest.fn().mockResolvedValue(court) });
    const userRepo = makeUserRepo({ findById: jest.fn().mockResolvedValue(host) });
    const sessionRepo = makeSessionRepo({
      create: jest.fn().mockResolvedValue({ id: 'session-1' }),
    });
    const useCase = new CreateSessionsUseCase(sessionRepo, courtRepo, userRepo);

    await useCase.execute('host-1', makeInput());

    expect(sessionRepo.create).toHaveBeenCalledTimes(1);
    const [, passedCourt, passedHost] = sessionRepo.create.mock.calls[0];
    expect(passedCourt).toBe(court);
    expect(passedHost).toBe(host);
  });
});
