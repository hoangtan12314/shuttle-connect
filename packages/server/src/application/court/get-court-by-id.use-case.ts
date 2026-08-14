import { Inject, Injectable } from '@nestjs/common';
import { CourtItemResponse } from '@shuttle-connect/types';
import { COURT_REPOSITORY, type CourtRepository } from '../../domain/court';
import { EntityNotFoundError } from '../../domain/shared/errors';

@Injectable()
export class GetCourtByIdUseCase {
  constructor(@Inject(COURT_REPOSITORY) private courtRepository: CourtRepository) {}

  async execute(id: string): Promise<CourtItemResponse | null> {
    const court = await this.courtRepository.findById(id);

    if (!court) {
      throw new EntityNotFoundError(`Court with ID ${id} not found`);
    }

    return court;
  }
}
