import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
import { Area, City, ListSessionsByDistrictInput } from '@shuttle-connect/types';

export class ListSessionsByDistrictDto implements ListSessionsByDistrictInput {
  @IsOptional()
  @IsISO8601()
  startTime?: string;

  @IsEnum(Area)
  area!: Area;

  @IsEnum(City)
  city!: City;
}
