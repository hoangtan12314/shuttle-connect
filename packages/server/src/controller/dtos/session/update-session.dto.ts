import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MAX_PRICE_PER_PLAYER,
  MAX_SLOTS_PER_SESSION,
  ShuttleType,
  SkillLevel,
  UpdateSessionInput,
} from '@shuttle-connect/types';

export class UpdateSessionDto implements UpdateSessionInput {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_SLOTS_PER_SESSION)
  slotsTotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_PRICE_PER_PLAYER)
  priceMale?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(MAX_PRICE_PER_PLAYER)
  priceFemale?: number;

  @IsOptional()
  @IsEnum(ShuttleType)
  shuttleType?: ShuttleType;

  @IsOptional()
  @IsEnum(SkillLevel)
  minSkillLevel?: SkillLevel;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
