// features/update-profile/model: Zod schema mirroring UpdateProfileInput. Both fields are
// optional on the wire (a partial PATCH), but the form always edits a fully-loaded profile, so
// both are required from the user's perspective here -- same shape as
// features/complete-onboarding/model/schema.ts, kept separate rather than shared since the two
// forms serve different moments (first-login vs. an existing profile) and would only coincidentally
// match today.
import { z } from 'zod';
import { MAX_FULL_NAME_LENGTH, SkillLevel } from '@shuttle-connect/types';
import type { Messages } from '@/shared/i18n';

export function makeUpdateProfileSchema(t: Messages) {
  return z.object({
    fullName: z.string().trim().min(1, t.nameReq).max(MAX_FULL_NAME_LENGTH),
    skillLevel: z.enum(SkillLevel, { error: t.levelReq }),
  });
}

export type UpdateProfileFormValues = z.infer<
  ReturnType<typeof makeUpdateProfileSchema>
>;
