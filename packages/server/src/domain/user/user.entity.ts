import { MAX_FULL_NAME_LENGTH, MIN_FULL_NAME_LENGTH, SkillLevel } from '@shuttle-connect/types';
import { randomUUID } from 'crypto';
import { InvalidFieldLengthError } from '../shared/errors';
import { Email } from '../shared/value-objects';

export interface UserProps {
  externalAuthId: string;
  fullName: string;
  email: string;
  skillLevel: SkillLevel;
}

// Re-exported under these names so existing consumers (UpdateProfileDto,
// CompleteOnboardingDto, ...) don't need to change -- only the source of the values moved, to
// @shuttle-connect/types, so the frontend's onboarding form can read the same numbers instead of
// hardcoding its own copy (see MAX_SESSION_HOURS for the established pattern).
export const MAX_NAME_LENGTH = MAX_FULL_NAME_LENGTH;
export const MIN_NAME_LENGTH = MIN_FULL_NAME_LENGTH;

export class User {
  private constructor(
    public readonly id: string,
    private externalAuthId: string,
    private fullName: string,
    private email: Email,
    private skillLevel: SkillLevel,
    private createdAt: Date,
  ) {}

  static create(props: UserProps): User {
    User.assertValidFullName(props.fullName);

    return new User(
      randomUUID(),
      props.externalAuthId,
      props.fullName,
      Email.create(props.email),
      props.skillLevel ?? SkillLevel.BEGINNER,
      new Date(),
    );
  }

  static assertValidFullName(fullName: string): void {
    if (fullName.length < MIN_NAME_LENGTH || fullName.length > MAX_NAME_LENGTH) {
      throw new InvalidFieldLengthError('fullName', MIN_NAME_LENGTH, MAX_NAME_LENGTH);
    }
  }

  toJSON() {
    return {
      id: this.id,
      externalAuthId: this.externalAuthId,
      email: this.email.email,
      fullName: this.fullName,
      skillLevel: this.skillLevel,
      createdAt: this.createdAt,
    };
  }
}
