import { IsEnum } from 'class-validator';
import { Area, City, ListCourtsByDistrictInput } from '@shuttle-connect/types';

export class ListCourtsByDistrictDto implements ListCourtsByDistrictInput {
  @IsEnum(Area)
  area!: Area;

  @IsEnum(City)
  city!: City;
}
