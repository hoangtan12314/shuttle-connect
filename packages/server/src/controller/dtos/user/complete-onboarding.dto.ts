import { IsEnum, IsString, Length } from 'class-validator';
import { CompleteOnboardingInput, SkillLevel } from '@shuttle-connect/types';
import { MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '../../../domain/user';

// Same rules as UpdateProfileDto, minus @IsOptional: onboarding requires both fields.
export class CompleteOnboardingDto implements CompleteOnboardingInput {
  @IsString()
  @Length(MIN_NAME_LENGTH, MAX_NAME_LENGTH)
  fullName!: string;

  @IsEnum(SkillLevel)
  skillLevel!: SkillLevel;
}
