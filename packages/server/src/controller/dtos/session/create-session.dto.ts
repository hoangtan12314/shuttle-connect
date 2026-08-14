import { IsEnum, IsInt, IsISO8601, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CreateSessionInput, ShuttleType, SkillLevel } from '@shuttle-connect/types';

export class CreateSessionDto implements CreateSessionInput {
  @IsString()
  courtId!: string;

  @IsISO8601()
  startTime!: string;

  @IsISO8601()
  endTime!: string;

  @IsInt()
  @Min(1)
  slotsRemaining!: number;

  @IsInt()
  @Min(1)
  slotsTotal!: number;

  @IsNumber()
  priceMale!: number;

  @IsNumber()
  priceFemale!: number;

  @IsEnum(ShuttleType)
  shuttleType!: ShuttleType;

  @IsEnum(SkillLevel)
  minSkillLevel!: SkillLevel;

  @IsOptional()
  @IsString()
  description?: string;
}
