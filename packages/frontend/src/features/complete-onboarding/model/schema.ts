// features/complete-onboarding/model: Zod schema mirroring CompleteOnboardingInput. Built from a
// factory taking the active translations so validation messages follow the UI language (the
// create-session form's hardcoded English messages are debt D11 -- not repeating that here).
// Server-side rules (CompleteOnboardingDto + User.assertValidFullName) stay the real backstop.
import { z } from 'zod';
import { MAX_FULL_NAME_LENGTH, SkillLevel } from '@shuttle-connect/types';
import type { Messages } from '@/shared/i18n';

export function makeOnboardingSchema(t: Messages) {
  return z.object({
    fullName: z.string().trim().min(1, t.nameReq).max(MAX_FULL_NAME_LENGTH),
    // No default and no .coerce: the picker hands over a real SkillLevel number or nothing.
    skillLevel: z.enum(SkillLevel, { error: t.levelReq }),
  });
}

export type OnboardingFormValues = z.infer<
  ReturnType<typeof makeOnboardingSchema>
>;
