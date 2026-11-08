import { SkillLevel } from '@shuttle-connect/types';
import { User, MAX_NAME_LENGTH, MIN_NAME_LENGTH } from './user.entity';
import { InvalidEmailError, InvalidFieldLengthError } from '../shared/errors';

const BASE_PROPS = {
  externalAuthId: 'auth-1',
  fullName: 'Nguyen Van A',
  email: 'player@example.com',
  skillLevel: SkillLevel.INTERMEDIATE,
};

describe('User.create', () => {
  it('creates a user with a lowercased email and the given skill level', () => {
    const user = User.create({ ...BASE_PROPS, email: 'Player@Example.com' });
    expect(user.toJSON()).toMatchObject({
      externalAuthId: 'auth-1',
      fullName: 'Nguyen Van A',
      email: 'player@example.com',
      skillLevel: SkillLevel.INTERMEDIATE,
    });
    expect(user.id).toEqual(expect.any(String));
  });

  it('defaults skillLevel to BEGINNER when not provided', () => {
    const user = User.create({ ...BASE_PROPS, skillLevel: undefined as never });
    expect(user.toJSON().skillLevel).toBe(SkillLevel.BEGINNER);
  });

  it('throws InvalidFieldLengthError for a name shorter than the minimum', () => {
    expect(() => User.create({ ...BASE_PROPS, fullName: '' })).toThrow(InvalidFieldLengthError);
  });

  it('throws InvalidFieldLengthError for a name longer than the maximum', () => {
    expect(() => User.create({ ...BASE_PROPS, fullName: 'a'.repeat(MAX_NAME_LENGTH + 1) })).toThrow(
      InvalidFieldLengthError,
    );
  });

  it('throws InvalidEmailError for a malformed email, before any entity is constructed', () => {
    expect(() => User.create({ ...BASE_PROPS, email: 'not-an-email' })).toThrow(InvalidEmailError);
  });
});

describe('User.assertValidFullName', () => {
  it('accepts a name at exactly the minimum length', () => {
    expect(() => User.assertValidFullName('a'.repeat(MIN_NAME_LENGTH))).not.toThrow();
  });

  it('accepts a name at exactly the maximum length', () => {
    expect(() => User.assertValidFullName('a'.repeat(MAX_NAME_LENGTH))).not.toThrow();
  });

  it('rejects a name one character over the maximum', () => {
    expect(() => User.assertValidFullName('a'.repeat(MAX_NAME_LENGTH + 1))).toThrow(
      InvalidFieldLengthError,
    );
  });
});
