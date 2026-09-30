import { SkillLevel } from '@shuttle-connect/types';
import { randomUUID } from 'crypto';
import { InvalidFieldLengthError } from '../shared/errors';
import { Email } from '../shared/value-objects';

export interface UserProps {
  externalAuthId: string;
  fullName: string;
  email: string;
  skillLevel: SkillLevel;
}

export const MAX_NAME_LENGTH = 50;
export const MIN_NAME_LENGTH = 1;

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
    if (props.fullName.length < MIN_NAME_LENGTH || props.fullName.length > MAX_NAME_LENGTH) {
      throw new InvalidFieldLengthError('fullName', MIN_NAME_LENGTH, MAX_NAME_LENGTH);
    }

    return new User(
      randomUUID(),
      props.externalAuthId,
      props.fullName,
      Email.create(props.email),
      props.skillLevel ?? SkillLevel.BEGINNER,
      new Date(),
    );
  }

  updateSkillLevel(newSkillLevel: SkillLevel) {
    this.skillLevel = newSkillLevel;
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
