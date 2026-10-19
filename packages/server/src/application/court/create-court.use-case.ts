import { Inject, Injectable } from '@nestjs/common';
import { CourtItemResponse, CreateCourtInput } from '@shuttle-connect/types';
import { Court, COURT_REPOSITORY, type CourtRepository } from '../../domain/court';

@Injectable()
export class CreateCourtUseCase {
  constructor(@Inject(COURT_REPOSITORY) private courtRepository: CourtRepository) {}

  async execute(input: CreateCourtInput): Promise<CourtItemResponse> {
    const courtToBeCreated = Court.create({
      name: input.name,
      address: input.address,
      district: input.district,
      city: input.city,
      latitude: input.latitude,
      longitude: input.longitude,
    });

    return this.courtRepository.create(courtToBeCreated);
  }
}
