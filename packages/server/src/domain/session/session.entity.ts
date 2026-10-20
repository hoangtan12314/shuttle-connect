import { randomUUID } from 'crypto';
import { MAX_SESSION_HOURS, SessionStatus, SkillLevel } from '@shuttle-connect/types';
import { InvalidSlotValuesError, SessionFullError, SessionNotOpenError } from './session.error';
import {
  InvalidFieldLengthError,
  InvalidSessionTimeError,
  SessionTooLongError,
} from '../shared/errors';

const MAX_SESSION_DURATION_MS = MAX_SESSION_HOURS * 60 * 60 * 1000;

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
  minSkillLevel: SkillLevel;
  description?: string;
}

const MAX_DESCRIPTION_LENGTH = 500;

export class Session {
  private constructor(
    private id: string,
    public readonly courtId: string,
    private hostId: string,
    private startTime: Date,
    private endTime: Date,
    private slotsRemaining: number,
    private slotsTotal: number,
    private status: SessionStatus,
    private priceMale: number,
    private priceFemale: number,
    private shuttleType: string,
    private minSkillLevel: SkillLevel,
    private description: string,
    private createdAt: Date,
  ) {}

  static create(props: SessionProps): Session {
    if (props.slotsRemaining < 0 || props.slotsRemaining > props.slotsTotal) {
      throw new InvalidSlotValuesError(props.slotsRemaining, props.slotsTotal);
    }

    if (
      props.description &&
      (props.description.length === 0 || props.description.length > MAX_DESCRIPTION_LENGTH)
    ) {
      throw new InvalidFieldLengthError('description', 0, MAX_DESCRIPTION_LENGTH);
    }

    this.validateTimeSlot(props.startTime, props.endTime);

    return new Session(
      randomUUID(),
      props.courtId,
      props.hostId,
      props.startTime,
      props.endTime,
      props.slotsRemaining,
      props.slotsTotal,
      props.status,
      props.priceMale,
      props.priceFemale,
      props.shuttleType,
      props.minSkillLevel,
      props.description ? props.description : '',
      new Date(),
    );
  }

  static fromPersistence(props: SessionProps & { id: string; createdAt: Date }): Session {
    return new Session(
      props.id,
      props.courtId,
      props.hostId,
      props.startTime,
      props.endTime,
      props.slotsRemaining,
      props.slotsTotal,
      props.status,
      props.priceMale,
      props.priceFemale,
      props.shuttleType,
      props.minSkillLevel,
      props.description ? props.description : '',
      props.createdAt,
    );
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

  static validateTimeSlot(startTime: Date, endTime: Date) {
    if (startTime >= endTime) {
      throw new InvalidSessionTimeError(startTime, endTime);
    }

    if (startTime < new Date()) {
      throw new InvalidSessionTimeError(startTime, endTime);
    }

    if (endTime.getTime() - startTime.getTime() > MAX_SESSION_DURATION_MS) {
      throw new SessionTooLongError(startTime, endTime);
    }
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
      minSkillLevel: this.minSkillLevel,
      description: this.description,
      createdAt: this.createdAt,
    };
  }
}
