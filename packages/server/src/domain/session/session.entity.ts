import { randomUUID } from 'crypto';
import { InvalidSlotValuesError, SessionFullError, SessionNotOpenError } from "./session.error";

export enum SessionStatus {
    OPEN = "OPEN",
    FULL = "FULL",
    CANCELLED = "CANCELLED"
}

export interface SessionProps {
    courtId: string;
    hostId: string;
    startTime: Date;
    endTime: Date;
    slotsRemaining: number;
    slotsTotal: number;
    status: SessionStatus;
    priceMale: number;
    priceFemale: number;
    shuttleType: string;
    minSkillLevel: string;
}

export class Session {
    public readonly id: string;
    private courtId: string;
    private hostId: string;
    private startTime: Date;
    private endTime: Date;
    private slotsRemaining: number;
    private slotsTotal: number;
    private status: SessionStatus;
    private priceMale: number;
    private priceFemale: number;
    private shuttleType: string;
    private minSkillLevel: string;
    private version: number;
    private createdAt: Date = new Date();

    constructor({
        courtId,
        hostId,
        startTime,
        endTime,
        slotsRemaining,
        slotsTotal,
        status,
        priceMale,
        priceFemale,
        shuttleType,
        minSkillLevel
    }: SessionProps) {
        if (slotsRemaining < 0 || slotsRemaining > slotsTotal) {
            throw new InvalidSlotValuesError(slotsRemaining, slotsTotal);
        }

        this.id = randomUUID();
        this.courtId = courtId;
        this.hostId = hostId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.slotsRemaining = slotsRemaining;
        this.slotsTotal = slotsTotal;
        this.status = status;
        this.priceMale = priceMale;
        this.priceFemale = priceFemale;
        this.shuttleType = shuttleType;
        this.minSkillLevel = minSkillLevel;
        this.createdAt = new Date();
        this.version = 1;
    }

    fillSlot(): void {
        if (this.status !== SessionStatus.OPEN) {
            throw new SessionNotOpenError(this.status);
        }

        if (this.slotsRemaining <= 0) {
            throw new SessionFullError();
        }

        this.slotsRemaining -= 1;
    }


    toJSON() {
        return {
            id: this.id,
            courtId: this.courtId,
            hostId: this.hostId,
            startTime: this.startTime,
            endTime: this.endTime,
            slotsRemaining: this.slotsRemaining,
            slotsTotal: this.slotsTotal,
            status: this.status,
            priceMale: this.priceMale,
            priceFemale: this.priceFemale,
            shuttleType: this.shuttleType,
            minSkillLevel: this.minSkillLevel
        };
    }
}
