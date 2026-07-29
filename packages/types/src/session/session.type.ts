import { ShuttleType, SkillLevel } from "../enums";

export interface CreateSessionInput {
    courtId: string;
    startTime: string;
    endTime: string;
    slotsRemaining: number;
    slotsTotal: number;
    priceMale: number;
    priceFemale: number;
    shuttleType: ShuttleType;
    minSkillLevel: SkillLevel;
    description?: string;
}