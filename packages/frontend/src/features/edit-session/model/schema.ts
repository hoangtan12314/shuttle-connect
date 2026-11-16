import { z } from 'zod';
import {
  MAX_PRICE_PER_PLAYER,
  MAX_SLOTS_PER_SESSION,
  ShuttleType,
  SkillLevel,
} from '@shuttle-connect/types';

// features/edit-session/model: the fields PATCH /sessions/:id accepts (court and time are locked,
// see UpdateSessionInput). `filledSlots` is the floor for the total: players already approved
// can't be un-seated by shrinking the session -- the server enforces the same rule
// (Session.resizeSlots); this just gives instant feedback.
export function makeEditSessionSchema(filledSlots: number) {
  return z.object({
    slotsTotal: z
      .number()
      .int()
      .min(Math.max(1, filledSlots))
      .max(MAX_SLOTS_PER_SESSION),
    minSkillLevel: z.enum(SkillLevel),
    priceMale: z.number().min(0).max(MAX_PRICE_PER_PLAYER),
    priceFemale: z.number().min(0).max(MAX_PRICE_PER_PLAYER),
    shuttleType: z.enum(ShuttleType),
    description: z.string().max(500),
  });
}

export type EditSessionFormValues = z.infer<
  ReturnType<typeof makeEditSessionSchema>
>;
