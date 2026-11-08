// @typescript-eslint/unbound-method flags `expect(repo.someMethod).toHaveBeenCalledWith(...)`
// as an unbound method reference -- a real risk for a class instance method that reads `this`,
// but these are jest.fn() mocks with no `this` of their own, so the rule's concern doesn't apply.
/* eslint-disable @typescript-eslint/unbound-method */
import { SkillLevel } from '@shuttle-connect/types';
import { CompleteOnboardingUseCase } from './complete-onboarding.use-case';
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

describe('CompleteOnboardingUseCase', () => {
  it('trims the name before persisting it', async () => {
    const userRepo = makeUserRepo({
      completeOnboarding: jest.fn().mockResolvedValue({ id: 'user-1' }),
    });
    const useCase = new CompleteOnboardingUseCase(userRepo);

    await useCase.execute('user-1', {
      fullName: '  Nguyen Van A  ',
      skillLevel: SkillLevel.INTERMEDIATE,
    });

    expect(userRepo.completeOnboarding).toHaveBeenCalledWith('user-1', {
      fullName: 'Nguyen Van A',
      skillLevel: SkillLevel.INTERMEDIATE,
    });
  });

  it('rejects a whitespace-only name as empty, after trimming', async () => {
    const userRepo = makeUserRepo();
    const useCase = new CompleteOnboardingUseCase(userRepo);

    await expect(
      useCase.execute('user-1', { fullName: '   ', skillLevel: SkillLevel.BEGINNER }),
    ).rejects.toThrow(InvalidFieldLengthError);
    expect(userRepo.completeOnboarding).not.toHaveBeenCalled();
  });
});
