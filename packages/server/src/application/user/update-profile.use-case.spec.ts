// @typescript-eslint/unbound-method flags `expect(repo.someMethod).toHaveBeenCalledWith(...)`
// as an unbound method reference -- a real risk for a class instance method that reads `this`,
// but these are jest.fn() mocks with no `this` of their own, so the rule's concern doesn't apply.
/* eslint-disable @typescript-eslint/unbound-method */
import { MAX_FULL_NAME_LENGTH, SkillLevel } from '@shuttle-connect/types';
import { UpdateProfileUseCase } from './update-profile.use-case';
import type { UserRepository } from '../../domain/user';
import { InvalidFieldLengthError } from '../../domain/shared/errors';

function makeUserRepo(
  overrides: Partial<jest.Mocked<UserRepository>> = {},
): jest.Mocked<UserRepository> {
  return {
    findByAuthId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    completeOnboarding: jest.fn(),
    ...overrides,
  };
}

describe('UpdateProfileUseCase', () => {
  it('validates a non-empty fullName that is too long', async () => {
    const userRepo = makeUserRepo();
    const useCase = new UpdateProfileUseCase(userRepo);

    await expect(
      useCase.execute('user-1', { fullName: 'a'.repeat(MAX_FULL_NAME_LENGTH + 1) }),
    ).rejects.toThrow(InvalidFieldLengthError);
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('skips validation for an empty-string fullName -- "" is falsy, so the `if (input.fullName)` guard never runs it (pinning down current behavior, not endorsing it)', async () => {
    const userRepo = makeUserRepo({
      update: jest.fn().mockResolvedValue({ id: 'user-1', fullName: '' }),
    });
    const useCase = new UpdateProfileUseCase(userRepo);

    await useCase.execute('user-1', { fullName: '' });

    expect(userRepo.update).toHaveBeenCalledWith('user-1', { fullName: '', skillLevel: undefined });
  });

  it('skips name validation entirely when fullName is not provided (a skill-level-only update)', async () => {
    const userRepo = makeUserRepo({
      update: jest
        .fn()
        .mockResolvedValue({ id: 'user-1', skillLevel: SkillLevel.UPPER_INTERMEDIATE }),
    });
    const useCase = new UpdateProfileUseCase(userRepo);

    await useCase.execute('user-1', { skillLevel: SkillLevel.UPPER_INTERMEDIATE });

    expect(userRepo.update).toHaveBeenCalledWith('user-1', {
      fullName: undefined,
      skillLevel: SkillLevel.UPPER_INTERMEDIATE,
    });
  });

  it('passes both fields through to the repository on a valid update', async () => {
    const updated = { id: 'user-1', fullName: 'New Name', skillLevel: SkillLevel.INTERMEDIATE };
    const userRepo = makeUserRepo({ update: jest.fn().mockResolvedValue(updated) });
    const useCase = new UpdateProfileUseCase(userRepo);

    const result = await useCase.execute('user-1', {
      fullName: 'New Name',
      skillLevel: SkillLevel.INTERMEDIATE,
    });

    expect(result).toBe(updated);
  });
});
