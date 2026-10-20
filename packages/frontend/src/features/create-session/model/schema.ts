import { z } from 'zod';
import { Area, City, ShuttleType, SkillLevel } from '@shuttle-connect/types';
import {
  MAX_SESSION_DURATION_MS,
  MAX_SESSION_HOURS,
} from '../lib/session-times';

// features/create-session/model: Zod schema mirroring CreateSessionInput (end > start, slots,
// etc.) -- server-side validation (CreateSessionDto's class-validator decorators, plus
// Session.validateTimeSlot's end>start/start>=now domain rules) stays the real backstop; this is
// just instant feedback so a bad submission doesn't round-trip to find out.
export const createSessionSchema = z
  .object({
    city: z.enum(City),
    area: z.enum(Area),
    courtId: z.string().min(1, 'Pick a court'),
    startTime: z.string().min(1, 'Pick a start time'),
    endTime: z.string().min(1, 'Pick an end time'),
    slotsTotal: z.number().int().min(1),
    minSkillLevel: z.enum(SkillLevel),
    priceMale: z.number().min(0),
    priceFemale: z.number().min(0),
    shuttleType: z.enum(ShuttleType),
    description: z.string().optional(),
  })
  .refine((data) => new Date(data.startTime) >= new Date(), {
    message: 'Start time must be in the future',
    path: ['startTime'],
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: 'End time must be after the start time',
    path: ['endTime'],
  })
  .refine(
    (data) =>
      new Date(data.endTime).getTime() - new Date(data.startTime).getTime() <=
      MAX_SESSION_DURATION_MS,
    {
      message: `A session can be at most ${MAX_SESSION_HOURS} hours long`,
      path: ['endTime'],
    },
  );

export type CreateSessionFormValues = z.infer<typeof createSessionSchema>;
