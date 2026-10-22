import { SkillLevel } from "../enums";

export interface UserItemResponse {
  id: string;
  fullName: string;
  email: string;
  skillLevel: SkillLevel;
  createdAt: string;
  // False until the user completes first-login onboarding (PATCH /api/v1/users/me/onboarding). The
  // classic Cognito Hosted UI never collects a name or level, so the app does it itself.
  onboarded: boolean;
}

export interface UpdateProfileInput {
  skillLevel?: SkillLevel,
  fullName?: string
}

export interface CompleteOnboardingInput {
  fullName: string;
  skillLevel: SkillLevel;
}
