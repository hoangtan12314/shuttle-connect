import { Inject, Injectable } from '@nestjs/common';
import { SESSION_REPOSITORY, type SessionRepository } from '../../domain/session';
import { CITY_AREAS, ListSessionsByDistrictInput, SessionOverview } from '@shuttle-connect/types';
import { InvalidCityDistrictError } from '../../domain/shared/errors';

@Injectable()
export class ListSessionsByDistrictUseCase {
  constructor(@Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository) {}

  async execute(input: ListSessionsByDistrictInput): Promise<SessionOverview[]> {
    const { city, area, startTime } = input;

    if (!CITY_AREAS[city].includes(area)) {
      throw new InvalidCityDistrictError(city, area);
    }

    return await this.sessionRepository.listSessionsByDistrict(
      city,
      area,
      startTime ? new Date(startTime) : new Date(),
    );
  }
}
