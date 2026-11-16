import { z } from 'zod';
import {
  Area,
  City,
  MAX_PRICE_PER_PLAYER,
  MAX_SLOTS_PER_SESSION,
  ShuttleType,
  SkillLevel,
} from '@shuttle-connect/types';
import type { Messages } from '@/shared/i18n';
import {
  MAX_SESSION_DURATION_MS,
  MAX_SESSION_HOURS,
} from '../lib/session-times';

// features/create-session/model: Zod schema mirroring CreateSessionInput (end > start, slots,
// etc.) -- server-side validation (CreateSessionDto's class-validator decorators, plus
// Session.validateTimeSlot's end>start/start>=now domain rules) stays the real backstop; this is
// just instant feedback so a bad submission doesn't round-trip to find out. Built from a factory
// taking the active translations, same pattern as complete-onboarding/model/schema.ts -- was
// debt D11 (hardcoded English messages) until this.
export function makeCreateSessionSchema(t: Messages) {
  return z
    .object({
      city: z.enum(City),
      area: z.enum(Area),
      courtId: z.string().min(1, t.courtReq),
      startTime: z.string().min(1, t.startTimeReq),
      endTime: z.string().min(1, t.endTimeReq),
      slotsTotal: z.number().int().min(1).max(MAX_SLOTS_PER_SESSION),
      // Players already on the court before posting (the host, friends). Open slots = total - this.
      slotsFilled: z.number().int().min(0),
      minSkillLevel: z.enum(SkillLevel),
      priceMale: z.number().min(0).max(MAX_PRICE_PER_PLAYER),
      priceFemale: z.number().min(0).max(MAX_PRICE_PER_PLAYER),
      shuttleType: z.enum(ShuttleType),
      description: z.string().optional(),
    })
    .refine((data) => data.slotsFilled < data.slotsTotal, {
      message: t.slotsFilledErr,
      path: ['slotsFilled'],
    })
    .refine((data) => new Date(data.startTime) >= new Date(), {
      message: t.startTimeFutureErr,
      path: ['startTime'],
    })
    .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
      message: t.timeErr,
      path: ['endTime'],
    })
    .refine(
      (data) =>
        new Date(data.endTime).getTime() - new Date(data.startTime).getTime() <=
        MAX_SESSION_DURATION_MS,
      {
        message: `${t.maxDurationErrLead} ${MAX_SESSION_HOURS} ${t.maxDurationErrTrail}`,
        path: ['endTime'],
      },
    );
}

export type CreateSessionFormValues = z.infer<
  ReturnType<typeof makeCreateSessionSchema>
>;
