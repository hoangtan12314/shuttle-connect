export class InvalidSlotValuesError extends Error {
    constructor(slotsRemaining: number, slotsTotal: number) {
        super(`Invalid slot values: slotsRemaining (${slotsRemaining}) cannot be less than 0 or greater than slotsTotal (${slotsTotal}).`);
        this.name = "InvalidSlotValuesError";
    }
}

export class SessionFullError extends Error {
    constructor() {
        super("Session is full. No slots remaining.");
        this.name = "SessionFullError";
    }
}

export class SessionNotOpenError extends Error {
    constructor(sessionStatus: string) {
        super(`Session is not open for registration. Current status: ${sessionStatus}`);
        this.name = "SessionNotOpenError";
    }
}