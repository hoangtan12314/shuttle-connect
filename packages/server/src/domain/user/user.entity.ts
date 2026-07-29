import { SkillLevel } from '@shuttle-connect/types';
import { randomUUID } from 'crypto';
import { InvalidFieldLengthError } from '../shared/errors';
import { Email } from '../shared/value-objects';

export interface UserProps {
  externalAuthId: string;
  firstName: string;
  lastName: string;
  email: string;
  skillLevel: SkillLevel;
}

const MAX_NAME_LENGTH = 50;
const MIN_NAME_LENGTH = 1;

export class User {
  constructor(
    private id: string,
    private externalAuthId: string,
    private firstName: string,
    private lastName: string,
    private email: Email,
    private skillLevel: SkillLevel,
  ) {}

  static create(props: UserProps): User {
    if (props.firstName.length < MIN_NAME_LENGTH || props.firstName.length > MAX_NAME_LENGTH) {
      throw new InvalidFieldLengthError('firstName', MIN_NAME_LENGTH, MAX_NAME_LENGTH);
    }

    if (props.lastName.length < MIN_NAME_LENGTH || props.lastName.length > MAX_NAME_LENGTH) {
      throw new InvalidFieldLengthError('lastName', MIN_NAME_LENGTH, MAX_NAME_LENGTH);
    }

    return new User(
      randomUUID(),
      props.externalAuthId,
      props.firstName,
      props.lastName,
      Email.create(props.email),
      props.skillLevel,
    );
  }

  static fromPersistence(props: UserProps & { id: string }): User {
    return new User(
      props.id,
      props.externalAuthId,
      props.firstName,
      props.lastName,
      Email.create(props.email),
      props.skillLevel,
    );
  }

  updateSkillLevel(newSkillLevel: SkillLevel) {
    this.skillLevel = newSkillLevel;
  }

  toJSON() {
    return {
      id: this.id,
      externalAuthId: this.externalAuthId,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      skillLevel: this.skillLevel,
    };
  }
}
