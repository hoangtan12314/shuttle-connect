import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  CreateSessionInput,
  MAX_PRICE_PER_PLAYER,
  MAX_SLOTS_PER_SESSION,
  ShuttleType,
  SkillLevel,
} from '@shuttle-connect/types';

export class CreateSessionDto implements CreateSessionInput {
  @IsString()
  courtId!: string;

  @IsISO8601()
  startTime!: string;

  @IsISO8601()
  endTime!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_SLOTS_PER_SESSION)
  slotsRemaining!: number;

  @IsInt()
  @Min(1)
  @Max(MAX_SLOTS_PER_SESSION)
  slotsTotal!: number;

  @IsNumber()
  @Min(0)
  @Max(MAX_PRICE_PER_PLAYER)
  priceMale!: number;

  @IsNumber()
  @Min(0)
  @Max(MAX_PRICE_PER_PLAYER)
  priceFemale!: number;

  @IsEnum(ShuttleType)
  shuttleType!: ShuttleType;

  @IsEnum(SkillLevel)
  minSkillLevel!: SkillLevel;

  @IsOptional()
  @IsString()
  description?: string;
}
