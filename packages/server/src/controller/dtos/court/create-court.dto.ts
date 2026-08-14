import { Area, City, CreateCourtInput } from '@shuttle-connect/types';
import { IsEnum, IsNumber, IsString, Length, Max, Min } from 'class-validator';
import {
  MAX_ADDRESS_LENGTH,
  MAX_NAME_LENGTH,
  MIN_ADDRESS_LENGTH,
  MIN_NAME_LENGTH,
} from '../../../domain/court';

export class CreateCourtDto implements CreateCourtInput {
  @IsString()
  @Length(MIN_NAME_LENGTH, MAX_NAME_LENGTH)
  name!: string;

  @IsString()
  @Length(MIN_ADDRESS_LENGTH, MAX_ADDRESS_LENGTH)
  address!: string;

  @IsEnum(Area)
  district!: Area;

  @IsEnum(City)
  city!: City;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}
