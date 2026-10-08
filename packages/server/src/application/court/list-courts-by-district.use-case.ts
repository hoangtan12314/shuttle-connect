import { Inject, Injectable } from '@nestjs/common';
import { CITY_AREAS, CourtItemOverview, ListCourtsByDistrictInput } from '@shuttle-connect/types';
import { COURT_REPOSITORY, type CourtRepository } from '../../domain/court';
import { InvalidCityDistrictError } from '../../domain/shared/errors';

@Injectable()
export class ListCourtsByDistrictUseCase {
  constructor(@Inject(COURT_REPOSITORY) private courtRepository: CourtRepository) {}

  async execute(input: ListCourtsByDistrictInput): Promise<CourtItemOverview[]> {
    const { city, area } = input;
    if (!CITY_AREAS[city].includes(area)) {
      throw new InvalidCityDistrictError(city, area);
    }
    const courts = await this.courtRepository.listCourtsByDistrict(city, area);

    return courts;
  }
}
