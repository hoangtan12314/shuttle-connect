// @typescript-eslint/unbound-method flags `expect(repo.someMethod).toHaveBeenCalledWith(...)`
// as an unbound method reference -- a real risk for a class instance method that reads `this`,
// but these are jest.fn() mocks with no `this` of their own, so the rule's concern doesn't apply.
/* eslint-disable @typescript-eslint/unbound-method */
import { Area, City } from '@shuttle-connect/types';
import { ListCourtsByDistrictUseCase } from './list-courts-by-district.use-case';
import type { CourtRepository } from '../../domain/court';
import { InvalidCityDistrictError } from '../../domain/shared/errors';

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

describe('ListCourtsByDistrictUseCase', () => {
  it('throws InvalidCityDistrictError when the district does not belong to the city', async () => {
    const courtRepo = makeCourtRepo();
    const useCase = new ListCourtsByDistrictUseCase(courtRepo);

    await expect(useCase.execute({ city: City.HANOI, area: Area.HCM_DISTRICT_10 })).rejects.toThrow(
      InvalidCityDistrictError,
    );
    expect(courtRepo.listCourtsByDistrict).not.toHaveBeenCalled();
  });

  it('lists courts for a valid city/district pair', async () => {
    const courts = [{ id: 'court-1', name: 'T19 Badminton', address: '19 Nguyen Van Troi' }];
    const courtRepo = makeCourtRepo({ listCourtsByDistrict: jest.fn().mockResolvedValue(courts) });
    const useCase = new ListCourtsByDistrictUseCase(courtRepo);

    const result = await useCase.execute({ city: City.HO_CHI_MINH, area: Area.HCM_DISTRICT_10 });

    expect(result).toBe(courts);
    expect(courtRepo.listCourtsByDistrict).toHaveBeenCalledWith(
      City.HO_CHI_MINH,
      Area.HCM_DISTRICT_10,
    );
  });
});
