// @typescript-eslint/unbound-method flags `expect(repo.someMethod).toHaveBeenCalledWith(...)`
// as an unbound method reference -- a real risk for a class instance method that reads `this`,
// but these are jest.fn() mocks with no `this` of their own, so the rule's concern doesn't apply.
/* eslint-disable @typescript-eslint/unbound-method */
import { Area, City } from '@shuttle-connect/types';
import { ListSessionsByDistrictUseCase } from './list-sessions-by-district.use-case';
import type { SessionRepository } from '../../domain/session';
import { InvalidCityDistrictError } from '../../domain/shared/errors';

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

describe('ListSessionsByDistrictUseCase', () => {
  it('throws InvalidCityDistrictError when the district does not belong to the city', async () => {
    const sessionRepo = makeSessionRepo();
    const useCase = new ListSessionsByDistrictUseCase(sessionRepo);

    await expect(useCase.execute({ city: City.HANOI, area: Area.HCM_DISTRICT_10 })).rejects.toThrow(
      InvalidCityDistrictError,
    );
    expect(sessionRepo.listSessionsByDistrict).not.toHaveBeenCalled();
  });

  it('defaults startTime to now when not provided', async () => {
    const sessionRepo = makeSessionRepo({
      listSessionsByDistrict: jest.fn().mockResolvedValue([]),
    });
    const useCase = new ListSessionsByDistrictUseCase(sessionRepo);
    const before = Date.now();

    await useCase.execute({ city: City.HO_CHI_MINH, area: Area.HCM_DISTRICT_10 });

    const [, , passedStartTime] = sessionRepo.listSessionsByDistrict.mock.calls[0];
    expect(passedStartTime).toBeInstanceOf(Date);
    expect(passedStartTime!.getTime()).toBeGreaterThanOrEqual(before);
    expect(passedStartTime!.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('parses an explicit startTime instead of defaulting to now', async () => {
    const sessionRepo = makeSessionRepo({
      listSessionsByDistrict: jest.fn().mockResolvedValue([]),
    });
    const useCase = new ListSessionsByDistrictUseCase(sessionRepo);
    const explicit = '2026-06-01T00:00:00.000Z';

    await useCase.execute({
      city: City.HO_CHI_MINH,
      area: Area.HCM_DISTRICT_10,
      startTime: explicit,
    });

    const [, , passedStartTime] = sessionRepo.listSessionsByDistrict.mock.calls[0];
    expect(passedStartTime).toEqual(new Date(explicit));
  });
});
