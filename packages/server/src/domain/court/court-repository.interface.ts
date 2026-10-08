import { Area, City, CourtItemOverview, CourtItemResponse } from '@shuttle-connect/types';
import { Court } from './court.entity';

export interface CourtRepository {
  listCourtsByDistrict(city: City, area: Area): Promise<CourtItemOverview[]>;
  findById(id: string): Promise<CourtItemResponse | null>;
  create(court: Court): Promise<void>;
}

export const COURT_REPOSITORY = Symbol('CourtRepository');
