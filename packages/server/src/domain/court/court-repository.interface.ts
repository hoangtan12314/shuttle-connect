import { CourtItemResponse } from '@shuttle-connect/types';
import { Court } from './court.entity';

export interface CourtRepository {
  findById(id: string): Promise<CourtItemResponse | null>;
  create(court: Court): Promise<void>;
}

export const COURT_REPOSITORY = Symbol('CourtRepository');
