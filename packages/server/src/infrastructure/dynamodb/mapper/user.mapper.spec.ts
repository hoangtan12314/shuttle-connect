import { SkillLevel } from '@shuttle-connect/types';
import { User } from '../../../domain/user';
import { UserMapper } from './user.mapper';

function makeUser(): User {
  return User.create({
    externalAuthId: 'auth-1',
    fullName: 'Nguyen Van A',
    email: 'player@example.com',
    skillLevel: SkillLevel.INTERMEDIATE,
  });
}

describe('UserMapper.toPersistence', () => {
  it('keys by USER#<id> and carries the profile fields', () => {
    const user = makeUser();
    const record = UserMapper.toPersistence(user);

    expect(record.PK).toBe(`USER#${user.id}`);
    expect(record.SK).toBe('META');
    expect(record.full_name).toBe('Nguyen Van A');
    expect(record.email).toBe('player@example.com');
    expect(record.skill_level).toBe(SkillLevel.INTERMEDIATE);
    expect(record).not.toHaveProperty('onboarded_at');
  });
});

describe('UserMapper.toResponse', () => {
  it('reports onboarded: false when onboarded_at is absent', () => {
    const user = makeUser();
    const record = UserMapper.toPersistence(user);

    expect(UserMapper.toResponse(record).onboarded).toBe(false);
  });

  it('reports onboarded: true when onboarded_at is present, even as epoch 0', () => {
    const user = makeUser();
    const record = { ...UserMapper.toPersistence(user), onboarded_at: 0 };

    expect(UserMapper.toResponse(record).onboarded).toBe(true);
  });

  it('derives id from the PK rather than carrying a separate id field', () => {
    const user = makeUser();
    const record = UserMapper.toPersistence(user);

    expect(UserMapper.toResponse(record).id).toBe(user.id);
  });
});

describe('UserMapper.toAuthPointer', () => {
  it('keys by AUTH#<externalAuthId> and points at the internal user id', () => {
    const user = makeUser();
    const pointer = UserMapper.toAuthPointer(user);

    expect(pointer.PK).toBe('AUTH#auth-1');
    expect(pointer.SK).toBe('META');
    expect(pointer.app_user_id).toBe(user.id);
  });
});
