import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import {
  SkillLevel,
  UpdateProfileInput,
} from '@shuttle-connect/types';
import { MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '../../../domain/user';

export class UpdateProfileDto implements UpdateProfileInput {
  @IsOptional()
  @IsString()
  @Length(MIN_NAME_LENGTH, MAX_NAME_LENGTH)
  fullName?: string;

  @IsOptional()
  @IsEnum(SkillLevel)
  skillLevel?: SkillLevel;
}
