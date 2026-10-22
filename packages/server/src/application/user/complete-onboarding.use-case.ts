import { Inject, Injectable } from '@nestjs/common';
import { CompleteOnboardingInput, UserItemResponse } from '@shuttle-connect/types';
import { User, USER_REPOSITORY, type UserRepository } from '../../domain/user';

// First-login onboarding: the classic Cognito Hosted UI never collects a name or skill level, so
// provisioning falls back to the email prefix + BEGINNER. This is the user's one explicit chance
// to set both, and it marks them onboarded. Separate from UpdateProfileUseCase on purpose: here
// both fields are required and completing it is its own action (it sets the flag).
@Injectable()
export class CompleteOnboardingUseCase {
  constructor(@Inject(USER_REPOSITORY) private userRepository: UserRepository) {}

  async execute(userId: string, input: CompleteOnboardingInput): Promise<UserItemResponse> {
    const fullName = input.fullName.trim(); // "   " must not count as a name
    User.assertValidFullName(fullName);

    return this.userRepository.completeOnboarding(userId, {
      fullName,
      skillLevel: input.skillLevel,
    });
  }
}
